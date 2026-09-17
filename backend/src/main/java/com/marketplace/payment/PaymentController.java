package com.marketplace.payment;

import com.marketplace.payment.dto.PayOrderRequest;
import com.marketplace.payment.dto.PaymentResponse;
import com.marketplace.security.AuthPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SHOPPER')")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{orderId}/pay")
    public PaymentResponse pay(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @PathVariable UUID orderId,
            @Valid @RequestBody PayOrderRequest request) {
        return paymentService.pay(shopper.getId(), orderId, request);
    }
}
