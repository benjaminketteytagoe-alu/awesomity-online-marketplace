package com.marketplace.unit;

import com.marketplace.config.JwtProperties;
import com.marketplace.security.JwtService;
import com.marketplace.user.User;
import com.marketplace.user.UserRole;
import com.marketplace.user.UserStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    private static final String SECRET_A =
            "test-secret-a-must-be-at-least-64-chars-long-for-hs512-signing-do-not-use-anywhere";
    private static final String SECRET_B =
            "test-secret-b-must-be-at-least-64-chars-long-for-hs512-signing-do-not-use-anywhere";

    @BeforeEach
    void setUp() {
        jwtService = buildJwtService(SECRET_A, "marketplace-test");

        user = User.builder()
                .name("Test User")
                .email("test@example.com")
                .role(UserRole.SHOPPER)
                .status(UserStatus.ACTIVE)
                .build();
        user.setId(UUID.randomUUID());
    }

    @Test
    void accessToken_isParseableAndTypedAsAccess() {
        String token = jwtService.generateAccessToken(user);
        Claims claims = jwtService.parse(token);

        assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
        assertThat(jwtService.isAccessToken(claims)).isTrue();
        assertThat(jwtService.isRefreshToken(claims)).isFalse();
        assertThat(claims.get("role", String.class)).isEqualTo("SHOPPER");
        assertThat(claims.get("name", String.class)).isEqualTo("Test User");
        assertThat(claims.getIssuer()).isEqualTo("marketplace-test");
    }

    @Test
    void refreshToken_isParseableAndTypedAsRefresh() {
        String token = jwtService.generateRefreshToken(user);
        Claims claims = jwtService.parse(token);

        assertThat(jwtService.isRefreshToken(claims)).isTrue();
        assertThat(jwtService.isAccessToken(claims)).isFalse();
        assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
    }

    @Test
    void parsingGarbage_throws() {
        assertThatThrownBy(() -> jwtService.parse("not.a.jwt"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void parsingTokenSignedWithDifferentKey_throws() {
        JwtService otherService = buildJwtService(SECRET_B, "marketplace-test");
        String foreignToken = otherService.generateAccessToken(user);

        assertThatThrownBy(() -> jwtService.parse(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void issuerMismatch_throws() {
        JwtService wrongIssuerService = buildJwtService(SECRET_A, "some-other-service");
        String foreignToken = wrongIssuerService.generateAccessToken(user);

        assertThatThrownBy(() -> jwtService.parse(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    private JwtService buildJwtService(String secret, String issuer) {
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setAccessTtlMinutes(15);
        props.setRefreshTtlDays(7);
        props.setIssuer(issuer);

        JwtService service = new JwtService(props);
        service.init();
        return service;
    }
}
