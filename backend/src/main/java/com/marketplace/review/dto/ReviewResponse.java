package com.marketplace.review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID productId,
        UUID userId,
        String userName,
        Short rating,
        String comment,
        Instant createdAt,
        Instant updatedAt
) {}
