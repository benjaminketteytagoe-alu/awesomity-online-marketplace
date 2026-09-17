package com.marketplace.seller.dto;

import java.util.UUID;

public record AcceptInviteResponse(
        UUID userId,
        UUID storeId,
        String email,
        String name,
        String role,
        String status,
        String message
) {}
