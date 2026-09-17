package com.marketplace.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PlaceOrderResponse(
        UUID orderId,
        String status,
        BigDecimal totalAmount,
        String message
) {}
