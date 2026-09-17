package com.marketplace.seller;

import com.marketplace.auth.email.EmailJob;
import com.marketplace.auth.email.VerificationTokenGenerator;
import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.mail.MailProperties;
import com.marketplace.messaging.producer.EmailProducer;
import com.marketplace.seller.dto.*;
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
public class SellerApplicationService {

    /** Invite tokens get a much longer TTL than email verification — this is a commitment, not a click. */
    private static final int INVITE_TTL_DAYS = 7;

    private final SellerApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenGenerator tokenGenerator;
    private final EmailProducer emailProducer;
    private final MailProperties mailProperties;

    // ---------------- PUBLIC ----------------

    @Transactional
    public ApplyResponse apply(ApplyRequest req) {
        String email = req.email().toLowerCase().trim();

        // Prevent duplicate pending applications from the same email.
        applicationRepository.findByEmail(email).ifPresent(existing -> {
            switch (existing.getStatus()) {
                case PENDING -> throw new ConflictException(
                        "APPLICATION_PENDING",
                        "An application for this email is already under review");
                case APPROVED -> throw new ConflictException(
                        "APPLICATION_APPROVED",
                        "This email is already approved. Check your inbox for the invite");
                case REJECTED -> { /* allow reapply */ }
            }
        });

        // Prevent applying with an email that already has an account.
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(
                    "EMAIL_ALREADY_REGISTERED",
                    "An account with this email already exists");
        }

        SellerApplication app = SellerApplication.builder()
                .name(req.name().trim())
                .email(email)
                .shopName(req.shopName().trim())
                .description(req.description() == null ? null : req.description().trim())
                .status(ApplicationStatus.PENDING)
                .build();

        applicationRepository.save(app);
        log.info("Seller application submitted id={} email={} shop={}",
                app.getId(), app.getEmail(), app.getShopName());

        return new ApplyResponse(
                app.getId(), app.getEmail(), app.getShopName(),
                app.getStatus().name(),
                "Application received. We'll notify you by email once it's reviewed.");
    }

    @Transactional
    public AcceptInviteResponse acceptInvite(AcceptInviteRequest req) {
        SellerApplication app = applicationRepository.findByInviteToken(req.inviteToken())
                .orElseThrow(() -> new BadRequestException(
                        "INVALID_INVITE", "Invite token is invalid or already used"));

        if (app.getStatus() != ApplicationStatus.APPROVED) {
            throw new BadRequestException(
                    "INVITE_NOT_ACTIVE", "This invite is not in an approved state");
        }

        if (app.getInviteExpiresAt() == null
                || app.getInviteExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                    "INVITE_EXPIRED", "Invite has expired. Please contact support");
        }

        if (userRepository.existsByEmail(app.getEmail())) {
            throw new ConflictException(
                    "EMAIL_ALREADY_REGISTERED",
                    "An account with this email already exists");
        }

        // 1. Create the SELLER user
        User user = User.builder()
                .name(app.getName())
                .email(app.getEmail())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(UserRole.SELLER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(Instant.now())
                .build();
        userRepository.save(user);

        // 2. Create the store — atomic with user creation
        Store store = Store.builder()
                .owner(user)
                .name(app.getShopName())
                .description(app.getDescription())
                .build();
        storeRepository.save(store);

        // 3. Consume the invite token (single-use)
        app.setInviteToken(null);
        app.setInviteExpiresAt(null);
        applicationRepository.save(app);

        log.info("Seller invite accepted: userId={} storeId={} email={}",
                user.getId(), store.getId(), user.getEmail());

        return new AcceptInviteResponse(
                user.getId(), store.getId(), user.getEmail(), user.getName(),
                user.getRole().name(), user.getStatus().name(),
                "Welcome aboard! You can now log in and start managing your shop.");
    }

    // ---------------- ADMIN ----------------

    @Transactional(readOnly = true)
    public Page<SellerApplicationSummary> list(String status, Pageable pageable) {
        Page<SellerApplication> page;
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            page = applicationRepository.findAll(pageable);
        } else {
            ApplicationStatus as;
            try {
                as = ApplicationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("INVALID_STATUS",
                        "Status must be one of: PENDING, APPROVED, REJECTED, ALL");
            }
            page = applicationRepository.findByStatus(as, pageable);
        }
        return page.map(this::toSummary);
    }

    @Transactional
    public SellerApplicationSummary approve(UUID applicationId, UUID adminId) {
        SellerApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found"));

        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new ConflictException("INVALID_STATE",
                    "Only PENDING applications can be approved");
        }

        // Generate invite token
        String inviteToken = tokenGenerator.generate();
        Instant expiresAt = Instant.now().plus(INVITE_TTL_DAYS, ChronoUnit.DAYS);

        app.setStatus(ApplicationStatus.APPROVED);
        app.setInviteToken(inviteToken);
        app.setInviteExpiresAt(expiresAt);
        app.setReviewedAt(Instant.now());
        app.setReviewedBy(userRepository.findById(adminId).orElse(null));
        applicationRepository.save(app);

        publishSellerInviteEmail(app, inviteToken);
        log.info("Seller application approved id={} email={} (invite sent)",
                app.getId(), app.getEmail());

        return toSummary(app);
    }

    @Transactional
    public SellerApplicationSummary reject(UUID applicationId, UUID adminId, RejectRequest req) {
        SellerApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found"));

        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new ConflictException("INVALID_STATE",
                    "Only PENDING applications can be rejected");
        }

        app.setStatus(ApplicationStatus.REJECTED);
        app.setRejectionReason(req.reason().trim());
        app.setReviewedAt(Instant.now());
        app.setReviewedBy(userRepository.findById(adminId).orElse(null));
        applicationRepository.save(app);

        log.info("Seller application rejected id={} email={} reason={}",
                app.getId(), app.getEmail(), req.reason());

        return toSummary(app);
    }

    // ---------------- helpers ----------------

    private SellerApplicationSummary toSummary(SellerApplication app) {
        return new SellerApplicationSummary(
                app.getId(), app.getName(), app.getEmail(), app.getShopName(),
                app.getDescription(), app.getStatus().name(),
                app.getCreatedAt(), app.getReviewedAt(), app.getRejectionReason());
    }

    private void publishSellerInviteEmail(SellerApplication app, String inviteToken) {
        String inviteUrl = mailProperties.getFrontendBaseUrl()
                + "/seller/accept-invite?token=" + inviteToken;

        EmailJob job = new EmailJob(
                app.getEmail(),
                "Your seller application was approved — set up your shop",
                "seller-invite",
                Map.of(
                        "name", app.getName(),
                        "shopName", app.getShopName(),
                        "inviteUrl", inviteUrl,
                        "expiresInDays", INVITE_TTL_DAYS
                ));

        emailProducer.sendSellerInviteEmail(job);
    }
}
