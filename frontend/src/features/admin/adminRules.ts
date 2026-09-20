import type { AdminUserDetail } from './admin.types';

/**
 * Business rules the admin UI must respect.
 *
 * These mirror the checks in the backend's AdminUserService so the UI
 * never offers an action the server would reject. If the UI and the
 * backend disagree, the user clicks, gets a 4xx, and the experience
 * feels broken. Encoding the rule on the frontend prevents that.
 *
 * The backend remains authoritative. If these predicates ever get out
 * of sync, the user sees an error rather than a security hole.
 */

/**
 * Rule 1: an admin cannot suspend their own account.
 *
 * Backend check (AdminUserService.updateStatus):
 *   if (target.getId().equals(adminId) && next == SUSPENDED)
 *     throw new BadRequestException("SELF_SUSPEND", ...)
 *
 * Why this rule exists: locking yourself out of the admin panel
 * requires another admin to undo, and if there's only one admin you
 * have to touch the database directly. Not a footgun we want in the
 * UI.
 */
export function canSuspendUser(
  target: AdminUserDetail,
  currentAdminId: string,
): { allowed: boolean; reason?: string } {
  if (target.id === currentAdminId) {
    return {
      allowed: false,
      reason: 'You cannot suspend your own account.',
    };
  }
  if (target.status === 'SUSPENDED') {
    return { allowed: false, reason: 'User is already suspended.' };
  }
  return { allowed: true };
}

/**
 * Rule 2: reactivating a suspended user.
 *
 * Backend applies the same self-check only for suspension, not
 * reactivation. So reactivating yourself is technically allowed —
 * though in practice you can't reactivate yourself because you're
 * already active (you're logged in). Still, we don't restrict it.
 */
export function canActivateUser(
  target: AdminUserDetail,
  currentAdminId: string,
): { allowed: boolean; reason?: string } {
  // Unused arg kept in signature for symmetry with canSuspendUser;
  // documents that we considered the case.
  void currentAdminId;
  if (target.status === 'ACTIVE') {
    return { allowed: false, reason: 'User is already active.' };
  }
  return { allowed: true };
}

/**
 * Rule 3: only SELLERs who own a store have their role locked.
 *
 * Backend check (AdminUserService.updateRole):
 *   boolean ownsStore = storeRepository.existsByOwnerId(targetId);
 *   if (ownsStore && next != SELLER)
 *     throw new BadRequestException("HAS_STORE", ...)
 *
 * Reasoning from the backend: changing a seller's role away from
 * SELLER would leave their store ownerless. Admin must delete the
 * store first.
 *
 * This predicate returns whether the role dropdown should be
 * enabled at all for a given user.
 */
export function canChangeRole(target: AdminUserDetail): {
  allowed: boolean;
  reason?: string;
} {
  if (target.storeId !== null) {
    return {
      allowed: false,
      reason:
        'This user owns a store. Delete their store before changing their role.',
    };
  }
  return { allowed: true };
}

/**
 * Rule 4: an admin cannot demote themselves away from ADMIN.
 *
 * The backend doesn't explicitly guard against this (only the
 * self-suspend case is checked), but the same logic applies — the
 * only admin locking themselves out. We enforce it on the frontend
 * as a courtesy.
 *
 * If the backend later changes to allow it, this rule can be
 * relaxed. The point is to prevent an easily-made mistake.
 */
export function canChangeOwnRole(
  target: AdminUserDetail,
  currentAdminId: string,
  newRole: 'ADMIN' | 'SHOPPER' | 'SELLER',
): { allowed: boolean; reason?: string } {
  if (target.id === currentAdminId && newRole !== 'ADMIN') {
    return {
      allowed: false,
      reason:
        'You cannot change your own role away from ADMIN. Ask another admin.',
    };
  }
  return { allowed: true };
}
