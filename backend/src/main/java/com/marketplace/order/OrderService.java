package com.marketplace.order;

import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ForbiddenException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.order.dto.*;
import com.marketplace.product.Product;
import com.marketplace.product.ProductRepository;
import com.marketplace.user.User;
import com.marketplace.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ---------------- SHOPPER ----------------

    /**
     * Create a PENDING order. Does NOT publish to the queue.
     * The async pipeline kicks off when PaymentService.pay() succeeds.
     */
    @Transactional
    public PlaceOrderResponse place(UUID shopperId, PlaceOrderRequest req) {
        User shopper = userRepository.findById(shopperId)
                .orElseThrow(() -> new NotFoundException("Shopper not found"));

        Order order = Order.builder()
                .shopper(shopper)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();
        orderRepository.saveAndFlush(order);

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (PlaceOrderRequest.Item reqItem : req.items()) {
            Product product = productRepository.findByIdAndDeletedAtIsNull(reqItem.productId())
                    .orElseThrow(() -> new BadRequestException("PRODUCT_NOT_FOUND",
                            "Product not found: " + reqItem.productId()));

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(reqItem.quantity()));
            total = total.add(lineTotal);

            OrderItem oi = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(reqItem.quantity())
                    .unitPrice(product.getPrice())
                    .build();
            orderItemRepository.save(oi);
            items.add(oi);
        }

        order.setTotalAmount(total);
        orderRepository.saveAndFlush(order);

        log.info("Order created id={} shopperId={} total={} status=PENDING (awaiting payment)",
                order.getId(), shopperId, total);

        return new PlaceOrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getTotalAmount(),
                "Order created. Complete payment to confirm.");
    }

    @Transactional(readOnly = true)
    public Page<OrderSummary> listForShopper(UUID shopperId, Pageable pageable) {
        return orderRepository.findByShopperIdOrderByCreatedAtDesc(shopperId, pageable)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderResponse getForShopper(UUID shopperId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!order.getShopper().getId().equals(shopperId)) {
            throw new ForbiddenException("This order belongs to a different user");
        }
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelByShopper(UUID shopperId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (!order.getShopper().getId().equals(shopperId)) {
            throw new ForbiddenException("This order belongs to a different user");
        }
        if (order.getStatus() != OrderStatus.PENDING
                && order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("CANNOT_CANCEL",
                    "Orders can only be cancelled before shipping");
        }

        // Restore stock — only if payment was already processed (PAID).
        if (order.getStatus() == OrderStatus.PAID) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        log.info("Order cancelled by shopper orderId={}", orderId);
        return toResponse(order);
    }

    // ---------------- SELLER ----------------

    @Transactional(readOnly = true)
    public Page<OrderSummary> listForSeller(UUID sellerId, Pageable pageable) {
        return orderRepository.findBySellerId(sellerId, pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderResponse getForSeller(UUID sellerId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        List<OrderItem> items = orderItemRepository
                .findByOrderIdAndProductStoreOwnerId(orderId, sellerId);
        if (items.isEmpty()) {
            throw new ForbiddenException("This order contains none of your products");
        }
        return toResponseWithItems(order, items);
    }

    @Transactional
    public OrderResponse updateStatusBySeller(UUID sellerId, UUID orderId, OrderStatus next) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        List<OrderItem> sellerItems = orderItemRepository
                .findByOrderIdAndProductStoreOwnerId(orderId, sellerId);
        if (sellerItems.isEmpty()) {
            throw new ForbiddenException("This order contains none of your products");
        }

        validateSellerTransition(order.getStatus(), next);

        order.setStatus(next);
        orderRepository.save(order);
        log.info("Order status updated by seller orderId={} {} -> {}",
                orderId, order.getStatus(), next);
        return toResponse(order);
    }

    // ---------------- ADMIN ----------------

    @Transactional(readOnly = true)
    public Page<OrderSummary> listForAdmin(String status, Pageable pageable) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return orderRepository.findAll(pageable).map(this::toSummary);
        }
        OrderStatus os;
        try {
            os = OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_STATUS", "Unknown order status: " + status);
        }
        return orderRepository.findByStatus(os, pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderResponse getForAdmin(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        return toResponse(order);
    }

    @Transactional
    public OrderResponse forceStatus(UUID orderId, OrderStatus next) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        order.setStatus(next);
        orderRepository.save(order);
        log.warn("Admin force-set order status orderId={} -> {}", orderId, next);
        return toResponse(order);
    }

    // ---------------- helpers ----------------

    private void validateSellerTransition(OrderStatus current, OrderStatus next) {
        boolean ok = switch (current) {
            case PAID -> next == OrderStatus.PROCESSING;
            case PROCESSING -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };
        if (!ok) {
            throw new BadRequestException("INVALID_TRANSITION",
                    "Cannot move order from " + current + " to " + next);
        }
    }

    private OrderSummary toSummary(Order o) {
        return new OrderSummary(
                o.getId(),
                o.getShopper().getId(),
                o.getShopper().getEmail(),
                o.getStatus().name(),
                o.getTotalAmount(),
                o.getCreatedAt());
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
        return toResponseWithItems(o, items);
    }

    private OrderResponse toResponseWithItems(Order o, List<OrderItem> items) {
        List<OrderItemResponse> itemResponses = items.stream()
                .map(i -> new OrderItemResponse(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getProduct().getStore().getId(),
                        i.getProduct().getStore().getName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity()))))
                .toList();
        return new OrderResponse(
                o.getId(),
                o.getShopper().getId(),
                o.getShopper().getEmail(),
                o.getShopper().getName(),
                o.getStatus().name(),
                o.getTotalAmount(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                itemResponses);
    }
}
