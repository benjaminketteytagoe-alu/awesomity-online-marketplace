package com.marketplace.seller.dto;

import java.time.Instant;
import java.util.UUID;

public record SellerApplicationSummary(
        UUID id,
        String name,
        String email,
        String shopName,
        String description,
        String status,
        Instant createdAt,
        Instant reviewedAt,
        String rejectionReason
) {}
