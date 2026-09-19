package com.marketplace.category;

import com.marketplace.category.dto.CategoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Public category browsing")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @Operation(summary = "List all categories")
    @GetMapping
    public List<CategoryResponse> list() {
        return service.list();
    }

    @Operation(summary = "Get category by slug")
    @GetMapping("/{slug}")
    public CategoryResponse getBySlug(@PathVariable String slug) {
        return service.getBySlug(slug);
    }
}
