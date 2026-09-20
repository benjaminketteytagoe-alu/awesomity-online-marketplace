import { type UseFormReturn } from 'react-hook-form';
import { Smartphone, Lightbulb } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import type { CheckoutFormValues } from './checkout.schemas';

interface MobileMoneyFormProps {
  form: UseFormReturn<CheckoutFormValues>;
}

/**
 * Mobile money payment fields.
 *
 * Design:
 *   - Phone input accepts an optional leading "+" and 9-15 digits.
 *   - Provider is a radio group styled as segmented buttons. A select
 *     would work too, but with only two options the segmented control
 *     reads better and requires fewer clicks.
 *   - Test hints inline, same as CardForm.
 */
export function MobileMoneyForm({ form }: MobileMoneyFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const mmErrors = 'mobileMoney' in errors ? errors.mobileMoney : undefined;

  return (
    <div className="space-y-4">
      <Field
        label="Phone number"
        error={mmErrors?.phone?.message}
        hint="Include country code if outside your default region."
        required
      >
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+250791234567"
          {...register('mobileMoney.phone')}
        />
      </Field>

      <Field
        label="Provider"
        error={mmErrors?.provider?.message}
        required
      >
        {/* Two-option segmented control. Radios because they're a
            mutually-exclusive choice, styled as buttons for the UI. */}
        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="radio"
              value="MTN"
              {...register('mobileMoney.provider')}
              className="peer sr-only"
            />
            <div className="grid h-10 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              MTN
            </div>
          </label>
          <label className="flex-1">
            <input
              type="radio"
              value="AIRTEL"
              {...register('mobileMoney.provider')}
              className="peer sr-only"
            />
            <div className="grid h-10 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              Airtel
            </div>
          </label>
        </div>
      </Field>

      <div className="flex gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 text-xs">
        <Lightbulb className="h-4 w-4 shrink-0 text-brand" />
        <div className="space-y-1 text-brand-foreground/90">
          <p className="font-medium">Test numbers</p>
          <p>Any 9-15 digit phone number works.</p>
          <p>
            Numbers ending in <span className="font-mono">0000</span> will be
            declined, useful for testing the failure state.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5" />
        <span>Mobile money requests are handled by a mock PSP.</span>
      </div>
    </div>
  );
}
