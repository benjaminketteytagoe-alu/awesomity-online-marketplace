package com.marketplace.seller;

import com.marketplace.seller.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller-applications")
@RequiredArgsConstructor
public class SellerApplicationController {

    private final SellerApplicationService service;

    @PostMapping
    public ResponseEntity<ApplyResponse> apply(@Valid @RequestBody ApplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.apply(req));
    }

    @PostMapping("/accept")
    public ResponseEntity<AcceptInviteResponse> accept(
            @Valid @RequestBody AcceptInviteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.acceptInvite(req));
    }
}
