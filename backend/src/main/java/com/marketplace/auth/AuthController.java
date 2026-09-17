package com.marketplace.auth;

import com.marketplace.auth.dto.RegisterRequest;
import com.marketplace.auth.dto.RegisterResponse;
import com.marketplace.auth.dto.VerifyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest req) {
        RegisterResponse resp = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(
            @RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }
}
