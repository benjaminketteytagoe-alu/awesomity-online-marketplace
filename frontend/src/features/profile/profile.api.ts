import { api } from '@/lib/api/client';
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from './profile.types';

/**
 * Self-service profile API client.
 *
 * All endpoints are scoped to the authenticated user via the JWT —
 * the backend takes the user id from the AuthPrincipal, never from
 * the request.
 */
export const profileApi = {
  async get(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/api/users/me');
    return data;
  },

  async updateName(payload: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await api.patch<UserProfile>('/api/users/me', payload);
    return data;
  },

  /**
   * Change password. Returns 204 No Content on success. The frontend
   * logs the user out afterwards — a password change doesn't
   * invalidate existing JWTs, so we force a re-login to ensure the
   * old session can't be resumed.
   */
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await api.post('/api/users/me/change-password', payload);
  },
};
