package com.marketplace.user;

import com.marketplace.common.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the initial admin user on first boot, if:
 *   - ADMIN_EMAIL and ADMIN_PASSWORD env vars are set, AND
 *   - no user with that email exists yet.
 *
 * Idempotent. Safe to run on every startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.info("AdminSeeder: ADMIN_EMAIL not set — skipping admin creation");
            return;
        }
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("AdminSeeder: ADMIN_EMAIL set but ADMIN_PASSWORD missing — skipping");
            return;
        }
        if (adminPassword.length() < 12) {
            log.error("AdminSeeder: ADMIN_PASSWORD must be at least 12 chars — skipping");
            return;
        }

        String email = adminEmail.toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            log.info("AdminSeeder: admin already exists ({}) — skipping", email);
            return;
        }

        User admin = User.builder()
                .name("Admin")
                .email(email)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(java.time.Instant.now())
                .build();

        userRepository.save(admin);
        log.warn("AdminSeeder: created ADMIN user {} — rotate the password after first login!", email);
    }
}
