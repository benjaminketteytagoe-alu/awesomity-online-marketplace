import { z } from 'zod';

/**
 * Checkout form schemas.
 *
 * The payment method is the discriminator. Validation rules are copied
 * verbatim from the backend PayOrderRequest DTO annotations so the
 * frontend rejects the same inputs the backend would.
 *
 * When both validations agree, the user never sees a round-trip
 * validation error for something obvious (like "12/28" for expiry).
 * When they disagree (rare), the backend is authoritative.
 */

/* ===================== Card ===================== */

const cardSchema = z.object({
  method: z.literal('CARD'),
  card: z.object({
    number: z
      .string()
      .min(1, 'Card number is required')
      // Backend: ^[0-9 ]{12,19}$ — digits and spaces, 12-19 chars total
      .regex(/^[0-9 ]{12,19}$/, 'Card number must be 12-19 digits'),
    expiry: z
      .string()
      .min(1, 'Expiry is required')
      // Backend: ^(0[1-9]|1[0-2])/[0-9]{2}$ — MM/YY
      .regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'Use MM/YY format (e.g. 12/28)'),
    cvv: z
      .string()
      .min(1, 'CVV is required')
      .regex(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits'),
    holderName: z
      .string()
      .trim()
      .min(2, 'Cardholder name is required')
      .max(100, 'Cardholder name is too long'),
  }),
});

/* ===================== Mobile money ===================== */

const mobileMoneySchema = z.object({
  method: z.literal('MOBILE_MONEY'),
  mobileMoney: z.object({
    phone: z
      .string()
      .min(1, 'Phone number is required')
      // Backend: ^\+?[0-9]{9,15}$ — optional leading +, 9-15 digits
      .regex(/^\+?[0-9]{9,15}$/, 'Enter 9-15 digits, optional leading +'),
    provider: z.enum(['MTN', 'AIRTEL']),
  }),
});

/* ===================== Combined ===================== */

/**
 * Discriminated union on `method`. RHF + zodResolver can validate
 * either branch; TypeScript narrows the payload correctly on submit.
 */
export const checkoutSchema = z.discriminatedUnion('method', [
  cardSchema,
  mobileMoneySchema,
]);

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type CardFormValues = z.infer<typeof cardSchema>;
export type MobileMoneyFormValues = z.infer<typeof mobileMoneySchema>;
