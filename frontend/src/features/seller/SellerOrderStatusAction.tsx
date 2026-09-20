import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useUpdateOrderStatus } from './seller.queries';
import { actionLabelFor, nextSellerStatus } from './orderTransitions';
import type { OrderStatus } from './seller.types';

interface SellerOrderStatusActionProps {
  orderId: string;
  currentStatus: OrderStatus;
}

/**
 * The primary action button for a seller on an order.
 *
 * Reads the current status, computes the only valid next step (or
 * null if terminal), and offers a single button to advance.
 *
 * Why we don't offer a dropdown of statuses: the state machine only
 * permits one next step. A dropdown would present options the user
 * cannot pick. One button, labeled with the specific action, is
 * clearer and prevents invalid-transition errors entirely.
 *
 * On success, useUpdateOrderStatus's onSuccess invalidates both
 * seller-scoped and buyer-scoped order queries — so if the shopper
 * has the order detail open in another tab, their timeline advances.
 */
export function SellerOrderStatusAction({
  orderId,
  currentStatus,
}: SellerOrderStatusActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const mutation = useUpdateOrderStatus();

  const next = nextSellerStatus(currentStatus);

  // No valid transition — render nothing. This is the case for
  // PENDING (shopper hasn't paid), DELIVERED (terminal), and
  // CANCELLED (terminal).
  if (!next) return null;

  const handleClick = async () => {
    setIsConfirming(true);
    try {
      await mutation.mutateAsync({
        id: orderId,
        payload: { status: next as 'PROCESSING' | 'SHIPPED' | 'DELIVERED' },
      });
      toast.success(`Order marked as ${next.toLowerCase()}`);
    } catch (err) {
      toast.error(toErrorMessage(err));
    } finally {
      setIsConfirming(false);
    }
  };

  const isBusy = mutation.isPending || isConfirming;

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      disabled={isBusy}
      className="w-full"
    >
      {isBusy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating…
        </>
      ) : (
        <>
          {actionLabelFor(next)}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
