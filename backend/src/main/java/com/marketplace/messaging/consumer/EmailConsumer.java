package com.marketplace.messaging.consumer;

import com.marketplace.auth.email.EmailJob;
import com.marketplace.mail.MailMessage;
import com.marketplace.mail.MailService;
import com.marketplace.messaging.RabbitNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final MailService mailService;

    @RabbitListener(queues = RabbitNames.QUEUE_EMAIL_VERIFICATION)
    public void onVerificationEmail(EmailJob job) {
        log.info("Received verification email job for {}", job.to());
        mailService.send(new MailMessage(
                job.to(), job.subject(), job.templateName(), job.variables()));
    }

    @RabbitListener(queues = RabbitNames.QUEUE_EMAIL_ORDER_STATUS)
    public void onOrderStatusEmail(EmailJob job) {
        log.info("Received order-status email job for {}", job.to());
        mailService.send(new MailMessage(
                job.to(), job.subject(), job.templateName(), job.variables()));
    }

    @RabbitListener(queues = RabbitNames.QUEUE_EMAIL_SELLER_INVITE)
    public void onSellerInviteEmail(EmailJob job) {
        log.info("Received seller-invite email job for {}", job.to());
        mailService.send(new MailMessage(
                job.to(), job.subject(), job.templateName(), job.variables()));
    }
}
