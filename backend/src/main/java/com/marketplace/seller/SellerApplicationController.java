package com.marketplace.seller;

import com.marketplace.seller.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller-applications")
@Tag(name = "Seller Applications", description = "Public seller application and invite acceptance")
@RequiredArgsConstructor
public class SellerApplicationController {

    private final SellerApplicationService service;

    @Operation(summary = "Submit a seller application (public)")
    @PostMapping
    public ResponseEntity<ApplyResponse> apply(@Valid @RequestBody ApplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.apply(req));
    }

    @Operation(summary = "Accept a seller invite and create account + store")
    @PostMapping("/accept")
    public ResponseEntity<AcceptInviteResponse> accept(
            @Valid @RequestBody AcceptInviteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.acceptInvite(req));
    }
}
