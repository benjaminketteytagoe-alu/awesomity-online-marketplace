package com.marketplace.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByProductId(UUID productId, Pageable pageable);

    Optional<Review> findByUserIdAndProductId(UUID userId, UUID productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double averageRatingForProduct(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    long countByProductId(@Param("productId") UUID productId);

    @Query("""
        SELECT CASE WHEN COUNT(oi) > 0 THEN TRUE ELSE FALSE END
        FROM OrderItem oi
        WHERE oi.order.shopper.id = :userId
          AND oi.product.id = :productId
        """)
    boolean hasUserPurchasedProduct(@Param("userId") UUID userId,
                                    @Param("productId") UUID productId);
}
