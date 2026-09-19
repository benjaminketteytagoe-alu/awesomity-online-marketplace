import { useEffect, useState } from 'react';
import { authApi } from './auth.api';
import { useAuthStore } from './auth.store';
import { tokenStorage } from '@/lib/storage';

/**
 * App-boot session hydration.
 *
 * Why we don't persist the user to localStorage:
 *   If an admin demotes a SELLER to SHOPPER or suspends them, the
 *   localStorage copy of `user` would still say SELLER/ACTIVE until
 *   something else triggers a refresh. Fetching /me on every app load
 *   means the frontend always reflects server truth within one page load.
 *   Cost: one request per page load, only when a token exists.
 *
 * Returns `isReady` — callers should render nothing (or a splash) until
 * ready is true, so route guards don't misfire on the first render when
 * the store hasn't been hydrated yet.
 */
export function useSessionBootstrap(): boolean {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccess();

    // No token → nothing to hydrate. App is immediately ready.
    if (!token) {
      setIsReady(true);
      return;
    }

    let cancelled = false;

    authApi
      .me()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        // /me failed — token invalid/expired. The axios interceptor already
        // tried a refresh before giving up; if we get here, both failed.
        if (!cancelled) clear();
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    // Cleanup: if the component unmounts mid-request (rare here, but
    // good hygiene), don't set state on an unmounted tree.
    return () => {
      cancelled = true;
    };
  }, [setUser, clear]);

  return isReady;
}
