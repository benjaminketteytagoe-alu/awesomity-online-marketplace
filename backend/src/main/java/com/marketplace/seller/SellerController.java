package com.marketplace.seller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

    @GetMapping("/ping")
    @PreAuthorize("hasRole('SELLER')")
    public Map<String, Object> ping() {
        return Map.of("ok", true, "scope", "seller");
    }
}
