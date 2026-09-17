package com.marketplace.seller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 500, message = "Reason is too long")
        String reason
) {}
