import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/features/cart/cart.store';
import { CardForm } from '@/features/checkout/CardForm';
import { MobileMoneyForm } from '@/features/checkout/MobileMoneyForm';
import { OrderSummaryCard } from '@/features/checkout/OrderSummaryCard';
import { useCheckoutFlow } from '@/features/checkout/useCheckoutFlow';
import {
  checkoutSchema,
  type CheckoutFormValues,
} from '@/features/checkout/checkout.schemas';
import type { PayOrderRequest } from '@/features/orders/order.types';

type PaymentTab = 'CARD' | 'MOBILE_MONEY';

/**
 * The checkout page.
 *
 * Composition:
 *   - Left column: payment method tabs + the active subform + submit button
 *   - Right column: persistent order summary
 *
 * Guarded by RequireAuth (see router). Additionally, if the cart is
 * empty we redirect to /products — with one exception, see below.
 */
export function CheckoutPage() {
  const [tab, setTab] = useState<PaymentTab>('CARD');
  const items = useCartStore((s) => s.items);
  const flow = useCheckoutFlow();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      method: 'CARD',
      card: {
        number: '',
        expiry: '',
        cvv: '',
        holderName: '',
      },
    } as CheckoutFormValues,
  });

  // Keep the form's discriminator in sync with the active tab. RHF
  // can't know that switching tabs should change validation rules;
  // we drive it from the tab state.
  useEffect(() => {
    form.setValue('method', tab);
    // Clear errors from the inactive branch so they don't leak into
    // the UI when the user switches back and forth.
    form.clearErrors();
  }, [tab, form]);

  // ---------- Empty cart guard ----------
  // Redirect only when the flow is idle. During submission the cart
  // may briefly empty (after clearing on success) but we don't want to
  // bounce the user mid-redirect to /orders/{id}.
  if (items.length === 0 && flow.state === 'idle' && !flow.error) {
    return <Navigate to="/products" replace />;
  }

  const onSubmit = form.handleSubmit((values) => {
    // The discriminated union schema guarantees `values` has the
    // right shape for its `method`. Cast is safe; type it explicitly
    // so a future change to the schema is caught.
    const payload = values as PayOrderRequest;
    void flow.submit(items, payload);
  });

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete payment to confirm your order.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* ---------- Left column: payment ---------- */}
        <section className="flex flex-col gap-6">
          {/* Payment method tabs */}
          <div
            role="tablist"
            aria-label="Payment method"
            className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-1"
          >
            <TabButton
              isActive={tab === 'CARD'}
              onClick={() => setTab('CARD')}
              disabled={flow.isSubmitting}
              icon={<CreditCard className="h-4 w-4" />}
            >
              Card
            </TabButton>
            <TabButton
              isActive={tab === 'MOBILE_MONEY'}
              onClick={() => setTab('MOBILE_MONEY')}
              disabled={flow.isSubmitting}
              icon={<Smartphone className="h-4 w-4" />}
            >
              Mobile money
            </TabButton>
          </div>

          {/* Subform */}
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
            {/* When we switch tabs mid-form, RHF keeps the previously
                entered values for the other branch. That's fine — we
                only validate the active branch (via the discriminator). */}
            {tab === 'CARD' ? (
              <CardForm form={form} />
            ) : (
              <MobileMoneyForm form={form} />
            )}

            {/* Flow error — shown below the form, above the button */}
            {flow.error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {flow.error}
              </div>
            )}

            {/* Confirming state — replaces the button with a status block */}
            {flow.state === 'confirming' ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <div className="text-sm">
                  <p className="font-medium">Confirming your order…</p>
                  <p className="text-xs text-muted-foreground">
                    This usually takes a few seconds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <Link
                  to="/products"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Continue shopping
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  isLoading={flow.isSubmitting}
                  disabled={flow.isSubmitting}
                >
                  {flow.submitLabel}
                </Button>
              </div>
            )}
          </form>
        </section>

        {/* ---------- Right column: summary ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tab button ---------------- */

function TabButton({
  isActive,
  onClick,
  disabled,
  icon,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
