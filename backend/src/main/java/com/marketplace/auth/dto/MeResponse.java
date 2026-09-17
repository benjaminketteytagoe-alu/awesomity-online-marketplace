package com.marketplace.auth.dto;

public record MeResponse(
        String id,
        String email,
        String name,
        String role,
        String status
) {}
