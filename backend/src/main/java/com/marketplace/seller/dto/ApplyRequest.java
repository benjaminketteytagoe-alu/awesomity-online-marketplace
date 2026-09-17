package com.marketplace.seller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150)
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Shop name is required")
        @Size(min = 2, max = 150)
        String shopName,

        @Size(max = 2000, message = "Description is too long")
        String description
) {}
