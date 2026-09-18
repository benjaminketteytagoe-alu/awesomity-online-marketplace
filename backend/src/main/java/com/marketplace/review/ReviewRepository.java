package com.marketplace.review;

import com.marketplace.order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    Optional<Review> findByUserIdAndProductId(UUID userId, UUID productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double averageRatingForProduct(@Param("productId") UUID productId);

    long countByProductId(UUID productId);

    /**
     * True if the user has at least one order item for this product in an
     * order whose status is in the given collection.
     *
     * Callers pass the enum values — Hibernate binds them via the entity's
     * JdbcTypeCode, sidestepping the "::OrderStatus vs order_status" mismatch
     * we hit with literal enum names in JPQL.
     */
    @Query("""
        SELECT CASE WHEN COUNT(oi) > 0 THEN TRUE ELSE FALSE END
        FROM OrderItem oi
        WHERE oi.order.shopper.id = :userId
          AND oi.product.id = :productId
          AND oi.order.status IN :statuses
        """)
    boolean hasUserPurchasedProduct(@Param("userId") UUID userId,
                                    @Param("productId") UUID productId,
                                    @Param("statuses") Collection<OrderStatus> statuses);
}
