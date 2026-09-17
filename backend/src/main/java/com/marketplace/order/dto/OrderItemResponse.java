package com.marketplace.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID id,
        UUID productId,
        String productName,
        UUID storeId,
        String storeName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {}
