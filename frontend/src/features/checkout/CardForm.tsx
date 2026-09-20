import { type UseFormReturn } from 'react-hook-form';
import { CreditCard, Lightbulb } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import type { CheckoutFormValues } from './checkout.schemas';

interface CardFormProps {
  // The parent form is a discriminated union; this subcomponent only
  // cares about the card branch. We accept the parent's form object
  // and use `register('card.number')` — RHF resolves the nested path.
  form: UseFormReturn<CheckoutFormValues>;
}

/**
 * Card payment fields.
 *
 * Design:
 *   - Card number input is wide (full row). We don't auto-format the
 *     value with spaces because that fights with react-hook-form's
 *     controlled value. Users can type spaces or not — the backend
 *     strips them.
 *   - Expiry + CVV sit on the same row (short inputs).
 *   - Holder name is full width.
 *   - A small hint block explains the mock PSP behavior so testers
 *     know how to exercise both success and failure paths.
 */
export function CardForm({ form }: CardFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  // RHF types nested errors as a tree; TS can't statically know the
  // 'card' branch is active, so we narrow manually.
  const cardErrors = 'card' in errors ? errors.card : undefined;

  return (
    <div className="space-y-4">
      <Field
        label="Card number"
        error={cardErrors?.number?.message}
        required
      >
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          {...register('card.number')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry" error={cardErrors?.expiry?.message} required>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            maxLength={5}
            {...register('card.expiry')}
          />
        </Field>

        <Field label="CVV" error={cardErrors?.cvv?.message} required>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            {...register('card.cvv')}
          />
        </Field>
      </div>

      <Field
        label="Cardholder name"
        error={cardErrors?.holderName?.message}
        required
      >
        <Input
          type="text"
          autoComplete="cc-name"
          placeholder="As it appears on the card"
          {...register('card.holderName')}
        />
      </Field>

      {/* Test hints — this is a mock PSP. Documenting the rules inline
          makes it obvious how to try both success and failure paths. */}
      <div className="flex gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 text-xs">
        <Lightbulb className="h-4 w-4 shrink-0 text-brand" />
        <div className="space-y-1 text-brand-foreground/90">
          <p className="font-medium">Test cards</p>
          <p>
            <span className="font-mono">4242 4242 4242 4242</span> — succeeds
            (use any future expiry, e.g. 12/28, and any 3-digit CVV)
          </p>
          <p>
            Any card ending in <span className="font-mono">0000</span> — will
            be declined, useful for testing the failure state
          </p>
        </div>
      </div>

      {/* Card icon watermark for visual weight — placed last so it
          doesn't interfere with keyboard navigation order. */}
      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5" />
        <span>Card details are processed by a mock PSP.</span>
      </div>
    </div>
  );
}
