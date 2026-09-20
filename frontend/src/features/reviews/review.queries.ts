import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { Page } from '@/lib/api/types';
import { reviewApi } from './review.api';
import type {
  CanReview,
  CreateReviewRequest,
  Review,
  ReviewSummary,
  UpdateReviewRequest,
} from './review.types';

/**
 * Query keys for reviews. Nested per product so invalidating a
 * product's reviews doesn't touch other products.
 */
export const reviewKeys = {
  all: ['reviews'] as const,
  forProduct: (productId: string) =>
    [...reviewKeys.all, productId] as const,
  list: (productId: string, params: { page?: number; size?: number }) =>
    [...reviewKeys.forProduct(productId), 'list', params] as const,
  summary: (productId: string) =>
    [...reviewKeys.forProduct(productId), 'summary'] as const,
  canReview: (productId: string) =>
    [...reviewKeys.forProduct(productId), 'can-review'] as const,
};

export function useProductReviews(
  productId: string | undefined,
  params: { page?: number; size?: number } = {},
): UseQueryResult<Page<Review>> {
  return useQuery({
    queryKey: reviewKeys.list(productId ?? '', params),
    queryFn: () => reviewApi.list(productId!, params),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

export function useReviewSummary(
  productId: string | undefined,
): UseQueryResult<ReviewSummary> {
  return useQuery({
    queryKey: reviewKeys.summary(productId ?? ''),
    queryFn: () => reviewApi.summary(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

export function useCanReview(
  productId: string | undefined,
): UseQueryResult<CanReview> {
  return useQuery({
    queryKey: reviewKeys.canReview(productId ?? ''),
    queryFn: () => reviewApi.canReview(productId!),
    enabled: Boolean(productId),
    staleTime: 30_000,
  });
}

/**
 * Invalidate list + summary + can-review for a product after a
 * mutation. The three queries reflect related state — creating a
 * review changes the count, the average, AND flips canReview from
 * true to false.
 */
function invalidateReviewsFor(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
) {
  queryClient.invalidateQueries({
    queryKey: reviewKeys.list(productId, {}),
  });
  queryClient.invalidateQueries({
    queryKey: reviewKeys.summary(productId),
  });
  queryClient.invalidateQueries({
    queryKey: reviewKeys.canReview(productId),
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation<Review, Error, CreateReviewRequest>({
    mutationFn: (payload) => reviewApi.create(productId, payload),
    onSuccess: () => invalidateReviewsFor(queryClient, productId),
  });
}

export function useUpdateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Review,
    Error,
    { id: string; payload: UpdateReviewRequest }
  >({
    mutationFn: ({ id, payload }) => reviewApi.update(id, payload),
    onSuccess: () => invalidateReviewsFor(queryClient, productId),
  });
}

export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => reviewApi.delete(id),
    onSuccess: () => invalidateReviewsFor(queryClient, productId),
  });
}
