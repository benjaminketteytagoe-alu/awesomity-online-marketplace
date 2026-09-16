package com.marketplace.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findByShopperIdOrderByCreatedAtDesc(UUID shopperId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}
