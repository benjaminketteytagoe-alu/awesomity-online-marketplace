import { api } from '@/lib/api/client';
import type { Page } from '@/lib/api/types';
import type {
  CanReview,
  CreateReviewRequest,
  Review,
  ReviewSummary,
  UpdateReviewRequest,
} from './review.types';

/**
 * Reviews API client.
 *
 * Public endpoints:
 *   - list, summary, canReview
 * Shopper-only:
 *   - create, update, delete (backend enforces)
 */
export const reviewApi = {
  async list(
    productId: string,
    params: { page?: number; size?: number } = {},
  ): Promise<Page<Review>> {
    const query: Record<string, number> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.size !== undefined) query.size = params.size;

    const { data } = await api.get<Page<Review>>(
      `/api/products/${productId}/reviews`,
      { params: query },
    );
    return data;
  },

  async summary(productId: string): Promise<ReviewSummary> {
    const { data } = await api.get<ReviewSummary>(
      `/api/products/${productId}/reviews/summary`,
    );
    return data;
  },

  /**
   * Can the current user review this product?
   * Works for anonymous callers too — returns canReview=false.
   */
  async canReview(productId: string): Promise<CanReview> {
    const { data } = await api.get<CanReview>(
      `/api/products/${productId}/can-review`,
    );
    return data;
  },

  async create(
    productId: string,
    payload: CreateReviewRequest,
  ): Promise<Review> {
    const { data } = await api.post<Review>(
      `/api/products/${productId}/reviews`,
      payload,
    );
    return data;
  },

  async update(id: string, payload: UpdateReviewRequest): Promise<Review> {
    const { data } = await api.patch<Review>(`/api/reviews/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/reviews/${id}`);
  },
};
