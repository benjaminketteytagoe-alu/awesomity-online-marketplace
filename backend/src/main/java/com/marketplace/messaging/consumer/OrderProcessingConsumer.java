package com.marketplace.messaging.consumer;

import com.marketplace.auth.email.EmailJob;
import com.marketplace.messaging.RabbitNames;
import com.marketplace.messaging.producer.EmailProducer;
import com.marketplace.order.Order;
import com.marketplace.order.OrderRepository;
import com.marketplace.order.OrderStatus;
import com.marketplace.order.event.OrderPlacedEvent;
import com.marketplace.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Async worker for order processing.
 *
 * Responsibilities:
 *  1. Atomically decrement stock for each item.
 *  2. If any item fails (insufficient stock), cancel order + restore any prior decrements.
 *  3. If all succeed, mark order PAID and email the shopper + each seller.
 *
 * Runs on the order.processing queue; retries per Step 4.1 config; DLX on failure.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderProcessingConsumer {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EmailProducer emailProducer;

    @RabbitListener(queues = RabbitNames.QUEUE_ORDER_PROCESSING)
    @Transactional
    public void processOrder(OrderPlacedEvent event) {
        log.info("Processing OrderPlaced event orderId={} items={}",
                event.orderId(), event.items().size());

        Order order = orderRepository.findById(event.orderId())
                .orElseThrow(() -> new IllegalStateException(
                        "Order not found: " + event.orderId()));

        // Skip if already processed (idempotency guard)
        if (order.getStatus() != OrderStatus.PENDING) {
            log.info("Order already processed orderId={} status={}",
                    event.orderId(), order.getStatus());
            return;
        }

        // Try to decrement stock for each item atomically
        var successfullyDecremented = new java.util.ArrayList<OrderPlacedEvent.Item>();

        for (OrderPlacedEvent.Item item : event.items()) {
            int updated = productRepository.decrementStockIfAvailable(
                    item.productId(), item.quantity());
            if (updated == 0) {
                log.warn("Insufficient stock orderId={} productId={} qty={}",
                        event.orderId(), item.productId(), item.quantity());
                rollbackStock(successfullyDecremented);
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);
                sendCancellationEmail(order, event, item.productName());
                return;
            }
            successfullyDecremented.add(item);
        }

        // All stock decrements succeeded — mark PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        sendConfirmationEmail(order, event);
        notifySellers(order, event);

        log.info("Order processing complete orderId={} status=PAID", event.orderId());
    }

    private void rollbackStock(java.util.List<OrderPlacedEvent.Item> items) {
        for (OrderPlacedEvent.Item item : items) {
            productRepository.incrementStock(item.productId(), item.quantity());
        }
    }

    private void sendConfirmationEmail(Order order, OrderPlacedEvent event) {
        emailProducer.sendOrderStatusEmail(new EmailJob(
                event.shopperEmail(),
                "Your order #" + shortId(order.getId()) + " is confirmed",
                "order-confirmation",
                Map.of(
                        "name", event.shopperName(),
                        "orderId", order.getId().toString(),
                        "shortId", shortId(order.getId()),
                        "totalAmount", order.getTotalAmount().toString(),
                        "itemCount", event.items().size()
                )));
    }

    private void sendCancellationEmail(Order order, OrderPlacedEvent event, String culprit) {
        emailProducer.sendOrderStatusEmail(new EmailJob(
                event.shopperEmail(),
                "Your order #" + shortId(order.getId()) + " could not be completed",
                "order-cancelled",
                Map.of(
                        "name", event.shopperName(),
                        "orderId", order.getId().toString(),
                        "shortId", shortId(order.getId()),
                        "reason", "Insufficient stock for: " + culprit
                )));
    }

    private void notifySellers(Order order, OrderPlacedEvent event) {
        event.items().stream()
                .collect(java.util.stream.Collectors.toMap(
                        OrderPlacedEvent.Item::sellerId,
                        i -> i,
                        (a, b) -> a))
                .values()
                .forEach(item -> {
                    emailProducer.sendOrderStatusEmail(new EmailJob(
                            "seller-" + item.sellerId() + "@marketplace.local",
                            "New order received — #" + shortId(order.getId()),
                            "order-confirmation",
                            Map.of(
                                    "name", "Seller",
                                    "orderId", order.getId().toString(),
                                    "shortId", shortId(order.getId()),
                                    "totalAmount", order.getTotalAmount().toString(),
                                    "itemCount", event.items().size()
                            )));
                });
    }

    private String shortId(java.util.UUID id) {
        return id.toString().substring(0, 8);
    }
}
