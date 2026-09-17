package com.marketplace.order;

import com.marketplace.order.dto.OrderResponse;
import com.marketplace.order.dto.OrderSummary;
import com.marketplace.order.dto.UpdateOrderStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService service;

    @GetMapping
    public Page<OrderSummary> list(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForAdmin(status, pageable);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable UUID id) {
        return service.getForAdmin(id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse forceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        return service.forceStatus(id, OrderStatus.valueOf(req.status().toUpperCase()));
    }
}
