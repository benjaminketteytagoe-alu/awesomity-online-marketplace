import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import type { UserRole } from './auth.types';
import { safeInternalPath } from '@/lib/navigation';

interface Props {
  /** One or more roles allowed. The user must have at least one. */
  allow: UserRole[];
  /** Where to send users whose role isn't allowed. Defaults to home. */
  redirectTo?: string;
}

/**
 * Role gate. Composes with RequireAuth:
 *   <Route element={<RequireAuth />}>
 *     <Route element={<RequireRole allow={['SELLER']} />}>
 *       <Route path="/seller" element={<SellerDashboard />} />
 *
 * SECURITY: `redirectTo` is passed through safeInternalPath() before being
 * handed to <Navigate>. This prevents CVE-2026-53669 (open redirect via
 * backslashes) even if a caller passes a route parameter through as the
 * redirect target in the future.
 */
export function RequireRole({ allow, redirectTo = '/' }: Props) {
  const role = useAuthStore((s) => s.user?.role);

  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!allow.includes(role)) {
    return <Navigate to={safeInternalPath(redirectTo)} replace />;
  }
  return <Outlet />;
}
