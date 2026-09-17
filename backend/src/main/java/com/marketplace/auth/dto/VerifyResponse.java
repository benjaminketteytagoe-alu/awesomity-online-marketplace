package com.marketplace.auth.dto;

import java.util.UUID;

public record VerifyResponse(
        UUID id,
        String email,
        String status,
        String message
) {}
