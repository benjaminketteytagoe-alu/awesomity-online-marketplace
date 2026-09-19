package com.marketplace.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end HTTP tests for the auth flow.
 * Uses the real Spring context against a Testcontainers Postgres.
 */
class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;

    @Test
    void register_verify_login_me_happyPath() throws Exception {
        // 1. Register
        var registerBody = Map.of(
                "name", "Alice Test",
                "email", "alice@example.com",
                "password", "password123"
        );

        ResponseEntity<String> registerResp = http.postForEntity(
                baseUrl() + "/api/auth/register",
                jsonEntity(registerBody),
                String.class);

        assertThat(registerResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode register = objectMapper.readTree(registerResp.getBody());
        assertThat(register.get("email").asText()).isEqualTo("alice@example.com");
        assertThat(register.get("status").asText()).isEqualTo("PENDING_VERIFICATION");

        // 2. Extract verification token from DB (the app has already sent the email async)
        String token = waitForVerifyToken("alice@example.com");
        assertThat(token).isNotBlank();

        // 3. Verify
        ResponseEntity<String> verifyResp = http.getForEntity(
                baseUrl() + "/api/auth/verify?token=" + token,
                String.class);
        assertThat(verifyResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode verify = objectMapper.readTree(verifyResp.getBody());
        assertThat(verify.get("status").asText()).isEqualTo("ACTIVE");

        // 4. Login
        var loginBody = Map.of("email", "alice@example.com", "password", "password123");
        ResponseEntity<String> loginResp = http.postForEntity(
                baseUrl() + "/api/auth/login",
                jsonEntity(loginBody),
                String.class);
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode login = objectMapper.readTree(loginResp.getBody());
        String accessToken = login.get("accessToken").asText();
        assertThat(accessToken).isNotBlank();
        assertThat(login.get("user").get("role").asText()).isEqualTo("SHOPPER");

        // 5. GET /me with the token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        ResponseEntity<String> meResp = http.exchange(
                baseUrl() + "/api/auth/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);
        assertThat(meResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode me = objectMapper.readTree(meResp.getBody());
        assertThat(me.get("email").asText()).isEqualTo("alice@example.com");
        assertThat(me.get("role").asText()).isEqualTo("SHOPPER");
    }

    @Test
    void register_duplicateEmail_returns409() {
        var body = Map.of(
                "name", "Alice Test",
                "email", "alice@example.com",
                "password", "password123"
        );

        http.postForEntity(baseUrl() + "/api/auth/register", jsonEntity(body), String.class);

        ResponseEntity<String> second = http.postForEntity(
                baseUrl() + "/api/auth/register",
                jsonEntity(body),
                String.class);

        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(second.getBody()).contains("EMAIL_ALREADY_REGISTERED");
    }

    @Test
    void register_weakPassword_returns400() {
        var body = Map.of(
                "name", "Weak User",
                "email", "weak@example.com",
                "password", "short"
        );

        ResponseEntity<String> resp = http.postForEntity(
                baseUrl() + "/api/auth/register",
                jsonEntity(body),
                String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody()).contains("VALIDATION_FAILED");
    }

    @Test
    void login_unverifiedUser_returns401() {
        // Register but do NOT verify
        http.postForEntity(
                baseUrl() + "/api/auth/register",
                jsonEntity(Map.of(
                        "name", "Unverified",
                        "email", "unverified@example.com",
                        "password", "password123")),
                String.class);

        var login = Map.of("email", "unverified@example.com", "password", "password123");
        ResponseEntity<String> resp = http.postForEntity(
                baseUrl() + "/api/auth/login",
                jsonEntity(login),
                String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(resp.getBody()).contains("Email not verified");
    }

    @Test
    void login_wrongPassword_returns401() {
        // Fast path: register + verify + login wrong
        http.postForEntity(
                baseUrl() + "/api/auth/register",
                jsonEntity(Map.of(
                        "name", "Bob",
                        "email", "bob@example.com",
                        "password", "password123")),
                String.class);

        String token = waitForVerifyToken("bob@example.com");
        http.getForEntity(baseUrl() + "/api/auth/verify?token=" + token, String.class);

        var badLogin = Map.of("email", "bob@example.com", "password", "wrongpassword");
        ResponseEntity<String> resp = http.postForEntity(
                baseUrl() + "/api/auth/login",
                jsonEntity(badLogin),
                String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(resp.getBody()).contains("Invalid email or password");
    }

    @Test
    void me_withoutToken_returns401() {
        ResponseEntity<String> resp = http.getForEntity(baseUrl() + "/api/auth/me", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ---------------- helpers ----------------

    private HttpEntity<String> jsonEntity(Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            return new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Wait up to 3 seconds for the async email consumer to have persisted
     * a verify_token for the given email. Returns the token.
     *
     * The registration flow publishes an email job via RabbitMQ; the consumer
     * reads it and calls MailService. But the TOKEN itself is written to
     * the DB synchronously during register(), so it should already be there.
     * We still poll to allow for timing edge cases.
     */
    private String waitForVerifyToken(String email) {
        for (int i = 0; i < 30; i++) {
            String token = jdbc.queryForObject(
                    "SELECT verify_token FROM users WHERE email = ?",
                    String.class, email);
            if (token != null && !token.isBlank()) return token;
            try { Thread.sleep(100); } catch (InterruptedException ignored) {}
        }
        throw new AssertionError("No verify_token appeared for " + email);
    }
}
