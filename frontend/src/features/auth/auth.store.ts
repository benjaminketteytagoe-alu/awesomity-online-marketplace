import { create } from 'zustand';
import { tokenStorage } from '@/lib/storage';
import type { User, UserRole } from './auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
  hasRole: (role: UserRole) => boolean;
}

/**
 * Minimal auth store — the source of truth for "who is logged in".
 *
 * Persistence: tokens live in localStorage. The user object is
 * re-fetched from /api/auth/me on app boot (see router.tsx) so that
 * a role change or suspension on the backend takes effect on next load.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  setSession: (user, accessToken, refreshToken) => {
    tokenStorage.set(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clear: () => {
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  hasRole: (role) => {
    const current = get().user?.role;
    return current === role;
  },
}));
