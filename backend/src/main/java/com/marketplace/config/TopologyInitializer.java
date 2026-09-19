package com.marketplace.config;

import com.marketplace.messaging.RabbitNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

/**
 * Declares RabbitMQ topology (exchanges, queues, bindings) at exactly the
 * right moment in the Spring lifecycle.
 *
 * Why SmartInitializingSingleton instead of ApplicationRunner:
 *   - ApplicationRunner runs AFTER the context is fully refreshed
 *   - @RabbitListener containers start DURING context refresh (they're SmartLifecycle)
 *   - Result with ApplicationRunner: listeners start, passively check for queues
 *     that don't exist yet, retry, then fail with fatal=true
 *   - SmartInitializingSingleton.afterSingletonsInstantiated() runs AFTER all
 *     singletons exist but BEFORE SmartLifecycle beans start — perfect timing
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TopologyInitializer implements SmartInitializingSingleton {

    private final AmqpAdmin amqpAdmin;

    @Override
    public void afterSingletonsInstantiated() {
        log.info("Declaring RabbitMQ topology...");

        TopicExchange events = new TopicExchange(RabbitNames.EXCHANGE, true, false);
        TopicExchange dlx = new TopicExchange(RabbitNames.DLX, true, false);

        amqpAdmin.declareExchange(events);
        amqpAdmin.declareExchange(dlx);

        declareQueue(RabbitNames.QUEUE_EMAIL_VERIFICATION,
                     RabbitNames.ROUTING_EMAIL_VERIFICATION, events);
        declareQueue(RabbitNames.QUEUE_EMAIL_ORDER_STATUS,
                     RabbitNames.ROUTING_EMAIL_ORDER_STATUS, events);
        declareQueue(RabbitNames.QUEUE_EMAIL_SELLER_INVITE,
                     RabbitNames.ROUTING_EMAIL_SELLER_INVITE, events);
        declareQueue(RabbitNames.QUEUE_ORDER_PROCESSING,
                     RabbitNames.ROUTING_ORDER_PROCESSING, events);

        log.info("RabbitMQ topology declared: 2 exchanges, 4 queues, 4 bindings");
    }

    private void declareQueue(String queueName, String routingKey, TopicExchange exchange) {
        Queue q = QueueBuilder.durable(queueName)
                .deadLetterExchange(RabbitNames.DLX)
                .build();
        amqpAdmin.declareQueue(q);
        amqpAdmin.declareBinding(BindingBuilder.bind(q).to(exchange).with(routingKey));
    }
}
