package com.marketplace.product;

import com.marketplace.product.dto.ProductResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@Tag(name = "Admin - Products", description = "Feature management and moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService service;

    @Operation(summary = "Mark product as featured")
    @PatchMapping("/{id}/feature")
    public ProductResponse feature(@PathVariable UUID id) {
        return service.setFeatured(id, true);
    }

    @Operation(summary = "Remove featured flag")
    @PatchMapping("/{id}/unfeature")
    public ProductResponse unfeature(@PathVariable UUID id) {
        return service.setFeatured(id, false);
    }

    @Operation(summary = "Soft-delete any product")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.adminSoftDelete(id);
    }
}
