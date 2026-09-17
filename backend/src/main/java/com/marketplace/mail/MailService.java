package com.marketplace.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MailProperties mailProperties;

    public void send(MailMessage message) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mime, true, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(
                    mailProperties.getFrom(), mailProperties.getFromName()));
            helper.setTo(message.to());
            helper.setSubject(message.subject());

            Context context = new Context(Locale.getDefault(), message.variables());

            String htmlBody = templateEngine.process(
                    "email/" + message.templateName(), context);

            String textBody = null;
            try {
                textBody = templateEngine.process(
                        "email/" + message.templateName() + ".txt", context);
            } catch (Exception ignored) {
                // text fallback is optional
            }

            if (textBody != null && !textBody.isBlank()) {
                helper.setText(textBody, htmlBody);
            } else {
                helper.setText(htmlBody, true);
            }

            mailSender.send(mime);
            log.info("Sent email to={} template={} subject={}",
                    message.to(), message.templateName(), message.subject());

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to={} template={}: {}",
                    message.to(), message.templateName(), e.getMessage(), e);
            throw new MailSendingException(
                    "Failed to send email to " + message.to(), e);
        }
    }
}
