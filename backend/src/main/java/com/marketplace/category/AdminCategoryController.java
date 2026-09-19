package com.marketplace.category;

import com.marketplace.category.dto.CategoryRequest;
import com.marketplace.category.dto.CategoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
@Tag(name = "Admin - Categories", description = "Category CRUD")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService service;

    @Operation(summary = "Create a category")
    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @Operation(summary = "Update a category")
    @PatchMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable UUID id, @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @Operation(summary = "Delete a category (only if unused)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
