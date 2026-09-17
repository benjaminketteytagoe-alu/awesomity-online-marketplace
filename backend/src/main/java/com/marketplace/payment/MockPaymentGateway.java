package com.marketplace.payment;

import com.marketplace.payment.dto.PayOrderRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Deterministic mock payment processor for card and mobile money.
 *
 * Rules are intentionally simple and testable:
 *   CARD:          Luhn-valid, unexpired, CVV present.
 *                  Numbers ending in "0000" ALWAYS decline (test hook).
 *   MOBILE_MONEY:  Phone matches regex; provider in allowlist.
 *                  Phones ending in "0000" ALWAYS decline.
 */
@Slf4j
@Component
public class MockPaymentGateway {

    public record Result(boolean success, String reference, String failureReason) {}

    public Result charge(PayOrderRequest request) {
        if (request instanceof PayOrderRequest.Card card) {
            return chargeCard(card.card());
        }
        if (request instanceof PayOrderRequest.MobileMoney mm) {
            return chargeMobileMoney(mm.mobileMoney());
        }
        return new Result(false, null, "Unknown payment method");
    }

    private Result chargeCard(PayOrderRequest.CardDetails card) {
        String number = card.number().replaceAll("\\s", "");

        if (number.endsWith("0000")) {
            log.info("Mock PSP: card declined (test trigger)");
            return new Result(false, null, "Card declined by issuer");
        }

        if (!luhn(number)) {
            return new Result(false, null, "Invalid card number");
        }

        if (isExpired(card.expiry())) {
            return new Result(false, null, "Card has expired");
        }

        String reference = "CARD-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        log.info("Mock PSP: card charge successful ref={}", reference);
        return new Result(true, reference, null);
    }

    private Result chargeMobileMoney(PayOrderRequest.MobileMoneyDetails mm) {
        String phone = mm.phone().replaceAll("[^0-9]", "");

        if (phone.endsWith("0000")) {
            log.info("Mock PSP: mobile money declined (test trigger)");
            return new Result(false, null, "Mobile money provider rejected the transaction");
        }

        String reference = "MM-" + mm.provider() + "-"
                + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        log.info("Mock PSP: mobile money charge successful ref={}", reference);
        return new Result(true, reference, null);
    }

    // ---- helpers ----

    /** Standard Luhn checksum used by real card networks. */
    private boolean luhn(String number) {
        int sum = 0;
        boolean alternate = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int n = number.charAt(i) - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    private boolean isExpired(String expiry) {
        try {
            YearMonth cardExpiry = YearMonth.parse(
                    expiry, DateTimeFormatter.ofPattern("MM/yy"));
            return cardExpiry.isBefore(YearMonth.now());
        } catch (Exception e) {
            return true;
        }
    }
}
