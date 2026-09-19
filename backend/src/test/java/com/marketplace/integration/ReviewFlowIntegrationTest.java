package com.marketplace.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReviewFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String shopperToken;
    private UUID shopperId;
    private UUID purchasedProductId;
    private UUID unpurchasedProductId;

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

        // Seller + store + two products
        UUID sellerId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, 'Carol', 'SELLER', 'ACTIVE', now(), now(), now())
                """,
                sellerId, "seller@test.local", passwordEncoder.encode("SellerPass123"));
        UUID storeId = UUID.randomUUID();
        jdbc.update("INSERT INTO stores (id, owner_id, name, created_at, updated_at) VALUES (?, ?, 'Store', now(), now())",
                storeId, sellerId);
        UUID catId = UUID.randomUUID();
        jdbc.update("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, 'Electronics', 'electronics', now(), now())",
                catId);

        purchasedProductId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO products (id, store_id, category_id, name, price, stock, featured, created_at, updated_at)
                VALUES (?, ?, ?, 'Purchased Product', 10.00, 5, false, now(), now())
                """, purchasedProductId, storeId, catId);

        unpurchasedProductId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO products (id, store_id, category_id, name, price, stock, featured, created_at, updated_at)
                VALUES (?, ?, ?, 'Unpurchased Product', 20.00, 5, false, now(), now())
                """, unpurchasedProductId, storeId, catId);

        // A fully processed (PAID) order for the purchased product
        UUID orderId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO orders (id, shopper_id, status, total_amount, created_at, updated_at)
                VALUES (?, ?, 'PAID', 10.00, now(), now())
                """, orderId, shopperId);
        jdbc.update("""
                INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, created_at, updated_at)
                VALUES (?, ?, ?, 1, 10.00, now(), now())
                """, UUID.randomUUID(), orderId, purchasedProductId);
    }

    @Test
    void reviewPurchasedProduct_succeeds_thenDuplicateFails() throws Exception {
        ResponseEntity<String> create = postReview(purchasedProductId, 5, "Great!");
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode review = objectMapper.readTree(create.getBody());
        UUID reviewId = UUID.fromString(review.get("id").asText());
        assertThat(review.get("rating").asInt()).isEqualTo(5);

        // Duplicate
        ResponseEntity<String> dup = postReview(purchasedProductId, 4, "Again");
        assertThat(dup.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(dup.getBody()).contains("ALREADY_REVIEWED");

        // Summary reflects it
        JsonNode summary = getReviewSummary(purchasedProductId);
        assertThat(summary.get("averageRating").asDouble()).isEqualTo(5.0);
        assertThat(summary.get("totalReviews").asLong()).isEqualTo(1L);

        // Update
        ResponseEntity<String> update = http.exchange(
                baseUrl() + "/api/reviews/" + reviewId,
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("rating", 4)),
                        bearer(shopperToken)),
                String.class);
        assertThat(update.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Summary updates
        summary = getReviewSummary(purchasedProductId);
        assertThat(summary.get("averageRating").asDouble()).isEqualTo(4.0);

        // Delete own
        ResponseEntity<String> delete = http.exchange(
                baseUrl() + "/api/reviews/" + reviewId,
                HttpMethod.DELETE,
                new HttpEntity<>(bearer(shopperToken)),
                String.class);
        assertThat(delete.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Summary zero
        summary = getReviewSummary(purchasedProductId);
        assertThat(summary.get("totalReviews").asLong()).isZero();
    }

    @Test
    void reviewUnpurchasedProduct_forbidden() throws Exception {
        ResponseEntity<String> resp = postReview(unpurchasedProductId, 5, "Never bought");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(resp.getBody()).contains("purchased");
    }

    // ---------------- helpers ----------------

    private ResponseEntity<String> postReview(UUID productId, int rating, String comment) {
        return http.exchange(
                baseUrl() + "/api/products/" + productId + "/reviews",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of("rating", rating, "comment", comment)),
                        bearer(shopperToken)),
                String.class);
    }

    private JsonNode getReviewSummary(UUID productId) throws Exception {
        ResponseEntity<String> resp = http.getForEntity(
                baseUrl() + "/api/products/" + productId + "/reviews/summary",
                String.class);
        return objectMapper.readTree(resp.getBody());
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
