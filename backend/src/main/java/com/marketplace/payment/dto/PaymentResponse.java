package com.marketplace.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID paymentId,
        UUID orderId,
        String method,
        String status,
        BigDecimal amount,
        String reference,
        String message,
        Instant createdAt
) {}
