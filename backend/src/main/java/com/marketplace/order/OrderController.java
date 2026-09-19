package com.marketplace.order;

import com.marketplace.order.dto.*;
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
@RequestMapping("/api/orders")
@Tag(name = "Orders (Shopper)", description = "Order placement, history, tracking")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SHOPPER')")
public class OrderController {

    private final OrderService service;

    @Operation(summary = "Place a new order (returns PENDING)")
    @PostMapping
    public ResponseEntity<PlaceOrderResponse> place(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @Valid @RequestBody PlaceOrderRequest req) {
        PlaceOrderResponse resp = service.place(shopper.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "List own order history")
    @GetMapping
    public Page<OrderSummary> list(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForShopper(shopper.getId(), pageable);
    }

    @Operation(summary = "Get order detail")
    @GetMapping("/{id}")
    public OrderResponse get(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @PathVariable UUID id) {
        return service.getForShopper(shopper.getId(), id);
    }

    @Operation(summary = "Cancel an order")
    @PatchMapping("/{id}/cancel")
    public OrderResponse cancel(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @PathVariable UUID id) {
        return service.cancelByShopper(shopper.getId(), id);
    }
}
