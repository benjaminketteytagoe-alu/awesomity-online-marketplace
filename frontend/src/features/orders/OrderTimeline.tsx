import { Check, Circle, Dot, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusSteps, type TimelineStep } from './order.timeline';
import type { OrderStatus } from './order.types';

interface OrderTimelineProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Vertical status timeline.
 *
 * Renders one row per step in the progression. Completed steps have a
 * filled check, the current step has a solid dot with a ring, and
 * upcoming steps have a hollow circle. A vertical connector line
 * runs between rows.
 *
 * Accessibility:
 *   - The whole component is a <ol> with role="list" so screen readers
 *     announce it as an ordered sequence.
 *   - Each step's state is conveyed via aria-label, not just color.
 *     "Delivered, upcoming" is read; the visual is decorative.
 */
export function OrderTimeline({ status, className }: OrderTimelineProps) {
  const steps = statusSteps(status);

  return (
    <ol
      role="list"
      className={cn('flex flex-col', className)}
      aria-label="Order progress"
    >
      {steps.map((step, i) => (
        <TimelineRow
          key={`${step.status}-${i}`}
          step={step}
          isLast={i === steps.length - 1}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  step,
  isLast,
}: {
  step: TimelineStep;
  isLast: boolean;
}) {
  const { state, label, status } = step;
  const isCancelled = status === 'CANCELLED';

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* Icon column */}
      <div className="relative flex flex-col items-center">
        <StepIcon state={state} isCancelled={isCancelled} />

        {/* Connector line to the next row — not rendered on the last row */}
        {!isLast && (
          <div
            aria-hidden="true"
            className={cn(
              'mt-1 w-px flex-1',
              state === 'done' ? 'bg-success/40' : 'bg-border',
            )}
          />
        )}
      </div>

      {/* Text column */}
      <div className="pb-1 pt-0.5">
        <p
          className={cn(
            'text-sm font-medium',
            state === 'upcoming' && 'text-muted-foreground',
            state === 'current' && 'text-foreground',
            state === 'done' && 'text-foreground',
            isCancelled && state === 'current' && 'text-destructive',
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {describeState(state, isCancelled)}
        </p>
      </div>
    </li>
  );
}

function StepIcon({
  state,
  isCancelled,
}: {
  state: TimelineStep['state'];
  isCancelled: boolean;
}) {
  if (isCancelled && state === 'current') {
    return (
      <div className="grid h-6 w-6 place-items-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (state === 'done') {
    return (
      <div className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (state === 'current') {
    return (
      <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/15">
        <Dot className="h-4 w-4" strokeWidth={4} />
      </div>
    );
  }
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-muted-foreground">
      <Circle className="h-2.5 w-2.5" strokeWidth={2} />
    </div>
  );
}

function describeState(
  state: TimelineStep['state'],
  isCancelled: boolean,
): string {
  if (isCancelled && state === 'current') return 'This order was cancelled';
  if (state === 'done') return 'Completed';
  if (state === 'current') return 'Current status';
  return 'Not yet reached';
}
