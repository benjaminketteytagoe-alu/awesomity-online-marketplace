package com.marketplace.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummary(
        UUID id,
        String email,
        String name,
        String role,
        String status,
        Instant emailVerifiedAt,
        Instant createdAt
) {}
