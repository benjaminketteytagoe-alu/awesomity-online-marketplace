package com.marketplace.auth.dto;

import java.util.UUID;

public record RegisterResponse(
        UUID id,
        String email,
        String name,
        String status,
        String message
) {}
