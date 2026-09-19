package com.marketplace.integration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    /**
     * Containers are managed by TestContainersConfig — a JVM-wide singleton.
     * We deliberately do NOT use @Testcontainers or @Container here, because
     * those annotations tie container lifecycle to the test class, causing
     * the containers to be stopped after the first class finishes while the
     * shared Spring context still holds connections to them.
     */
    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        var pg = TestContainersConfig.POSTGRES;
        var mq = TestContainersConfig.RABBIT;

        registry.add("spring.datasource.url", pg::getJdbcUrl);
        registry.add("spring.datasource.username", pg::getUsername);
        registry.add("spring.datasource.password", pg::getPassword);

        registry.add("spring.rabbitmq.host", mq::getHost);
        registry.add("spring.rabbitmq.port", mq::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "marketplace");
        registry.add("spring.rabbitmq.password", () -> "marketplace");
    }

    /**
     * Custom TestRestTemplate with Apache HttpClient (JDK's HttpURLConnection
     * throws HttpRetryException on 401 responses with WWW-Authenticate header
     * when the request sent a streaming body).
     */
    protected TestRestTemplate http;

    @Autowired protected JdbcTemplate jdbc;
    @LocalServerPort protected int port;

    @BeforeEach
    void setUpBase() {
        this.http = new TestRestTemplate(
                new RestTemplateBuilder()
                        .requestFactory(HttpComponentsClientHttpRequestFactory.class));

        cleanDatabase();
    }

    protected String baseUrl() {
        return "http://localhost:" + port;
    }

    private void cleanDatabase() {
        jdbc.execute("""
                TRUNCATE TABLE
                    reviews,
                    payments,
                    order_items,
                    orders,
                    products,
                    stores,
                    seller_applications,
                    users,
                    categories
                RESTART IDENTITY CASCADE
                """);
    }
}
