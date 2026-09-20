package com.marketplace.review.dto;

import java.util.UUID;

/**
 * Answers "can the current user review this product?" without the
 * frontend having to fetch and scan all their orders.
 *
 * Semantics:
 *   canReview        — user is a shopper AND has a qualifying order
 *                      (PAID, PROCESSING, SHIPPED, DELIVERED) AND
 *                      has not already reviewed this product
 *   hasReviewed      — user has an existing review for this product
 *   existingReviewId — the id of that review, so the UI can offer
 *                      "Edit your review" instead of "Write a review"
 */
public record CanReviewResponse(
        UUID productId,
        boolean canReview,
        boolean hasReviewed,
        UUID existingReviewId
) {}
