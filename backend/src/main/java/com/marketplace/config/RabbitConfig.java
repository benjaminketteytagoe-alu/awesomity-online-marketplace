package com.marketplace.config;

import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration.
 *
 * Topology declaration is owned by {@link TopologyInitializer}, which runs
 * as an ApplicationRunner — after the full application context is initialized.
 * This is deliberate: Spring Boot's auto-configured RabbitAdmin runs its
 * declarables discovery earlier in the lifecycle and may miss beans.
 *
 * This class only provides the JSON message converter, which Spring Boot's
 * auto-configured RabbitTemplate picks up automatically.
 */
@Configuration
public class RabbitConfig {

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
