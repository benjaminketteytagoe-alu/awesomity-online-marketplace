package com.marketplace.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Standard error response body for all API errors.
 * Mirrors the RFC 7807-ish shape without the full envelope.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldViolation> errors
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(int status, String code, String message, String path) {
        return new ApiError(Instant.now(), status, code, message, path, null);
    }

    public static ApiError withFields(int status, String code, String message,
                                      String path, List<FieldViolation> errors) {
        return new ApiError(Instant.now(), status, code, message, path, errors);
    }
}
