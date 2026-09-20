import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * TanStack Query defaults.
 *
 * - staleTime 30s: won't refetch on every navigation within 30s.
 * - retry: don't retry 4xx (client errors); do retry 5xx up to 2 times.
 * - refetchOnWindowFocus: off. We control refresh manually on mutations.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
