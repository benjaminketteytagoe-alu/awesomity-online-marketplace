package com.marketplace.review.dto;

import java.util.UUID;

public record ReviewSummaryResponse(
        UUID productId,
        double averageRating,
        long totalReviews
) {}
