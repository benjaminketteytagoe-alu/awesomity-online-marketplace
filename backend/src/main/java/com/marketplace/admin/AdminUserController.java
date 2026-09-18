package com.marketplace.admin;

import com.marketplace.admin.dto.AdminUserDetail;
import com.marketplace.admin.dto.AdminUserSummary;
import com.marketplace.admin.dto.UpdateUserRoleRequest;
import com.marketplace.admin.dto.UpdateUserStatusRequest;
import com.marketplace.security.AuthPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping
    public Page<AdminUserSummary> list(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.list(role, status, pageable);
    }

    @GetMapping("/{id}")
    public AdminUserDetail get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PatchMapping("/{id}/status")
    public AdminUserDetail updateStatus(
            @AuthenticationPrincipal AuthPrincipal admin,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest req) {
        return service.updateStatus(admin.getId(), id, req);
    }

    @PatchMapping("/{id}/role")
    public AdminUserDetail updateRole(
            @AuthenticationPrincipal AuthPrincipal admin,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest req) {
        return service.updateRole(admin.getId(), id, req);
    }
}
