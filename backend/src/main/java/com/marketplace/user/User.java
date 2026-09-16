package com.marketplace.user;

import com.marketplace.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /** Null until the user completes an invite / sets a password. */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "role", nullable = false, columnDefinition = "user_role")
    @Builder.Default
    private UserRole role = UserRole.SHOPPER;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "user_status")
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "verify_token", length = 255)
    private String verifyToken;

    @Column(name = "verify_expires_at")
    private Instant verifyExpiresAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ---- Business helpers ----

    public boolean isVerified() {
        return emailVerifiedAt != null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
