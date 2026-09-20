import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { profileApi } from './profile.api';
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from './profile.types';

/**
 * Profile query keys. The profile is a singleton per authenticated
 * user, so there's only one key.
 */
export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

export function useProfile(): UseQueryResult<UserProfile> {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.get(),
    staleTime: 60_000,
  });
}

/**
 * Update name.
 *
 * On success, invalidates the profile query AND the auth store's
 * `me` query if we add one. Currently the header shows the user's
 * name from the Zustand store, which was hydrated at login. After a
 * name change, we need to refresh that too — but Zustand isn't part
 * of TanStack Query's cache.
 *
 * Solution: the caller (ProfilePage) calls `useAuthStore.setUser()`
 * with the updated profile on mutation success. That keeps both
 * sources in sync.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: (payload) => profileApi.updateName(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKeys.me(), updated);
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: (payload) => profileApi.changePassword(payload),
  });
}
