import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAdminApplications } from './admin.queries';
import { ApplicationCard } from './ApplicationCard';
import { ApproveApplicationModal } from './ApproveApplicationModal';
import { RejectApplicationModal } from './RejectApplicationModal';
import { toErrorMessage } from '@/lib/api/client';
import type {
  ApplicationStatus,
  SellerApplicationSummary,
} from './admin.types';

type FilterTab = ApplicationStatus | 'ALL';

const PAGE_SIZE = 10;

const TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
];

/**
 * Admin applications review.
 *
 * Tabs filter the list by status — the backend accepts a `status`
 * query param, so filtering is server-side. Default tab is PENDING
 * because that's what the admin needs to act on.
 *
 * Modal state lives here so it survives pagination and re-renders.
 */
export function AdminApplicationsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [approving, setApproving] =
    useState<SellerApplicationSummary | null>(null);
  const [rejecting, setRejecting] =
    useState<SellerApplicationSummary | null>(null);

  const tabParam = searchParams.get('status') as FilterTab | null;
  const activeTab: FilterTab = tabParam ?? 'PENDING';

  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);

  const query = useAdminApplications({
    status: activeTab === 'ALL' ? undefined : activeTab,
    page: apiPage,
    size: PAGE_SIZE,
  });

  const setTab = (tab: FilterTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'PENDING') {
      next.delete('status');
    } else {
      next.set('status', tab);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next === 1) {
      params.delete('page');
    } else {
      params.set('page', String(next));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <nav
        aria-label="Application status"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading applications">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {query.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {toErrorMessage(query.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {query.isSuccess && query.data.content.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">
            {activeTab === 'PENDING'
              ? 'No pending applications'
              : 'No applications'}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {activeTab === 'PENDING'
              ? 'All caught up — nothing needs your review right now.'
              : 'Applications matching this filter will appear here.'}
          </p>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && query.data.content.length > 0 && (
        <>
          <ul className="space-y-3">
            {query.data.content.map((app) => (
              <li key={app.id}>
                <ApplicationCard
                  application={app}
                  onApprove={() => setApproving(app)}
                  onReject={() => setRejecting(app)}
                />
              </li>
            ))}
          </ul>

          {query.data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={query.data.first}
                onClick={() => handlePageChange(urlPage - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {urlPage} of {query.data.totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={query.data.last}
                onClick={() => handlePageChange(urlPage + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ApproveApplicationModal
        isOpen={approving !== null}
        onClose={() => setApproving(null)}
        application={approving}
      />
      <RejectApplicationModal
        isOpen={rejecting !== null}
        onClose={() => setRejecting(null)}
        application={rejecting}
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
