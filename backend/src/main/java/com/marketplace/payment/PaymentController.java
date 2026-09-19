package com.marketplace.payment;

import com.marketplace.payment.dto.PayOrderRequest;
import com.marketplace.payment.dto.PaymentResponse;
import com.marketplace.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Payments", description = "Mock card + mobile money payment for pending orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SHOPPER')")
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Pay for an order (CARD or MOBILE_MONEY)")
    @PostMapping("/{orderId}/pay")
    public PaymentResponse pay(
            @AuthenticationPrincipal AuthPrincipal shopper,
            @PathVariable UUID orderId,
            @Valid @RequestBody PayOrderRequest request) {
        return paymentService.pay(shopper.getId(), orderId, request);
    }
}
