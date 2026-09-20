import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Category } from './category.types';

/**
 * Category API client.
 *
 * Same design principle as productApi: this layer knows nothing about
 * TanStack Query. It returns plain Promises. The query hooks
 * (category.queries.ts) wrap these calls.
 *
 * Note: /api/categories returns a bare array, not Page<T>. That's why
 * this method's return type is Category[], not CategoryPage.
 */
export const categoryApi = {
  /**
   * GET /api/categories
   *
   * No parameters — the endpoint returns all categories in one shot.
   * If the list ever grows beyond a few hundred, we'd add pagination
   * to the backend and this method would take { page, size } params.
   */
  async list(): Promise<Category[]> {
    const { data } = await api.get<Category[]>(ENDPOINTS.categories.list);
    return data;
  },
};
