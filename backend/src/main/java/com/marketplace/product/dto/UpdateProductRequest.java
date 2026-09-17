package com.marketplace.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Partial update — every field is optional. Null = leave unchanged.
 */
public record UpdateProductRequest(
        @Size(min = 2, max = 200)
        String name,

        @Size(max = 5000)
        String description,

        @DecimalMin(value = "0.00")
        @Digits(integer = 10, fraction = 2)
        BigDecimal price,

        @Min(0)
        Integer stock,

        UUID categoryId
) {}
