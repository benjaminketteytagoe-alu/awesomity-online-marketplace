package com.marketplace.payment.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Polymorphic payment request. Jackson discriminates on the "method" field.
 *
 * CARD request:
 *   { "method": "CARD", "card": { "number": "...", "expiry": "MM/YY", "cvv": "123", "holderName": "..." } }
 *
 * MOBILE_MONEY request:
 *   { "method": "MOBILE_MONEY", "mobileMoney": { "phone": "+250...", "provider": "MTN" } }
 */
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "method",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = PayOrderRequest.Card.class, name = "CARD"),
        @JsonSubTypes.Type(value = PayOrderRequest.MobileMoney.class, name = "MOBILE_MONEY")
})
public sealed interface PayOrderRequest
        permits PayOrderRequest.Card, PayOrderRequest.MobileMoney {

    String method();

    record Card(
            @NotBlank String method,
            @NotNull @Valid CardDetails card
    ) implements PayOrderRequest {}

    record MobileMoney(
            @NotBlank String method,
            @NotNull @Valid MobileMoneyDetails mobileMoney
    ) implements PayOrderRequest {}

    record CardDetails(
            @NotBlank(message = "Card number is required")
            @Pattern(regexp = "^[0-9 ]{12,19}$", message = "Card number must be 12-19 digits")
            String number,

            @NotBlank(message = "Expiry is required (MM/YY)")
            @Pattern(regexp = "^(0[1-9]|1[0-2])/[0-9]{2}$", message = "Expiry must be MM/YY")
            String expiry,

            @NotBlank(message = "CVV is required")
            @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV must be 3 or 4 digits")
            String cvv,

            @NotBlank(message = "Cardholder name is required")
            @Size(min = 2, max = 100)
            String holderName
    ) {}

    record MobileMoneyDetails(
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Phone must be 9-15 digits, optional +")
            String phone,

            @NotBlank(message = "Provider is required")
            @Pattern(regexp = "^(MTN|AIRTEL)$", message = "Provider must be MTN or AIRTEL")
            String provider
    ) {}
}
