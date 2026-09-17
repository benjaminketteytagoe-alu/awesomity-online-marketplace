package com.marketplace.messaging.producer;

import com.marketplace.auth.email.EmailJob;
import com.marketplace.messaging.RabbitNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendVerificationEmail(EmailJob job) {
        publish(RabbitNames.ROUTING_EMAIL_VERIFICATION, job);
    }

    public void sendOrderStatusEmail(EmailJob job) {
        publish(RabbitNames.ROUTING_EMAIL_ORDER_STATUS, job);
    }

    public void sendSellerInviteEmail(EmailJob job) {
        publish(RabbitNames.ROUTING_EMAIL_SELLER_INVITE, job);
    }

    private void publish(String routingKey, EmailJob job) {
        log.debug("Publishing email job routingKey={} to={} template={}",
                routingKey, job.to(), job.templateName());
        rabbitTemplate.convertAndSend(RabbitNames.EXCHANGE, routingKey, job);
    }
}
