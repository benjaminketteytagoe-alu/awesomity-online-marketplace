import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { categoryApi } from './category.api';
import type { Category } from './category.types';

/**
 * Query keys for categories. Same factory pattern as products, so
 * invalidations are reliable and grep-able.
 *
 *   ['categories', 'list']  — the whole list
 *   ['categories', 'detail', id]  — reserved for a single-category
 *     fetch, added when we need it
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/**
 * Fetch all categories.
 *
 * Stale time is generous (30 minutes) because categories change rarely.
 * In a real marketplace, categories are managed by admins and edited
 * a handful of times per year. Caching them for the session is correct.
 *
 * Invalidations from admin mutations (Step 14.8) will refresh this
 * when an admin adds or edits a category. Until then, the cache is
 * effectively permanent for a session.
 */
export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoryApi.list(),
    staleTime: 30 * 60_000, // 30 minutes
  });
}
