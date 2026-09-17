package com.marketplace.payment;

import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.ForbiddenException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.messaging.producer.OrderProducer;
import com.marketplace.order.*;
import com.marketplace.order.event.OrderPlacedEvent;
import com.marketplace.payment.dto.PayOrderRequest;
import com.marketplace.payment.dto.PaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MockPaymentGateway gateway;
    private final OrderProducer orderProducer;

    @Transactional
    public PaymentResponse pay(UUID shopperId, UUID orderId, PayOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (!order.getShopper().getId().equals(shopperId)) {
            throw new ForbiddenException("This order belongs to a different user");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("ORDER_NOT_PAYABLE",
                    "Only PENDING orders can be paid. Current status: " + order.getStatus());
        }

        PaymentMethod method = parseMethod(request);

        // 1. Call the mock PSP
        MockPaymentGateway.Result result = gateway.charge(request);

        // 2. Record the attempt either way
        Payment payment = Payment.builder()
                .order(order)
                .method(method)
                .status(result.success() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED)
                .amount(order.getTotalAmount())
                .reference(result.reference())
                .build();
        paymentRepository.saveAndFlush(payment);

        if (!result.success()) {
            log.info("Payment failed orderId={} method={} reason={}",
                    orderId, method, result.failureReason());
            return new PaymentResponse(
                    payment.getId(), orderId, method.name(), payment.getStatus().name(),
                    payment.getAmount(), null,
                    result.failureReason() != null
                            ? result.failureReason()
                            : "Payment failed. Please try again with a different method.",
                    payment.getCreatedAt());
        }

        // 3. Payment succeeded — publish OrderPlaced to kick off the async pipeline
        //    (the consumer decrements stock, marks PAID, and emails parties.)
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        List<OrderPlacedEvent.Item> eventItems = new ArrayList<>();
        for (OrderItem oi : items) {
            eventItems.add(new OrderPlacedEvent.Item(
                    oi.getProduct().getId(),
                    oi.getProduct().getStore().getId(),
                    oi.getProduct().getStore().getOwner().getId(),
                    oi.getProduct().getName(),
                    oi.getQuantity()
            ));
        }
        orderProducer.publishOrderPlaced(new OrderPlacedEvent(
                order.getId(),
                order.getShopper().getId(),
                order.getShopper().getEmail(),
                order.getShopper().getName(),
                eventItems));

        log.info("Payment succeeded orderId={} method={} ref={}",
                orderId, method, result.reference());

        return new PaymentResponse(
                payment.getId(), orderId, method.name(), payment.getStatus().name(),
                payment.getAmount(), result.reference(),
                "Payment accepted. Your order is being confirmed.",
                payment.getCreatedAt());
    }

    private PaymentMethod parseMethod(PayOrderRequest req) {
        String raw = req.method();
        try {
            return PaymentMethod.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_METHOD",
                    "Payment method must be CARD or MOBILE_MONEY");
        }
    }
}
