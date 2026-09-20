package com.marketplace.user;

import com.marketplace.security.AuthPrincipal;
import com.marketplace.user.dto.ChangePasswordRequest;
import com.marketplace.user.dto.UpdateProfileRequest;
import com.marketplace.user.dto.UserProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Self-service user endpoints.
 *
 * "Self" is enforced by taking the user id from the AuthPrincipal
 * (JWT), never from the request. A user can only see and modify their
 * own profile.
 */
@RestController
@RequestMapping("/api/users/me")
@Tag(name = "Users (Self)", description = "Current user's profile and password")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @Operation(summary = "Get current user's profile")
    @GetMapping
    public UserProfileResponse me(@AuthenticationPrincipal AuthPrincipal user) {
        return service.getProfile(user.getId());
    }

    @Operation(summary = "Update name")
    @PatchMapping
    public UserProfileResponse update(
            @AuthenticationPrincipal AuthPrincipal user,
            @Valid @RequestBody UpdateProfileRequest req) {
        return service.updateProfile(user.getId(), req);
    }

    @Operation(summary = "Change password")
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthPrincipal user,
            @Valid @RequestBody ChangePasswordRequest req) {
        service.changePassword(user.getId(), req);
        return ResponseEntity.noContent().build();
    }
}
