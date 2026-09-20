/**
 * Category domain types — derived from the live API contract.
 *
 * Verified via:
 *   GET /api/categories
 *   -> Category[]   (bare array, NOT wrapped in Page<T>)
 *
 * Unlike /api/products and /api/products/featured, this endpoint is not
 * paginated. The category list is small and stable — a marketplace
 * typically has dozens of categories, not thousands — so a bare array
 * is a reasonable backend choice. The frontend accommodates both.
 */

/**
 * A single category as returned by GET /api/categories.
 *
 * Verified field set from live response:
 *   { id, name, slug, description }
 *
 * `description` may be null. UI must handle the empty case.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}
