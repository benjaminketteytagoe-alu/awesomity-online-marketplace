package com.marketplace.order;

import com.marketplace.order.dto.OrderResponse;
import com.marketplace.order.dto.OrderSummary;
import com.marketplace.order.dto.UpdateOrderStatusRequest;
import com.marketplace.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Seller - Orders", description = "Orders containing the seller's products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {

    private final OrderService service;

    @Operation(summary = "List orders with own products")
    @GetMapping
    public Page<OrderSummary> list(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForSeller(seller.getId(), pageable);
    }

    @Operation(summary = "Get order detail scoped to seller items")
    @GetMapping("/{id}")
    public OrderResponse get(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id) {
        return service.getForSeller(seller.getId(), id);
    }

    @Operation(summary = "Advance order status (PAID → SHIPPED → DELIVERED)")
    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        return service.updateStatusBySeller(
                seller.getId(), id, OrderStatus.valueOf(req.status().toUpperCase()));
    }
}
