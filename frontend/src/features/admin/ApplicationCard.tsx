import { CheckCircle2, XCircle, Clock, Mail, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SellerApplicationSummary, ApplicationStatus } from './admin.types';

interface ApplicationCardProps {
  application: SellerApplicationSummary;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * One seller application, rendered as a card.
 *
 * Cards over tables because applications have varied content: some
 * include a description, some don't. Cards adapt; tables need
 * uniform field shapes.
 *
 * The action buttons are only rendered for PENDING applications.
 * Terminal states (APPROVED, REJECTED) show their outcome inline.
 */
export function ApplicationCard({
  application,
  onApprove,
  onReject,
}: ApplicationCardProps) {
  const isPending = application.status === 'PENDING';

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      {/* Header: shop name + status badge */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-medium tracking-tight">
            {application.shopName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Application #{application.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </header>

      {/* Applicant details */}
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <dt className="sr-only">Applicant name</dt>
          <dd className="truncate text-foreground">{application.name}</dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <dt className="sr-only">Email</dt>
          <dd className="truncate text-foreground">{application.email}</dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <dt className="sr-only">Submitted</dt>
          <dd>{formatDate(application.createdAt)}</dd>
        </div>
      </dl>

      {/* Description */}
      {application.description && (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {application.description}
        </p>
      )}

      {/* Outcome line for terminal states */}
      {application.status === 'APPROVED' && application.reviewedAt && (
        <p className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs text-success">
          Approved {formatDate(application.reviewedAt)}. An invite email has
          been sent to {application.email}.
        </p>
      )}
      {application.status === 'REJECTED' && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs">
          <p className="font-medium text-destructive">
            Rejected
            {application.reviewedAt
              ? ` ${formatDate(application.reviewedAt)}`
              : ''}
          </p>
          {application.rejectionReason && (
            <p className="mt-1 text-destructive/90">
              {application.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Actions — only for PENDING */}
      {isPending && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" onClick={onApprove}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}

/* ---------------- Sub-components ---------------- */

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    PENDING: 'bg-warning/10 text-warning',
    APPROVED: 'bg-success/10 text-success',
    REJECTED: 'bg-destructive/10 text-destructive',
  };
  const labels: Record<ApplicationStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };
  const Icons: Record<ApplicationStatus, React.ReactNode> = {
    PENDING: <Clock className="h-3 w-3" />,
    APPROVED: <CheckCircle2 className="h-3 w-3" />,
    REJECTED: <XCircle className="h-3 w-3" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        styles[status],
      )}
    >
      {Icons[status]}
      {labels[status]}
    </span>
  );
}

/* ---------------- helpers ---------------- */

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
