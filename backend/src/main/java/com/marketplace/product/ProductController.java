package com.marketplace.product;

import com.marketplace.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @GetMapping
    public Page<ProductResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.search(categoryId, storeId, q, pageable);
    }

    @GetMapping("/featured")
    public Page<ProductResponse> featured(@PageableDefault(size = 20) Pageable pageable) {
        return service.featured(pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable UUID id) {
        return service.getById(id);
    }
}
