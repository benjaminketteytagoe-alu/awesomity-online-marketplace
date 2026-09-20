package com.marketplace.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * The current user's own profile.
 *
 * Distinct from AuthService's MeResponse in one way: this includes
 * emailVerifiedAt and createdAt, which are useful for a profile page
 * but not for the auth check that MeResponse serves.
 */
public record UserProfileResponse(
        UUID id,
        String email,
        String name,
        String role,
        String status,
        Instant emailVerifiedAt,
        Instant createdAt
) {}
