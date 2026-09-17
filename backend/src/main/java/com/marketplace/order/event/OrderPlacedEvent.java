package com.marketplace.order.event;

import java.util.List;
import java.util.UUID;

/**
 * Published to RabbitMQ immediately after an order is created (status=PENDING).
 * Consumed asynchronously by OrderProcessingConsumer.
 */
public record OrderPlacedEvent(
        UUID orderId,
        UUID shopperId,
        String shopperEmail,
        String shopperName,
        List<Item> items
) {
    public record Item(
            UUID productId,
            UUID storeId,
            UUID sellerId,
            String productName,
            Integer quantity
    ) {}
}
