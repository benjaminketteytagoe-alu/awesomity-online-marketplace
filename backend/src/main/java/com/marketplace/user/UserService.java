package com.marketplace.user;

import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.user.dto.ChangePasswordRequest;
import com.marketplace.user.dto.UpdateProfileRequest;
import com.marketplace.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        return toResponse(find(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = find(userId);
        user.setName(req.name().trim());
        userRepository.save(user);
        log.info("Profile updated userId={}", userId);
        return toResponse(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest req) {
        User user = find(userId);

        if (user.getPasswordHash() == null) {
            throw new BadRequestException("NO_PASSWORD",
                    "This account has no password set. Complete your account setup first.");
        }
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("INVALID_CURRENT_PASSWORD",
                    "Current password is incorrect");
        }
        if (req.currentPassword().equals(req.newPassword())) {
            throw new BadRequestException("SAME_PASSWORD",
                    "New password must be different from the current one");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        log.info("Password changed userId={}", userId);
    }

    // ---------------- helpers ----------------

    private User find(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserProfileResponse toResponse(User u) {
        return new UserProfileResponse(
                u.getId(),
                u.getEmail(),
                u.getName(),
                u.getRole().name(),
                u.getStatus().name(),
                u.getEmailVerifiedAt(),
                u.getCreatedAt());
    }
}
