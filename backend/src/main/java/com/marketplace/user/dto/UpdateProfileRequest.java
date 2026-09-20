package com.marketplace.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Self-service profile update.
 *
 * Only name is editable. Email changes require a re-verification flow
 * that is out of scope — documented in the README.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150, message = "Name must be 2-150 characters")
        String name
) {}
