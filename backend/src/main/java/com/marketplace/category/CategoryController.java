package com.marketplace.category;

import com.marketplace.category.dto.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    public List<CategoryResponse> list() {
        return service.list();
    }

    @GetMapping("/{slug}")
    public CategoryResponse getBySlug(@PathVariable String slug) {
        return service.getBySlug(slug);
    }
}
