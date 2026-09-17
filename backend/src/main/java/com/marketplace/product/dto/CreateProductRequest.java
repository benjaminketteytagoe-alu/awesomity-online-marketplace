package com.marketplace.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 200)
        String name,

        @Size(max = 5000, message = "Description is too long")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Price has too many digits")
        BigDecimal price,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        Integer stock,

        @NotNull(message = "Category is required")
        UUID categoryId
) {}
