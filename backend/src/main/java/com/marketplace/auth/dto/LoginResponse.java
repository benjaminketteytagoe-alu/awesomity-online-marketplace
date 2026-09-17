package com.marketplace.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserSummary user
) {
    public record UserSummary(
            String id,
            String email,
            String name,
            String role,
            String status
    ) {}
}
