package com.marketplace.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        Boolean featured,
        UUID storeId,
        String storeName,
        UUID categoryId,
        String categoryName,
        String categorySlug,
        Instant createdAt,
        Instant updatedAt
) {}
