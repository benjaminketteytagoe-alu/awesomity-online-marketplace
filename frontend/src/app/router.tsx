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
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { MyOrdersPage } from '@/pages/MyOrdersPage';
import { SellerDashboardPage } from '@/pages/SellerDashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';

/**
 * Route table + session bootstrap gate.
 *
 * Layout patterns:
 *   - Public pages are direct children of AppLayout.
 *   - Auth-required pages nest under <RequireAuth>.
 *   - Role-restricted pages nest under <RequireAuth><RequireRole>.
 *
 * Bootstrap gate:
 *   useSessionBootstrap hydrates the auth store from /api/auth/me on
 *   first render when a token exists. We render a splash until that
 *   settles, so route guards never see a "logged out" state for an
 *   actually-logged-in user (which would cause a redirect flicker to
 *   /login on every refresh).
 */
export function AppRoutes() {
  const isReady = useSessionBootstrap();

  if (!isReady) {
    return <AppSplash />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />

        {/* ---------- Authenticated (any role) ---------- */}
        <Route element={<RequireAuth />}>
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<MyOrdersPage />} />
        </Route>

        {/* ---------- Seller-only ---------- */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['SELLER']} />}>
            <Route path="/seller" element={<SellerDashboardPage />} />
            <Route path="/seller/*" element={<SellerDashboardPage />} />
          </Route>
        </Route>

        {/* ---------- Admin-only ---------- */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/*" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        {/* ---------- Legacy redirect ---------- */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* ---------- 404 ---------- */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/**
 * Boot splash. Shown only while /me is in flight on app load (~50ms when
 * a token exists, 0ms otherwise). A centered spinner is the right level
 * of ceremony — less jarring than a login-screen flash, less
 * over-engineered than a full-page skeleton.
 */
function AppSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}
