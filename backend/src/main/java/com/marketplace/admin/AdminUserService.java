package com.marketplace.admin;

import com.marketplace.admin.dto.AdminUserDetail;
import com.marketplace.admin.dto.AdminUserSummary;
import com.marketplace.admin.dto.UpdateUserRoleRequest;
import com.marketplace.admin.dto.UpdateUserStatusRequest;
import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.store.Store;
import com.marketplace.store.StoreRepository;
import com.marketplace.user.User;
import com.marketplace.user.UserRepository;
import com.marketplace.user.UserRole;
import com.marketplace.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public Page<AdminUserSummary> list(String role, String status, Pageable pageable) {
        if (role != null && !role.isBlank()) {
            UserRole r = parseEnum(UserRole.class, role, "role");
            return userRepository.findByRole(r, pageable).map(this::toSummary);
        }
        if (status != null && !status.isBlank()) {
            UserStatus s = parseEnum(UserStatus.class, status, "status");
            return userRepository.findByStatus(s, pageable).map(this::toSummary);
        }
        return userRepository.findAll(pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public AdminUserDetail get(UUID id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Store store = storeRepository.findByOwnerId(id).orElse(null);
        return toDetail(u, store);
    }

    @Transactional
    public AdminUserDetail updateStatus(UUID adminId, UUID targetId, UpdateUserStatusRequest req) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        UserStatus next = UserStatus.valueOf(req.status());

        if (target.getId().equals(adminId) && next == UserStatus.SUSPENDED) {
            throw new BadRequestException("SELF_SUSPEND",
                    "You cannot suspend your own account");
        }

        target.setStatus(next);
        userRepository.save(target);
        log.warn("Admin {} set user {} status={}", adminId, targetId, next);

        Store store = storeRepository.findByOwnerId(targetId).orElse(null);
        return toDetail(target, store);
    }

    @Transactional
    public AdminUserDetail updateRole(UUID adminId, UUID targetId, UpdateUserRoleRequest req) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        UserRole next = UserRole.valueOf(req.role());

        // Refuse if target owns a store but is being demoted away from SELLER.
        boolean ownsStore = storeRepository.existsByOwnerId(targetId);
        if (ownsStore && next != UserRole.SELLER) {
            throw new BadRequestException("HAS_STORE",
                    "Cannot change role: user owns a store. Transfer or delete the store first.");
        }

        target.setRole(next);
        userRepository.save(target);
        log.warn("Admin {} set user {} role={}", adminId, targetId, next);

        Store store = storeRepository.findByOwnerId(targetId).orElse(null);
        return toDetail(target, store);
    }

    // ---------------- helpers ----------------

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
        try {
            return Enum.valueOf(type, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_" + field.toUpperCase(),
                    "Invalid " + field + ": " + value);
        }
    }

    private AdminUserSummary toSummary(User u) {
        return new AdminUserSummary(
                u.getId(), u.getEmail(), u.getName(),
                u.getRole().name(), u.getStatus().name(),
                u.getEmailVerifiedAt(), u.getCreatedAt());
    }

    private AdminUserDetail toDetail(User u, Store store) {
        return new AdminUserDetail(
                u.getId(), u.getEmail(), u.getName(),
                u.getRole().name(), u.getStatus().name(),
                u.getEmailVerifiedAt(), u.getCreatedAt(), u.getUpdatedAt(),
                store == null ? null : store.getId(),
                store == null ? null : store.getName());
    }
}
