package com.marketplace.integration;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Singleton Testcontainers for the entire test JVM.
 *
 * Why not @Container on a base class: @Container fields are tied to the
 * lifecycle of the test class that declares them. When the first test class
 * finishes, Testcontainers stops the containers. The Spring context cache
 * (shared across test classes with identical configuration) still holds
 * connections to the now-dead containers, so every subsequent test class
 * hits connection timeouts.
 *
 * The singleton pattern starts the containers ONCE, on first class load,
 * and they live until the JVM exits. See
 * https://java.testcontainers.org/test_framework_integration/manual_lifecycle_control/#singleton-containers
 */
public final class TestContainersConfig {

    private TestContainersConfig() {}

    public static final PostgreSQLContainer<?> POSTGRES;
    public static final RabbitMQContainer RABBIT;

    static {
        POSTGRES = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                .withDatabaseName("marketplace")
                .withUsername("marketplace")
                .withPassword("marketplace")
                .withReuse(true);
        POSTGRES.start();

        RABBIT = new RabbitMQContainer(DockerImageName.parse("rabbitmq:3.13-management-alpine"))
                .withUser("marketplace", "marketplace")
                .withPermission("/", "marketplace", ".*", ".*", ".*")
                .withReuse(true);
        RABBIT.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            POSTGRES.stop();
            RABBIT.stop();
        }));
    }
}
