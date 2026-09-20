/**
 * Review types — from backend DTOs.
 *
 *   ReviewResponse        — a single review
 *   ReviewSummaryResponse — average + count for a product
 *   CanReviewResponse     — can this user review this product?
 *   CreateReviewRequest   — body for POST
 *   UpdateReviewRequest   — body for PATCH (partial)
 */

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: Rating;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
}

export interface CanReview {
  productId: string;
  canReview: boolean;
  hasReviewed: boolean;
  existingReviewId: string | null;
}

export interface CreateReviewRequest {
  rating: Rating;
  comment?: string | null;
}

export interface UpdateReviewRequest {
  rating?: Rating;
  comment?: string | null;
}
