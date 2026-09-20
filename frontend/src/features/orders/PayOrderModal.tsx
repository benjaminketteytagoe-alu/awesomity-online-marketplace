import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { CardForm } from '@/features/checkout/CardForm';
import { MobileMoneyForm } from '@/features/checkout/MobileMoneyForm';
import {
  checkoutSchema,
  type CheckoutFormValues,
} from '@/features/checkout/checkout.schemas';
import { usePayOrder } from './order.queries';
import { pollUntilPaid } from './pollOrderStatus';
import type { PayOrderRequest } from './order.types';

type PaymentTab = 'CARD' | 'MOBILE_MONEY';

interface PayOrderModalProps {
  orderId: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for paying a PENDING order from the detail page.
 *
 * Reuses CardForm and MobileMoneyForm from the checkout feature —
 * same validation, same look, different container. That's the payoff
 * of extracting those components in D.1.
 *
 * Flow:
 *   1. Submit → POST /orders/{id}/pay
 *   2. If payment FAILED, show error inline and stay open
 *   3. If SUCCESS, poll for PAID (async consumer updates status)
 *   4. On confirmation (or timeout), close modal and call onSuccess
 *      so the parent refetches the order
 */
export function PayOrderModal({
  orderId,
  totalAmount,
  isOpen,
  onClose,
  onSuccess,
}: PayOrderModalProps) {
  const [tab, setTab] = useState<PaymentTab>('CARD');
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const payOrder = usePayOrder();
  const inFlightRef = useRef(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      method: 'CARD',
      card: { number: '', expiry: '', cvv: '', holderName: '' },
    } as CheckoutFormValues,
  });

  // Sync the discriminator with the active tab.
  useEffect(() => {
    form.setValue('method', tab);
    form.clearErrors();
  }, [tab, form]);

  // Escape closes, unless we're mid-submission.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConfirming) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isConfirming, onClose]);

  // Body scroll lock.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    try {
      const payment = await payOrder.mutateAsync({
        orderId,
        payload: values as PayOrderRequest,
      });

      if (payment.status === 'FAILED') {
        setError(payment.message || 'Payment was declined. Please try again.');
        return;
      }

      // Payment accepted — wait for the async PAID transition.
      setIsConfirming(true);
      const confirmed = await pollUntilPaid(orderId, 8000);
      setIsConfirming(false);

      if (confirmed && confirmed.status === 'PAID') {
        toast.success('Payment confirmed');
      } else {
        toast.message('Payment received', {
          description:
            'Confirmation is taking longer than usual. Refresh in a moment.',
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      inFlightRef.current = false;
    }
  });

  const isBusy = payOrder.isPending || isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={() => !isBusy && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2
              id="pay-modal-title"
              className="font-display text-lg font-medium tracking-tight"
            >
              Complete payment
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Order total: £{totalAmount.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="p-5">
          {isConfirming ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="font-display text-base font-medium">
                Confirming your payment…
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                This usually takes a few seconds.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {/* Tab switcher */}
              <div
                role="tablist"
                aria-label="Payment method"
                className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'CARD'}
                  onClick={() => setTab('CARD')}
                  disabled={isBusy}
                  className={cn(
                    'flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
                    tab === 'CARD'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'MOBILE_MONEY'}
                  onClick={() => setTab('MOBILE_MONEY')}
                  disabled={isBusy}
                  className={cn(
                    'flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
                    tab === 'MOBILE_MONEY'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile money
                </button>
              </div>

              {tab === 'CARD' ? (
                <CardForm form={form} />
              ) : (
                <MobileMoneyForm form={form} />
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={onClose}
                  disabled={isBusy}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  isLoading={payOrder.isPending}
                  disabled={isBusy}
                  className="flex-[2]"
                >
                  {payOrder.isPending ? 'Processing…' : 'Pay now'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
