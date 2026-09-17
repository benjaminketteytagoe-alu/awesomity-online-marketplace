package com.marketplace.messaging.producer;

import com.marketplace.messaging.RabbitNames;
import com.marketplace.order.event.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishOrderPlaced(OrderPlacedEvent event) {
        log.info("Publishing OrderPlaced event orderId={} items={}",
                event.orderId(), event.items().size());
        rabbitTemplate.convertAndSend(
                RabbitNames.EXCHANGE,
                RabbitNames.ROUTING_ORDER_PROCESSING,
                event);
    }
}
