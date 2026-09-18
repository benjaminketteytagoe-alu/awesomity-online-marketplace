package com.marketplace.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserRoleRequest(
        @NotBlank(message = "Role is required")
        @Pattern(regexp = "^(ADMIN|SHOPPER|SELLER)$",
                 message = "Role must be ADMIN, SHOPPER, or SELLER")
        String role
) {}
