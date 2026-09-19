package com.marketplace.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrderFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String shopperToken;
    private String sellerToken;
    private UUID shopperId;
    private UUID sellerId;
    private UUID storeId;
    private UUID categoryId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        // Shopper
        shopperId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, 'Ben Shopper', 'SHOPPER', 'ACTIVE', now(), now(), now())
                """,
                shopperId, "shopper@test.local",
                passwordEncoder.encode("ShopperPass123"));
        shopperToken = login("shopper@test.local", "ShopperPass123");

        // Seller + store
        sellerId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, 'Carol Seller', 'SELLER', 'ACTIVE', now(), now(), now())
                """,
                sellerId, "seller@test.local",
                passwordEncoder.encode("SellerPass123"));
        storeId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO stores (id, owner_id, name, created_at, updated_at)
                VALUES (?, ?, 'Test Store', now(), now())
                """,
                storeId, sellerId);
        sellerToken = login("seller@test.local", "SellerPass123");

        // Category + product
        categoryId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO categories (id, name, slug, created_at, updated_at)
                VALUES (?, 'Electronics', 'electronics', now(), now())
                """,
                categoryId);
        productId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO products (id, store_id, category_id, name, price, stock, featured, created_at, updated_at)
                VALUES (?, ?, ?, 'Test Vase', 49.99, 10, false, now(), now())
                """,
                productId, storeId, categoryId);
    }

    @Test
    void placeOrder_thenPay_asyncConfirmsAndDecrementsStock() throws Exception {
        // 1. Place order
        UUID orderId = placeOrder(2);

        // 2. Verify PENDING and stock unchanged
        JsonNode order = getOrder(orderId);
        assertThat(order.get("status").asText()).isEqualTo("PENDING");
        assertThat(currentStock()).isEqualTo(10);

        // 3. Pay
        payWithCard(orderId, "4242424242424242");

        // 4. Await async processing
        Awaitility.await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            JsonNode o = getOrder(orderId);
            assertThat(o.get("status").asText()).isEqualTo("PAID");
        });

        // 5. Stock decremented by quantity
        assertThat(currentStock()).isEqualTo(8);
    }

    @Test
    void insufficientStock_cancelsOrder_rollsBackStock() throws Exception {
        // Place order for a valid quantity (<=100) that exceeds available stock (10).
        // 999 is rejected by @Max(100) validation before reaching the order pipeline.
        UUID orderId = placeOrder(50);

        // Pay — the async worker will fail to decrement stock
        payWithCard(orderId, "4242424242424242");

        // Expect CANCELLED
        Awaitility.await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            JsonNode o = getOrder(orderId);
            assertThat(o.get("status").asText()).isEqualTo("CANCELLED");
        });

        // Stock unchanged
        assertThat(currentStock()).isEqualTo(10);
    }

    @Test
    void declinedCard_leavesOrderPending() throws Exception {
        UUID orderId = placeOrder(1);

        // Card ending in 0000 is our deterministic decline trigger
        payWithCard(orderId, "4242424242420000");

        // Order should still be PENDING (payment failed)
        Thread.sleep(500);
        assertThat(getOrder(orderId).get("status").asText()).isEqualTo("PENDING");
    }

    @Test
    void sellerCanAdvanceOrderStatus_withValidTransitions() throws Exception {
        UUID orderId = placeOrder(1);
        payWithCard(orderId, "4242424242424242");
        Awaitility.await().atMost(Duration.ofSeconds(10))
                .until(() -> getOrder(orderId).get("status").asText().equals("PAID"));

        // PAID -> PROCESSING
        advanceSellerOrder(orderId, "PROCESSING");
        assertThat(getOrder(orderId).get("status").asText()).isEqualTo("PROCESSING");

        // PROCESSING -> SHIPPED
        advanceSellerOrder(orderId, "SHIPPED");
        assertThat(getOrder(orderId).get("status").asText()).isEqualTo("SHIPPED");

        // SHIPPED -> PAID should fail (invalid transition)
        ResponseEntity<String> bad = http.exchange(
                baseUrl() + "/api/seller/orders/" + orderId + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("status", "PAID")), bearer(sellerToken)),
                String.class);
        assertThat(bad.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(bad.getBody()).contains("INVALID_TRANSITION");
    }

    // ---------------- helpers ----------------

    private UUID placeOrder(int quantity) throws Exception {
        var body = Map.of("items", new Object[]{
                Map.of("productId", productId.toString(), "quantity", quantity)
        });
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/orders",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(body), bearer(shopperToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return UUID.fromString(objectMapper.readTree(resp.getBody()).get("orderId").asText());
    }

    private void payWithCard(UUID orderId, String cardNumber) throws Exception {
        var body = Map.of(
                "method", "CARD",
                "card", Map.of(
                        "number", cardNumber,
                        "expiry", "12/30",
                        "cvv", "123",
                        "holderName", "Ben Shopper"));
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/orders/" + orderId + "/pay",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(body), bearer(shopperToken)),
                String.class);
        // 200 whether accepted or declined — status is in the body
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private JsonNode getOrder(UUID orderId) throws Exception {
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/orders/" + orderId,
                HttpMethod.GET,
                new HttpEntity<>(bearer(shopperToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        return objectMapper.readTree(resp.getBody());
    }

    private void advanceSellerOrder(UUID orderId, String status) {
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/seller/orders/" + orderId + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("status", status)), bearer(sellerToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private int currentStock() {
        return jdbc.queryForObject(
                "SELECT stock FROM products WHERE id = ?", Integer.class, productId);
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
            if (resp.getStatusCode() != HttpStatus.OK) {
                throw new AssertionError("Login failed for " + email + ": " + resp.getBody());
            }
            return objectMapper.readTree(resp.getBody()).get("accessToken").asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
