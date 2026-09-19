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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                    .withDatabaseName("marketplace")
                    .withUsername("marketplace")
                    .withPassword("marketplace")
                    .withReuse(true);

    @Container
    protected static final RabbitMQContainer RABBIT =
            new RabbitMQContainer(DockerImageName.parse("rabbitmq:3.13-management-alpine"))
                    .withUser("marketplace", "marketplace")
                    .withPermission("/", "marketplace", ".*", ".*", ".*")
                    .withReuse(true);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);

        registry.add("spring.rabbitmq.host", RABBIT::getHost);
        registry.add("spring.rabbitmq.port", RABBIT::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "marketplace");
        registry.add("spring.rabbitmq.password", () -> "marketplace");
    }

    /**
     * We build our own TestRestTemplate (not the framework's auto-configured
     * one) so that its underlying HTTP client is Apache HttpClient instead of
     * JDK HttpURLConnection. The JDK client throws HttpRetryException on 401
     * responses that carry a WWW-Authenticate header when the request sent
     * a streaming (JSON) body.
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
