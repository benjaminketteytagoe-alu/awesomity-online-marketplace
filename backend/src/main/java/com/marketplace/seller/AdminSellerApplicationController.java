package com.marketplace.seller;

import com.marketplace.seller.dto.RejectRequest;
import com.marketplace.seller.dto.SellerApplicationSummary;
import com.marketplace.security.AuthPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/seller-applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSellerApplicationController {

    private final SellerApplicationService service;

    @GetMapping
    public Page<SellerApplicationSummary> list(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.list(status, pageable);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<SellerApplicationSummary> approve(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthPrincipal admin) {
        return ResponseEntity.ok(service.approve(id, admin.getId()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SellerApplicationSummary> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest req,
            @AuthenticationPrincipal AuthPrincipal admin) {
        return ResponseEntity.ok(service.reject(id, admin.getId(), req));
    }
}
