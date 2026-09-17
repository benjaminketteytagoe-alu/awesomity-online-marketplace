package com.marketplace.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(min = 2, max = 100)
        String name,

        @Size(max = 500, message = "Description is too long")
        String description
) {}
