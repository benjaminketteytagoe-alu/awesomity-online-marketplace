package com.marketplace.auth.dto;

public record RefreshResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds
) {}
