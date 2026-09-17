package com.marketplace.config;

import com.marketplace.messaging.RabbitNames;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class TopologyInitializer implements ApplicationRunner {

    private final AmqpAdmin amqpAdmin;

    public TopologyInitializer(AmqpAdmin amqpAdmin) {
        this.amqpAdmin = amqpAdmin;
    }

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("### TOPOLOGY: declaring exchanges and queues...");

        TopicExchange events = new TopicExchange(RabbitNames.EXCHANGE, true, false);
        TopicExchange dlx = new TopicExchange(RabbitNames.DLX, true, false);

        amqpAdmin.declareExchange(events);
        amqpAdmin.declareExchange(dlx);
        System.out.println("### TOPOLOGY: exchanges declared");

        declareQueue(RabbitNames.QUEUE_EMAIL_VERIFICATION, RabbitNames.ROUTING_EMAIL_VERIFICATION, events);
        declareQueue(RabbitNames.QUEUE_EMAIL_ORDER_STATUS, RabbitNames.ROUTING_EMAIL_ORDER_STATUS, events);
        declareQueue(RabbitNames.QUEUE_EMAIL_SELLER_INVITE, RabbitNames.ROUTING_EMAIL_SELLER_INVITE, events);
        declareQueue(RabbitNames.QUEUE_ORDER_PROCESSING, RabbitNames.ROUTING_ORDER_PROCESSING, events);

        System.out.println("### TOPOLOGY: all queues declared and bound");
    }

    private void declareQueue(String queueName, String routingKey, TopicExchange exchange) {
        Queue q = QueueBuilder.durable(queueName)
                .deadLetterExchange(RabbitNames.DLX)
                .build();
        amqpAdmin.declareQueue(q);
        amqpAdmin.declareBinding(BindingBuilder.bind(q).to(exchange).with(routingKey));
    }
}
