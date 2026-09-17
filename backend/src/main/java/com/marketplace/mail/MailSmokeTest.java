package com.marketplace.mail;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Map;


@Component
@Profile("mailtest")
public class MailSmokeTest implements ApplicationRunner {

    private final MailService mailService;

    public MailSmokeTest(MailService mailService) {
        this.mailService = mailService;
    }

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("MAIL_TEST: sending smoke test");
        mailService.send(new MailMessage(
                "smoke-test@example.com",
                "Verify your email",
                "verification",
                Map.of(
                        "name", "Smoke Tester",
                        "verificationUrl", "http://localhost:3000/verify?token=abc123",
                        "expiresInMinutes", 60
                )
        ));
        System.out.println("MAIL_TEST: sent — check Mailhog at http://localhost:8025");
    }
}
