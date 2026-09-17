package com.marketplace.auth.email;

import java.util.Map;

/**
 * Payload published to RabbitMQ for asynchronous email dispatch.
 *
 * The consumer deserializes this from JSON and calls MailService.
 */
public record EmailJob(
        String to,
        String subject,
        String templateName,
        Map<String, Object> variables
) {}
