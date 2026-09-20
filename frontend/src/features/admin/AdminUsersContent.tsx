import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';
import { useAdminUsers } from './admin.queries';
import { UserRow } from './UserRow';
import { ChangeRoleModal } from './ChangeRoleModal';
import { ChangeStatusModal } from './ChangeStatusModal';
import { toErrorMessage } from '@/lib/api/client';
import type { AdminUserSummary } from './admin.types';

type RoleTab = 'ALL' | 'ADMIN' | 'SELLER' | 'SHOPPER';
type StatusTab = '' | 'ACTIVE' | 'SUSPENDED';

const PAGE_SIZE = 20;

const ROLE_TABS: Array<{ key: RoleTab; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ADMIN', label: 'Admins' },
  { key: 'SELLER', label: 'Sellers' },
  { key: 'SHOPPER', label: 'Shoppers' },
];

/**
 * Admin users management.
 *
 * Filters:
 *   - role: tabs (primary filter; URL `?role=`)
 *   - status: dropdown (secondary filter; URL `?status=`)
 *
 * Both filter values are sent to the backend as query params — the
 * AdminUserController accepts both.
 *
 * Rules from adminRules.ts gate the actions in UserRow. The current
 * admin's ID comes from useAuthStore and is passed down so the
 * self-suspend rule works.
 */
export function AdminUsersContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [changingRole, setChangingRole] = useState<AdminUserSummary | null>(null);
  const [changingStatus, setChangingStatus] =
    useState<AdminUserSummary | null>(null);

  // Current admin — for the self-suspend rule
  const currentAdminId = useAuthStore((s) => s.user?.id ?? '');

  const roleParam = (searchParams.get('role') as RoleTab | null) ?? 'ALL';
  const statusParam = (searchParams.get('status') as StatusTab | null) ?? '';
  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);

  const query = useAdminUsers({
    role: roleParam === 'ALL' ? undefined : roleParam,
    status: statusParam || undefined,
    page: apiPage,
    size: PAGE_SIZE,
  });

  const setRoleTab = (tab: RoleTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'ALL') next.delete('role');
    else next.set('role', tab);
    next.delete('page');
    setSearchParams(next);
  };

  const setStatusFilter = (status: StatusTab) => {
    const next = new URLSearchParams(searchParams);
    if (!status) next.delete('status');
    else next.set('status', status);
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next === 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Role tabs */}
      <nav
        aria-label="Filter by role"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setRoleTab(tab.key)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px',
              roleParam === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Status dropdown */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="status-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Status:
        </label>
        <select
          id="status-filter"
          value={statusParam}
          onChange={(e) => setStatusFilter(e.target.value as StatusTab)}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading users">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/50"
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
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">
            No users match this filter
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different role or status filter.
          </p>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && query.data.content.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {query.data.totalElements.toLocaleString()}{' '}
            {query.data.totalElements === 1 ? 'user' : 'users'}
          </p>

          <ul className="space-y-3">
            {query.data.content.map((user) => (
              <li key={user.id}>
                <UserRow
                  user={user}
                  currentAdminId={currentAdminId}
                  onChangeRole={() => setChangingRole(user)}
                  onChangeStatus={() => setChangingStatus(user)}
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
      <ChangeRoleModal
        isOpen={changingRole !== null}
        onClose={() => setChangingRole(null)}
        user={changingRole}
      />
      <ChangeStatusModal
        isOpen={changingStatus !== null}
        onClose={() => setChangingStatus(null)}
        user={changingStatus}
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
