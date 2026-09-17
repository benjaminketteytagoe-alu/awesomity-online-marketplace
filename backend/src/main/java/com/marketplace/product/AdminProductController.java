package com.marketplace.product;

import com.marketplace.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService service;

    @PatchMapping("/{id}/feature")
    public ProductResponse feature(@PathVariable UUID id) {
        return service.setFeatured(id, true);
    }

    @PatchMapping("/{id}/unfeature")
    public ProductResponse unfeature(@PathVariable UUID id) {
        return service.setFeatured(id, false);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.adminSoftDelete(id);
    }
}
