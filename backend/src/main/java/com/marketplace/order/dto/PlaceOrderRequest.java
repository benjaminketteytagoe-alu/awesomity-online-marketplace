package com.marketplace.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;

public record PlaceOrderRequest(
        @NotEmpty(message = "Order must contain at least one item")
        @Valid
        List<Item> items
) {
    public record Item(
            @NotNull(message = "Product id is required")
            UUID productId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 100, message = "Quantity per item cannot exceed 100")
            Integer quantity
    ) {}
}
