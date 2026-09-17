package com.marketplace.seller.dto;

import java.util.UUID;

public record ApplyResponse(
        UUID id,
        String email,
        String shopName,
        String status,
        String message
) {}
