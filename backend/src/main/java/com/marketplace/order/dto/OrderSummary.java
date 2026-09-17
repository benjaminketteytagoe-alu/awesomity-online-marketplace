package com.marketplace.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummary(
        UUID id,
        UUID shopperId,
        String shopperEmail,
        String status,
        BigDecimal totalAmount,
        Instant createdAt
) {}
