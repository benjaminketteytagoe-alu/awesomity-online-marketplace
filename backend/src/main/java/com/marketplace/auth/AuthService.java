package com.marketplace.auth;

import com.marketplace.auth.dto.*;
import com.marketplace.auth.email.EmailJob;
import com.marketplace.auth.email.VerificationTokenGenerator;
import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.mail.MailProperties;
import com.marketplace.messaging.producer.EmailProducer;
import com.marketplace.security.JwtService;
import com.marketplace.user.User;
import com.marketplace.user.UserRepository;
import com.marketplace.user.UserRole;
import com.marketplace.user.UserStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenGenerator tokenGenerator;
    private final EmailProducer emailProducer;
    private final MailProperties mailProperties;
    private final JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_ALREADY_REGISTERED",
                    "An account with this email already exists");
        }

        String token = tokenGenerator.generate();
        Instant now = Instant.now();
        Instant expiresAt = now.plus(
                mailProperties.getTokenTtlMinutes(), ChronoUnit.MINUTES);

        User user = User.builder()
                .name(req.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(UserRole.SHOPPER)
                .status(UserStatus.PENDING_VERIFICATION)
                .verifyToken(token)
                .verifyExpiresAt(expiresAt)
                .build();

        userRepository.save(user);
        log.info("Registered user id={} email={}", user.getId(), user.getEmail());

        publishVerificationEmail(user, token);

        return new RegisterResponse(
                user.getId(), user.getEmail(), user.getName(),
                user.getStatus().name(),
                "Check your inbox to verify your email and activate your account.");
    }

    @Transactional
    public VerifyResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("MISSING_TOKEN", "Verification token is required");
        }

        User user = userRepository.findByVerifyToken(token)
                .orElseThrow(() -> new BadRequestException(
                        "INVALID_TOKEN", "Verification token is invalid or already used"));

        if (user.getEmailVerifiedAt() != null) {
            throw new BadRequestException(
                    "ALREADY_VERIFIED", "This email has already been verified");
        }

        if (user.getVerifyExpiresAt() == null
                || user.getVerifyExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                    "TOKEN_EXPIRED", "Verification token has expired");
        }

        user.setEmailVerifiedAt(Instant.now());
        user.setStatus(UserStatus.ACTIVE);
        user.setVerifyToken(null);
        user.setVerifyExpiresAt(null);
        userRepository.save(user);

        log.info("Verified user id={} email={}", user.getId(), user.getEmail());

        return new VerifyResponse(
                user.getId(), user.getEmail(), user.getStatus().name(),
                "Email verified. You can now log in.");
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        String email = req.email().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Account is suspended");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException(
                    "Email not verified. Check your inbox to activate your account.");
        }

        String access = jwtService.generateAccessToken(user);
        String refresh = jwtService.generateRefreshToken(user);

        log.info("Login success userId={} email={}", user.getId(), user.getEmail());

        return new LoginResponse(
                access, refresh, "Bearer",
                jwtService.getAccessTtlSeconds(),
                new LoginResponse.UserSummary(
                        user.getId().toString(),
                        user.getEmail(),
                        user.getName(),
                        user.getRole().name(),
                        user.getStatus().name()
                ));
    }

    @Transactional(readOnly = true)
    public RefreshResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwtService.parse(req.refreshToken());
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        if (!jwtService.isRefreshToken(claims)) {
            throw new UnauthorizedException("Provided token is not a refresh token");
        }

        UUID userId = jwtService.extractUserId(claims);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User no longer exists"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }

        String newAccess = jwtService.generateAccessToken(user);

        return new RefreshResponse(
                newAccess, "Bearer", jwtService.getAccessTtlSeconds());
    }

    @Transactional(readOnly = true)
    public MeResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return new MeResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getStatus().name());
    }

    private void publishVerificationEmail(User user, String token) {
        String verificationUrl = mailProperties.getFrontendBaseUrl()
                + "/verify?token=" + token;

        EmailJob job = new EmailJob(
                user.getEmail(),
                "Verify your email",
                "verification",
                Map.of(
                        "name", user.getName(),
                        "verificationUrl", verificationUrl,
                        "expiresInMinutes", mailProperties.getTokenTtlMinutes()
                ));

        emailProducer.sendVerificationEmail(job);
    }
}
