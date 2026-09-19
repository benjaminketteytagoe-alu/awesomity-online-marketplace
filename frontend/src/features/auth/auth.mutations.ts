import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from './auth.api';
import { useAuthStore } from './auth.store';
import { safeInternalPath } from '@/lib/navigation';
import type { LoginRequest, RegisterRequest } from './auth.types';

/**
 * Login mutation.
 *
 * Why a custom hook rather than calling useMutation inline in the page:
 *   The success side effects (store session, show toast, navigate to `from`)
 *   are identical everywhere we log in. Extracting them means LoginPage
 *   becomes declarative: "when this form submits, call login()".
 *
 * SECURITY: the return-to path is validated with safeInternalPath() before
 * being handed to navigate(). This closes CVE-2026-53669 (open redirect via
 * backslashes) through the `state.from` mechanism that RequireAuth sets.
 */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),

    onSuccess: (data) => {
      // NOTE argument order: setSession(user, accessToken, refreshToken).
      // Must match auth.store.ts exactly or the tokens get swapped silently.
      setSession(data.user, data.accessToken, data.refreshToken);

      // Where to send them? If RequireAuth bounced them from /orders/new,
      // location.state.from = '/orders/new'. Otherwise home.
      // safeInternalPath returns '/' for anything that isn't a clean
      // internal path — including undefined, null, and malicious input.
      const from = safeInternalPath(
        (location.state as { from?: string } | null)?.from,
      );
      navigate(from, { replace: true });

      toast.success(`Welcome back, ${data.user.name}`);
    },
    // No onError toast here — LoginPage renders the error inline. Toasting
    // an error that's already visible is duplicate UI.
  });
}

/**
 * Register mutation.
 *
 * No onSuccess side effect — the page transitions to a "check your inbox"
 * state instead of navigating. We don't auto-login because the backend
 * requires email verification before login; auto-login would 403.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
  });
}

/**
 * Verify-email mutation. Fired automatically on mount of VerifyEmailPage.
 * The page handles success/error rendering; we don't toast here so the
 * full-page status UI isn't fighting a toast notification.
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verify(token),
  });
}
