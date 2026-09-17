package com.marketplace.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderId(UUID orderId);

    /** Only items belonging to a specific seller (used by seller's order view). */
    List<OrderItem> findByOrderIdAndProductStoreOwnerId(UUID orderId, UUID sellerId);
}
