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

class ProductCatalogIntegrationTest extends AbstractIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String sellerToken;
    private UUID sellerStoreId;
    private UUID categoryId;

    @BeforeEach
    void setUp() throws Exception {
        // Admin
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', now(), now(), now())
                """,
                UUID.randomUUID(), "admin@test.local",
                passwordEncoder.encode("AdminPass1234"), "Test Admin");
        adminToken = login("admin@test.local", "AdminPass1234");

        // Seller + store (seeded directly)
        UUID sellerId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'SELLER', 'ACTIVE', now(), now(), now())
                """,
                sellerId, "seller@test.local",
                passwordEncoder.encode("SellerPass123"), "Test Seller");

        sellerStoreId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO stores (id, owner_id, name, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                """,
                sellerStoreId, sellerId, "Test Store");

        sellerToken = login("seller@test.local", "SellerPass123");

        // Category via admin API
        ResponseEntity<String> catResp = http.exchange(
                baseUrl() + "/api/admin/categories",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of("name", "Electronics", "description", "Gadgets")),
                        bearerHeaders(adminToken)),
                String.class);
        categoryId = UUID.fromString(
                objectMapper.readTree(catResp.getBody()).get("id").asText());
    }

    @Test
    void adminCreatesCategory_slugIsGenerated_publicCanRead() throws Exception {
        // Public list (no auth)
        ResponseEntity<String> listResp = http.getForEntity(
                baseUrl() + "/api/categories", String.class);
        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResp.getBody()).contains("Electronics");
        assertThat(listResp.getBody()).contains("electronics");  // auto slug

        // Public read by slug
        ResponseEntity<String> bySlug = http.getForEntity(
                baseUrl() + "/api/categories/electronics", String.class);
        assertThat(bySlug.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void duplicateCategory_returns409() {
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/categories",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of("name", "Electronics")),
                        bearerHeaders(adminToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resp.getBody()).contains("CATEGORY_EXISTS");
    }

    @Test
    void sellerCreatesProduct_publicCanBrowse() throws Exception {
        // Seller creates product
        var body = Map.of(
                "name", "Handmade Vase",
                "description", "Ceramic",
                "price", 49.99,
                "stock", 10,
                "categoryId", categoryId.toString()
        );

        ResponseEntity<String> createResp = http.exchange(
                baseUrl() + "/api/seller/products",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(body), bearerHeaders(sellerToken)),
                String.class);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode product = objectMapper.readTree(createResp.getBody());
        assertThat(product.get("storeId").asText()).isEqualTo(sellerStoreId.toString());
        assertThat(product.get("categorySlug").asText()).isEqualTo("electronics");

        // Public list without auth
        ResponseEntity<String> listResp = http.getForEntity(
                baseUrl() + "/api/products", String.class);
        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResp.getBody()).contains("Handmade Vase");

        // Search
        ResponseEntity<String> searchResp = http.getForEntity(
                baseUrl() + "/api/products?q=vase", String.class);
        assertThat(searchResp.getBody()).contains("Handmade Vase");
    }

    @Test
    void shopperCannotCreateProduct() throws Exception {
        // Seed shopper
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'SHOPPER', 'ACTIVE', now(), now(), now())
                """,
                UUID.randomUUID(), "shopper@test.local",
                passwordEncoder.encode("ShopperPass123"), "Test Shopper");
        String shopperToken = login("shopper@test.local", "ShopperPass123");

        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/seller/products",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of(
                        "name", "Sneaky Product",
                        "price", 1.00,
                        "stock", 1,
                        "categoryId", categoryId.toString()
                )), bearerHeaders(shopperToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void sellerCannotEditOtherSellersProduct() throws Exception {
        // Create product as seller 1
        ResponseEntity<String> createResp = http.exchange(
                baseUrl() + "/api/seller/products",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of(
                        "name", "Seller1 Product",
                        "price", 10.00,
                        "stock", 5,
                        "categoryId", categoryId.toString()
                )), bearerHeaders(sellerToken)),
                String.class);
        UUID productId = UUID.fromString(
                objectMapper.readTree(createResp.getBody()).get("id").asText());

        // Create seller 2 with their own store
        UUID seller2Id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, name, role, status, email_verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'SELLER', 'ACTIVE', now(), now(), now())
                """,
                seller2Id, "seller2@test.local",
                passwordEncoder.encode("Seller2Pass123"), "Seller Two");
        jdbc.update("""
                INSERT INTO stores (id, owner_id, name, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                """,
                UUID.randomUUID(), seller2Id, "Seller 2 Store");

        String seller2Token = login("seller2@test.local", "Seller2Pass123");

        // Seller 2 tries to update seller 1's product
        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/seller/products/" + productId,
                HttpMethod.PATCH,
                new HttpEntity<>(jsonString(Map.of("price", 999.00)),
                        bearerHeaders(seller2Token)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminFeaturesProduct() throws Exception {
        // Create product
        ResponseEntity<String> createResp = http.exchange(
                baseUrl() + "/api/seller/products",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of(
                        "name", "Featured Item",
                        "price", 25.00,
                        "stock", 3,
                        "categoryId", categoryId.toString()
                )), bearerHeaders(sellerToken)),
                String.class);
        UUID productId = UUID.fromString(
                objectMapper.readTree(createResp.getBody()).get("id").asText());

        // Admin features it
        ResponseEntity<String> featResp = http.exchange(
                baseUrl() + "/api/admin/products/" + productId + "/feature",
                HttpMethod.PATCH,
                new HttpEntity<>(bearerHeaders(adminToken)),
                String.class);
        assertThat(featResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(featResp.getBody()).contains("\"featured\":true");

        // Featured list includes it
        ResponseEntity<String> featuredResp = http.getForEntity(
                baseUrl() + "/api/products/featured", String.class);
        assertThat(featuredResp.getBody()).contains("Featured Item");
    }

    @Test
    void cannotDeleteCategoryInUse() throws Exception {
        // Create a product using this category
        http.exchange(
                baseUrl() + "/api/seller/products",
                HttpMethod.POST,
                new HttpEntity<>(jsonString(Map.of(
                        "name", "Blocks Category Deletion",
                        "price", 5.00,
                        "stock", 1,
                        "categoryId", categoryId.toString()
                )), bearerHeaders(sellerToken)),
                String.class);

        ResponseEntity<String> resp = http.exchange(
                baseUrl() + "/api/admin/categories/" + categoryId,
                HttpMethod.DELETE,
                new HttpEntity<>(bearerHeaders(adminToken)),
                String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resp.getBody()).contains("CATEGORY_IN_USE");
    }

    // ---------------- helpers ----------------

    private HttpHeaders bearerHeaders(String token) {
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
                    new HttpEntity<>(jsonString(Map.of("email", email, "password", password)),
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
