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

class AdminManagementIntegrationTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private UUID sellerId;
    private UUID storeId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        // Admin
        UUID adminId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, 'Admin', 'ADMIN', 'ACTIVE', now(), now(), now())
                """,
                adminId, "admin@test.local",
                passwordEncoder.encode("AdminPass1234"));
        adminToken = login("admin@test.local", "AdminPass1234");

        // Seller + store + product (for store cascade test)
        sellerId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, 'Carol', 'SELLER', 'ACTIVE', now(), now(), now())
                """,
                sellerId, "seller@test.local",
                passwordEncoder.encode("SellerPass123"));
        storeId = UUID.randomUUID();
        jdbc.update("INSERT INTO stores (id, owner_id, name, created_at, updated_at) VALUES (?, ?, 'Store', now(), now())",
                storeId, sellerId);
        UUID catId = UUID.randomUUID();
        jdbc.update("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, 'Electronics', 'electronics', now(), now())",
                catId);
        productId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO products (id, store_id, category_id, name, price, stock, featured, created_at, updated_at)
                VALUES (?, ?, ?, 'Test Product', 10.00, 5, false, now(), now())
                """, productId, storeId, catId);
    }

    @Test
    void adminCanSuspendAndReactivateUser() throws Exception {
        // Suspend the seller
        ResponseEntity<String> suspend = http.exchange(
                baseUrl() + "/api/admin/users/" + sellerId + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("status", "SUSPENDED")), bearer(adminToken)),
                String.class);
        assertThat(suspend.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(suspend.getBody()).contains("SUSPENDED");

        // Seller login now fails
        ResponseEntity<String> loginAttempt = http.postForEntity(
                baseUrl() + "/api/auth/login",
                new HttpEntity<>(jsonString(Map.of("email", "seller@test.local", "password", "SellerPass123")),
                        new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }}),
                String.class);
        assertThat(loginAttempt.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Reactivate
        ResponseEntity<String> reactivate = http.exchange(
                baseUrl() + "/api/admin/users/" + sellerId + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("status", "ACTIVE")), bearer(adminToken)),
                String.class);
        assertThat(reactivate.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void adminCannotSelfSuspend() throws Exception {
        UUID adminId = jdbc.queryForObject(
                "SELECT id FROM users WHERE email = 'admin@test.local'",
                UUID.class);
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/users/" + adminId + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("status", "SUSPENDED")), bearer(adminToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody()).contains("SELF_SUSPEND");
    }

    @Test
    void adminDeletesStore_cascadesToProducts() throws Exception {
        // Before: 1 live product
        assertThat(liveProductCount()).isEqualTo(1L);

        // Delete store
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/stores/" + storeId,
                HttpMethod.DELETE,
                new HttpEntity<>(bearer(adminToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // After: 0 live products (soft-deleted)
        assertThat(liveProductCount()).isZero();
        assertThat(deletedProductCount()).isEqualTo(1L);
    }

    // ---------------- helpers ----------------

    private long liveProductCount() {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM products WHERE store_id = ? AND deleted_at IS NULL",
                Long.class, storeId);
    }

    private long deletedProductCount() {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM products WHERE store_id = ? AND deleted_at IS NOT NULL",
                Long.class, storeId);
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(token);
        return h;
    }

    private String jsonString(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String login(String email, String password) {
        try {
            ResponseEntity<String> resp = http.postForEntity(
                    baseUrl() + "/api/auth/login",
                    new HttpEntity<>(
                            jsonString(Map.of("email", email, "password", password)),
                            new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }}),
                    String.class);
            return objectMapper.readTree(resp.getBody()).get("accessToken").asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
