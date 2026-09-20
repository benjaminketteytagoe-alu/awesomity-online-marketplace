package com.marketplace.review;

import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.ForbiddenException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.order.OrderStatus;
import com.marketplace.product.Product;
import com.marketplace.product.ProductRepository;
import com.marketplace.review.dto.CreateReviewRequest;
import com.marketplace.review.dto.CanReviewResponse;
import com.marketplace.review.dto.ReviewResponse;
import com.marketplace.review.dto.ReviewSummaryResponse;
import com.marketplace.review.dto.UpdateReviewRequest;
import com.marketplace.user.User;
import com.marketplace.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ---------------- PUBLIC ----------------

    @Transactional(readOnly = true)
    public Page<ReviewResponse> listForProduct(UUID productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new NotFoundException("Product not found");
        }
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse summaryForProduct(UUID productId) {
        if (!productRepository.existsById(productId)) {
            throw new NotFoundException("Product not found");
        }
        Double avg = reviewRepository.averageRatingForProduct(productId);
        long count = reviewRepository.countByProductId(productId);
        return new ReviewSummaryResponse(productId, avg == null ? 0.0 : avg, count);
    }

    /**
     * Can the current user review this product?
     *
     * Anonymous callers always get canReview=false. A shopper gets
     * canReview=true only if they have a qualifying order and haven't
     * already reviewed. The existingReviewId is populated when the
     * user has already reviewed, so the UI can offer "Edit" instead.
     */
    @Transactional(readOnly = true)
    public CanReviewResponse canReview(UUID userId, UUID productId) {
        if (userId == null || !productRepository.existsById(productId)) {
            return new CanReviewResponse(productId, false, false, null);
        }

        var existing = reviewRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            return new CanReviewResponse(productId, false, true, existing.get().getId());
        }

        var reviewableStatuses = EnumSet.of(
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED);

        boolean purchased = reviewRepository.hasUserPurchasedProduct(
                userId, productId, reviewableStatuses);

        return new CanReviewResponse(productId, purchased, false, null);
    }

    // ---------------- SHOPPER ----------------

    @Transactional
    public ReviewResponse create(UUID userId, UUID productId, CreateReviewRequest req) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        var reviewableStatuses = EnumSet.of(
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED);

        if (!reviewRepository.hasUserPurchasedProduct(userId, productId, reviewableStatuses)) {
            throw new ForbiddenException(
                    "You can only review products you have purchased");
        }

        if (reviewRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            throw new ConflictException("ALREADY_REVIEWED",
                    "You have already reviewed this product");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(req.rating())
                .comment(req.comment() == null ? null : req.comment().trim())
                .build();
        reviewRepository.save(review);
        log.info("Review created id={} userId={} productId={} rating={}",
                review.getId(), userId, productId, req.rating());
        return toResponse(review);
    }

    @Transactional
    public ReviewResponse update(UUID userId, UUID reviewId, UpdateReviewRequest req) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own reviews");
        }

        if (req.rating() != null) review.setRating(req.rating());
        if (req.comment() != null) review.setComment(req.comment().trim());

        reviewRepository.save(review);
        log.info("Review updated id={} userId={}", reviewId, userId);
        return toResponse(review);
    }

    @Transactional
    public void delete(UUID userId, UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
        log.info("Review deleted id={} userId={}", reviewId, userId);
    }

    // ---------------- ADMIN ----------------

    @Transactional
    public void adminDelete(UUID reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new NotFoundException("Review not found");
        }
        reviewRepository.deleteById(reviewId);
        log.warn("Admin deleted review id={}", reviewId);
    }

    // ---------------- helpers ----------------

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getProduct().getId(),
                r.getUser().getId(),
                r.getUser().getName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                r.getUpdatedAt());
    }
}
