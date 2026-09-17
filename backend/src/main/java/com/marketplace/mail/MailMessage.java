package com.marketplace.mail;

import java.util.Map;

public record MailMessage(
        String to,
        String subject,
        String templateName,
        Map<String, Object> variables
) {
    public MailMessage {
        if (to == null || to.isBlank()) throw new IllegalArgumentException("to is required");
        if (subject == null || subject.isBlank()) throw new IllegalArgumentException("subject is required");
        if (templateName == null || templateName.isBlank()) throw new IllegalArgumentException("templateName is required");
        if (variables == null) variables = Map.of();
    }
}
