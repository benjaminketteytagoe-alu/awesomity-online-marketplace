import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth.store';

/**
 * Route guard. If not authenticated, redirect to /login
 * and remember where the user was headed so we can return after login.
 */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
