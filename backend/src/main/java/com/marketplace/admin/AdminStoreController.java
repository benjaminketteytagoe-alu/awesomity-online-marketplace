package com.marketplace.admin;

import com.marketplace.admin.dto.AdminStoreSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/stores")
@Tag(name = "Admin - Stores", description = "Store management (GOD MODE)")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStoreController {

    private final AdminStoreService service;

    @Operation(summary = "List stores")
    @GetMapping
    public Page<AdminStoreSummary> list(@PageableDefault(size = 20) Pageable pageable) {
        return service.list(pageable);
    }

    @Operation(summary = "Get store detail")
    @GetMapping("/{id}")
    public AdminStoreSummary get(@PathVariable UUID id) {
        return service.get(id);
    }

    @Operation(summary = "Soft-delete store + cascade products")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
