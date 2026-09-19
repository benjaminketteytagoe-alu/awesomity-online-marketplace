package com.marketplace.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SellerApplicationFlowTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void seedAdminAndLogin() throws Exception {
        // Seed an admin directly in the DB (bypasses AdminSeeder since it only
        // runs once per JVM and we're truncating between tests).
        UUID adminId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', now(), now(), now())
                """,
                adminId, "admin@test.local",
                passwordEncoder.encode("AdminPass1234"),
                "Test Admin");

        adminToken = login("admin@test.local", "AdminPass1234");
    }

    @Test
    void applyThenAdminApprovesThenApplicantAccepts() throws Exception {
        // 1. Apply as a seller
        var applyBody = Map.of(
                "name", "Carol Seller",
                "email", "carol@example.com",
                "shopName", "Carol Crafts",
                "description", "Handmade goods"
        );

        ResponseEntity<String> applyResp = http.postForEntity(
                baseUrl() + "/api/seller-applications",
                jsonEntity(applyBody),
                String.class);

        assertThat(applyResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode apply = objectMapper.readTree(applyResp.getBody());
        UUID applicationId = UUID.fromString(apply.get("id").asText());
        assertThat(apply.get("status").asText()).isEqualTo("PENDING");

        // 2. Duplicate apply is rejected
        ResponseEntity<String> dupResp = http.postForEntity(
                baseUrl() + "/api/seller-applications",
                jsonEntity(applyBody),
                String.class);
        assertThat(dupResp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(dupResp.getBody()).contains("APPLICATION_PENDING");

        // 3. Admin lists pending
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setBearerAuth(adminToken);
        ResponseEntity<String> listResp = http.exchange(
                baseUrl() + "/api/admin/seller-applications?status=PENDING",
                HttpMethod.GET,
                new HttpEntity<>(adminHeaders),
                String.class);
        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResp.getBody()).contains("carol@example.com");

        // 4. Admin approves
        ResponseEntity<String> approveResp = http.exchange(
                baseUrl() + "/api/admin/seller-applications/" + applicationId + "/approve",
                HttpMethod.POST,
                new HttpEntity<>(adminHeaders),
                String.class);
        assertThat(approveResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 5. Extract the invite token from the DB
        String inviteToken = jdbc.queryForObject(
                "SELECT invite_token FROM seller_applications WHERE id = ?",
                String.class, applicationId);
        assertThat(inviteToken).isNotBlank();

        // 6. Accept the invite — creates user + store
        var acceptBody = Map.of(
                "inviteToken", inviteToken,
                "password", "carolPass123"
        );
        ResponseEntity<String> acceptResp = http.postForEntity(
                baseUrl() + "/api/seller-applications/accept",
                jsonEntity(acceptBody),
                String.class);
        assertThat(acceptResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode accept = objectMapper.readTree(acceptResp.getBody());
        assertThat(accept.get("role").asText()).isEqualTo("SELLER");
        assertThat(accept.get("status").asText()).isEqualTo("ACTIVE");
        UUID userId = UUID.fromString(accept.get("userId").asText());

        // 7. Verify DB state
        Long userCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ? AND role = 'SELLER'",
                Long.class, userId);
        assertThat(userCount).isEqualTo(1L);

        Long storeCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stores WHERE owner_id = ? AND name = 'Carol Crafts'",
                Long.class, userId);
        assertThat(storeCount).isEqualTo(1L);

        // 8. Invite token was consumed
        String tokenAfter = jdbc.queryForObject(
                "SELECT invite_token FROM seller_applications WHERE id = ?",
                String.class, applicationId);
        assertThat(tokenAfter).isNull();

        // 9. Seller can log in and hit /api/seller/ping
        String sellerToken = login("carol@example.com", "carolPass123");
        HttpHeaders sellerHeaders = new HttpHeaders();
        sellerHeaders.setBearerAuth(sellerToken);
        ResponseEntity<String> pingResp = http.exchange(
                baseUrl() + "/api/seller/ping",
                HttpMethod.GET,
                new HttpEntity<>(sellerHeaders),
                String.class);
        assertThat(pingResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pingResp.getBody()).contains("seller");
    }

    @Test
    void nonAdminCannotListApplications() throws Exception {
        // Register + verify a shopper
        http.postForEntity(baseUrl() + "/api/auth/register",
                jsonEntity(Map.of("name", "Shopper", "email", "shopper@example.com", "password", "password123")),
                String.class);
        String verifyToken = jdbc.queryForObject(
                "SELECT verify_token FROM users WHERE email = ?",
                String.class, "shopper@example.com");
        http.getForEntity(baseUrl() + "/api/auth/verify?token=" + verifyToken, String.class);

        String shopperToken = login("shopper@example.com", "password123");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(shopperToken);
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/seller-applications",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void cannotApproveTwice() throws Exception {
        // Apply
        ResponseEntity<String> applyResp = http.postForEntity(
                baseUrl() + "/api/seller-applications",
                jsonEntity(Map.of(
                        "name", "Dan",
                        "email", "dan@example.com",
                        "shopName", "Dan's Shop")),
                String.class);
        UUID appId = UUID.fromString(
                objectMapper.readTree(applyResp.getBody()).get("id").asText());

        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setBearerAuth(adminToken);

        // First approve succeeds
        http.exchange(baseUrl() + "/api/admin/seller-applications/" + appId + "/approve",
                HttpMethod.POST, new HttpEntity<>(adminHeaders), String.class);

        // Second approve conflicts
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/seller-applications/" + appId + "/approve",
                HttpMethod.POST,
                new HttpEntity<>(adminHeaders),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resp.getBody()).contains("INVALID_STATE");
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

    private String login(String email, String password) {
        try {
            ResponseEntity<String> resp = http.postForEntity(
                    baseUrl() + "/api/auth/login",
                    jsonEntity(Map.of("email", email, "password", password)),
                    String.class);
            if (resp.getStatusCode() != HttpStatus.OK) {
                throw new AssertionError("Login failed: " + resp.getStatusCode() + " " + resp.getBody());
            }
            return objectMapper.readTree(resp.getBody()).get("accessToken").asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
