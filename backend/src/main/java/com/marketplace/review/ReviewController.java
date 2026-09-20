package com.marketplace.review;

import com.marketplace.review.dto.CreateReviewRequest;
import com.marketplace.review.dto.CanReviewResponse;
import com.marketplace.review.dto.ReviewResponse;
import com.marketplace.review.dto.ReviewSummaryResponse;
import com.marketplace.review.dto.UpdateReviewRequest;
import com.marketplace.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService service;

    // -------- Public --------

    @Operation(summary = "List reviews for a product")
    @GetMapping("/api/products/{productId}/reviews")
    public Page<ReviewResponse> list(
            @PathVariable UUID productId,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForProduct(productId, pageable);
    }

    @Operation(summary = "Average rating + count")
    @GetMapping("/api/products/{productId}/reviews/summary")
    public ReviewSummaryResponse summary(@PathVariable UUID productId) {
        return service.summaryForProduct(productId);
    }

    @Operation(summary = "Can the current user review this product?")
    @GetMapping("/api/products/{productId}/can-review")
    public CanReviewResponse canReview(
            @AuthenticationPrincipal AuthPrincipal user,
            @PathVariable UUID productId) {
        return service.canReview(user == null ? null : user.getId(), productId);
    }

    // -------- Shopper --------

    @Operation(summary = "Create review (purchase required)")
    @PostMapping("/api/products/{productId}/reviews")
    @PreAuthorize("hasRole('SHOPPER')")
    public ResponseEntity<ReviewResponse> create(
            @AuthenticationPrincipal AuthPrincipal user,
            @PathVariable UUID productId,
            @Valid @RequestBody CreateReviewRequest req) {
        ReviewResponse resp = service.create(user.getId(), productId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "Update own review")
    @PatchMapping("/api/reviews/{id}")
    @PreAuthorize("hasRole('SHOPPER')")
    public ReviewResponse update(
            @AuthenticationPrincipal AuthPrincipal user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReviewRequest req) {
        return service.update(user.getId(), id, req);
    }

    @Operation(summary = "Delete own review")
    @DeleteMapping("/api/reviews/{id}")
    @PreAuthorize("hasRole('SHOPPER')")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthPrincipal user,
            @PathVariable UUID id) {
        service.delete(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    // -------- Admin --------

    @Operation(summary = "Admin delete any review")
    @DeleteMapping("/api/admin/reviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminDelete(@PathVariable UUID id) {
        service.adminDelete(id);
        return ResponseEntity.noContent().build();
    }
}
