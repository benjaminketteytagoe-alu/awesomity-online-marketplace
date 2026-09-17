package com.marketplace.order;

import com.marketplace.order.dto.OrderResponse;
import com.marketplace.order.dto.OrderSummary;
import com.marketplace.order.dto.UpdateOrderStatusRequest;
import com.marketplace.security.AuthPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {

    private final OrderService service;

    @GetMapping
    public Page<OrderSummary> list(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForSeller(seller.getId(), pageable);
    }

    @GetMapping("/{id}")
    public OrderResponse get(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id) {
        return service.getForSeller(seller.getId(), id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        return service.updateStatusBySeller(
                seller.getId(), id, OrderStatus.valueOf(req.status().toUpperCase()));
    }
}
