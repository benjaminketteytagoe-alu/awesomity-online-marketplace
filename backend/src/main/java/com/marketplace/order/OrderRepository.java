package com.marketplace.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findByShopperIdOrderByCreatedAtDesc(UUID shopperId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    /** Orders containing at least one item sold by the given seller. */
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN OrderItem oi ON oi.order = o
        JOIN Product p ON oi.product = p
        WHERE p.store.owner.id = :sellerId
        ORDER BY o.createdAt DESC
        """)
    Page<Order> findBySellerId(@Param("sellerId") UUID sellerId, Pageable pageable);
}
