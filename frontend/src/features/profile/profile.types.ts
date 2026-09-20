/**
 * Profile types.
 *
 * Derived from backend DTOs:
 *   UserProfileResponse  — GET /api/users/me
 *   UpdateProfileRequest — PATCH /api/users/me
 *   ChangePasswordRequest — POST /api/users/me/change-password
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SHOPPER' | 'SELLER';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
