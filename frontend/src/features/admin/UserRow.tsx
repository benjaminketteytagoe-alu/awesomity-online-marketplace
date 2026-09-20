import { Mail, Store as StoreIcon, BadgeCheck, UserCog, ShieldOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { canActivateUser, canChangeRole, canSuspendUser } from './adminRules';
import type { AdminUserSummary, AdminUserDetail } from './admin.types';

interface UserRowProps {
  /** Detail row when we have it; summary otherwise. Detail includes store info. */
  user: AdminUserSummary | AdminUserDetail;
  /** Current admin's ID — used for the self-suspend rule. */
  currentAdminId: string;
  onChangeRole: () => void;
  onChangeStatus: () => void;
}

/**
 * One user rendered as a card.
 *
 * Actions are gated by the rules in adminRules.ts. Disabled buttons
 * carry the rule's reason as a `title` (browser tooltip) so the admin
 * understands why an action is unavailable rather than assuming a bug.
 */
export function UserRow({
  user,
  currentAdminId,
  onChangeRole,
  onChangeStatus,
}: UserRowProps) {
  const initials = getInitials(user.name);
  const isSelf = user.id === currentAdminId;

  // Cast the summary to a detail-shaped object for the rules. Rules
  // only care about id, status, and storeId — all present on both
  // shapes when this component is used correctly. The detail-only
  // fields default to null for summary rows.
  const forRules: AdminUserDetail = {
    ...user,
    updatedAt:
      'updatedAt' in user ? user.updatedAt : user.createdAt,
    storeId: 'storeId' in user ? user.storeId : null,
    storeName: 'storeName' in user ? user.storeName : null,
  };

  const changeRoleRule = canChangeRole(forRules);
  const suspendRule = canSuspendUser(forRules, currentAdminId);
  const activateRule = canActivateUser(forRules, currentAdminId);

  const isSuspended = user.status === 'SUSPENDED';

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
      {/* Avatar */}
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700">
        <span className="font-display text-sm font-medium text-slate-50">
          {initials}
        </span>
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-base font-medium">
            {user.name}
          </h3>
          {isSelf && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              You
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {user.email}
          </span>
          {user.emailVerifiedAt ? (
            <span
              className="inline-flex items-center gap-1 text-success"
              title="Email verified"
            >
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warning">
              Unverified
            </span>
          )}
        </div>
        {'storeName' in forRules && forRules.storeName && (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <StoreIcon className="h-3 w-3" />
            <span className="truncate">{forRules.storeName}</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <UserRoleBadge role={user.role} />
        <UserStatusBadge status={user.status} />
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Change role */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onChangeRole}
          disabled={!changeRoleRule.allowed}
          title={changeRoleRule.allowed ? 'Change role' : changeRoleRule.reason}
        >
          <UserCog className="h-3.5 w-3.5" />
          Role
        </Button>

        {/* Suspend or activate */}
        {isSuspended ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeStatus}
            disabled={!activateRule.allowed}
            title={
              activateRule.allowed ? 'Reactivate account' : activateRule.reason
            }
            className="text-success hover:bg-success/10 hover:text-success"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Activate
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeStatus}
            disabled={!suspendRule.allowed}
            title={
              suspendRule.allowed ? 'Suspend account' : suspendRule.reason
            }
            className={cn(
              'text-destructive hover:bg-destructive/10 hover:text-destructive',
              !suspendRule.allowed &&
                'disabled:text-muted-foreground disabled:hover:bg-transparent',
            )}
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Suspend
          </Button>
        )}
      </div>
    </article>
  );
}

/* ---------------- helpers ---------------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const [first, second] = parts;
  if (!first) return '?';
  if (!second) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}
