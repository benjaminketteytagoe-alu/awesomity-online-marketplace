package com.marketplace.product;

import com.marketplace.product.dto.ProductResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Public product browsing and search")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @Operation(summary = "List/search products with filters")
    @GetMapping
    public Page<ProductResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.search(categoryId, storeId, q, pageable);
    }

    @Operation(summary = "List featured products")
    @GetMapping("/featured")
    public Page<ProductResponse> featured(@PageableDefault(size = 20) Pageable pageable) {
        return service.featured(pageable);
    }

    @Operation(summary = "Get product by id")
    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable UUID id) {
        return service.getById(id);
    }
}
