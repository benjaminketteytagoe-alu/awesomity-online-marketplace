package com.marketplace.mail;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {
    private String from = "no-reply@marketplace.local";
    private String fromName = "Marketplace";
    private String frontendBaseUrl = "http://localhost:3000";
    private int tokenTtlMinutes = 60;
}
