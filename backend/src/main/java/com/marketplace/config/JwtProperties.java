package com.marketplace.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * HMAC signing secret. Must be at least 64 bytes for HS512.
     * Loaded from JWT_SECRET env var.
     */
    private String secret;

    /** Access token time-to-live, in minutes. */
    private long accessTtlMinutes = 15;

    /** Refresh token time-to-live, in days. */
    private long refreshTtlDays = 7;

    /** Issuer claim. */
    private String issuer = "marketplace";
}
