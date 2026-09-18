package com.marketplace.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(ACTIVE|SUSPENDED)$",
                 message = "Status must be ACTIVE or SUSPENDED")
        String status
) {}
