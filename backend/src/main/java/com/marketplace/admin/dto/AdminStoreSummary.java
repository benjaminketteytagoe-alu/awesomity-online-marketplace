package com.marketplace.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminStoreSummary(
        UUID id,
        String name,
        String description,
        UUID ownerId,
        String ownerEmail,
        String ownerName,
        long productCount,
        Instant createdAt
) {}
