import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireRole } from '@/features/auth/RequireRole';
import { useSessionBootstrap } from '@/features/auth/useSessionBootstrap';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { MyOrdersPage } from '@/pages/MyOrdersPage';
import { SellerDashboardPage } from '@/pages/SellerDashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';

/**
 * Route table + session bootstrap gate.
 *
 * Why gate the whole router on `isReady`:
 *   Without this, a logged-in user refreshing /seller briefly renders
 *   RequireAuth with user=null → redirect to /login → the /me call then
 *   succeeds → user is authenticated but stuck on /login. This race is the
 *   "flicker of unauthorized" bug. Gating until ready eliminates it.
 */
export function AppRoutes() {
  const isReady = useSessionBootstrap();

  if (!isReady) {
    return <AppSplash />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />

        {/* Authenticated (any role) */}
        <Route element={<RequireAuth />}>
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<MyOrdersPage />} />
        </Route>

        {/* Seller-only */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['SELLER']} />}>
            <Route path="/seller" element={<SellerDashboardPage />} />
            <Route path="/seller/*" element={<SellerDashboardPage />} />
          </Route>
        </Route>

        {/* Admin-only */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/*" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        {/* Legacy redirect: /home → / */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/**
 * Boot splash. Shown only while /me is in flight on app load (~50ms when
 * a token exists, 0ms otherwise). A centered spinner is the right level of
 * ceremony — less jarring than a login-screen flash.
 */
function AppSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}
