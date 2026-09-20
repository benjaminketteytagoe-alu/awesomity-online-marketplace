/**
 * Token storage in localStorage.
 *
 * Tradeoff documented: localStorage is readable by JS, so an XSS
 * vulnerability would expose tokens. The alternative (httpOnly cookies)
 * requires backend changes (Set-Cookie, CSRF) that are out of scope.
 * We mitigate XSS by never using dangerouslySetInnerHTML and keeping
 * user-generated content sanitized.
 */
const ACCESS_KEY = 'marketplace.accessToken';
const REFRESH_KEY = 'marketplace.refreshToken';

export const tokenStorage = {
  getAccess(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },

  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  set(access: string, refresh: string): void {
    try {
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    } catch {
      /* storage may be disabled; fail silently */
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
};
