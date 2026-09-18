package com.marketplace.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDetail(
        UUID id,
        String email,
        String name,
        String role,
        String status,
        Instant emailVerifiedAt,
        Instant createdAt,
        Instant updatedAt,
        UUID storeId,
        String storeName
) {}
