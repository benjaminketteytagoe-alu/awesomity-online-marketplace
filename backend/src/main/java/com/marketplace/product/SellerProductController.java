package com.marketplace.product;

import com.marketplace.product.dto.CreateProductRequest;
import com.marketplace.product.dto.ProductResponse;
import com.marketplace.product.dto.UpdateProductRequest;
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
@RequestMapping("/api/seller/products")
@Tag(name = "Seller - Products", description = "Product management for the authenticated seller's store")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerProductController {

    private final ProductService service;

    @Operation(summary = "List own products")
    @GetMapping
    public Page<ProductResponse> list(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listForSeller(seller.getId(), pageable);
    }

    @Operation(summary = "Create a product")
    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @AuthenticationPrincipal AuthPrincipal seller,
            @Valid @RequestBody CreateProductRequest req) {
        ProductResponse p = service.createForSeller(seller.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(p);
    }

    @Operation(summary = "Update own product")
    @PatchMapping("/{id}")
    public ProductResponse update(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest req) {
        return service.updateForSeller(seller.getId(), id, req);
    }

    @Operation(summary = "Soft-delete own product")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthPrincipal seller,
            @PathVariable UUID id) {
        service.softDeleteForSeller(seller.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
