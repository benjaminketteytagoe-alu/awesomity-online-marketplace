import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCT_SORTS, type ProductSortKey } from './product.types';

/**
 * The canonical filter state shape. Everything a user can control that
 * affects which products they see.
 *
 * Note: `page` here is 1-indexed (URL-friendly). The API uses 0-indexed.
 * The translation happens in `toApiParams`, not scattered across callers.
 */
export interface ProductFilters {
  page: number;         // 1-indexed in URL
  size: number;
  category: string | null;  // category slug
  search: string;
  sort: ProductSortKey;
}

const DEFAULTS: ProductFilters = {
  page: 1,
  size: 12,
  category: null,
  search: '',
  sort: 'newest',
};

/**
 * Read the current filter state from the URL query string.
 *
 * Every field has a sane default. Malformed values fall back to defaults
 * rather than throwing — a user with a hand-edited URL should see a
 * working page, not a crash.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Why useMemo:
   *   Without memoization, `filters` would be a new object reference on
   *   every render. The useCallback below closes over `filters`, so its
   *   dependency array would see a "changed" value every render, breaking
   *   memoization. Consumers of setFilters would re-render on every parent
   *   render. Wrapping in useMemo ties `filters` to `searchParams`, which
   *   React Router keeps stable when the URL query string hasn't changed.
   */
  const filters = useMemo<ProductFilters>(
    () => ({
      page: parsePositiveInt(searchParams.get('page'), DEFAULTS.page),
      size: parsePositiveInt(searchParams.get('size'), DEFAULTS.size),
      category: searchParams.get('category') || DEFAULTS.category,
      search: searchParams.get('search') ?? DEFAULTS.search,
      sort: parseSort(searchParams.get('sort')),
    }),
    [searchParams],
  );

  /**
   * Update one or more filter values. Uses pushState by default so the
   * browser back button works. Pass { replace: true } for ephemeral
   * updates (e.g. debounced search) that shouldn't pollute history.
   *
   * Rules encoded here:
   *   - Changing anything other than `page` resets page to 1.
   *     (Otherwise "page 5 of shoes" -> filter to books -> page 5 of books
   *      which is likely empty and confusing.)
   *   - Empty strings and default values are dropped from the URL, so
   *     `?category=&search=&page=1` becomes a clean `/products`.
   */
  const setFilters = useCallback(
    (
      updates: Partial<ProductFilters>,
      opts: { replace?: boolean } = {},
    ) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          const nextFilters: ProductFilters = {
            ...filters,
            ...updates,
          };

          // Auto-reset page when any non-page filter changes.
          const touchesFilters = Object.keys(updates).some(
            (k) => k !== 'page' && k !== 'size',
          );
          if (touchesFilters) {
            nextFilters.page = 1;
          }

          writeParam(next, 'page', nextFilters.page, DEFAULTS.page);
          writeParam(next, 'size', nextFilters.size, DEFAULTS.size);
          writeParam(next, 'category', nextFilters.category, DEFAULTS.category);
          writeParam(next, 'search', nextFilters.search, DEFAULTS.search);
          writeParam(next, 'sort', nextFilters.sort, DEFAULTS.sort);

          return next;
        },
        { replace: opts.replace },
      );
    },
    [filters, setSearchParams],
  );

  /**
   * Reset everything to defaults. Uses replace: true — clearing filters
   * is not a history-worthy event.
   */
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilters, clearFilters };
}

/**
 * Convert URL-shaped filters (1-indexed page) to API-shaped params
 * (0-indexed page). This is the ONLY place the off-by-one translation
 * happens.
 */
export function toApiParams(filters: ProductFilters) {
  return {
    page: Math.max(0, filters.page - 1),
    size: filters.size,
    category: filters.category ?? undefined,
    search: filters.search || undefined,
    sort: PRODUCT_SORTS[filters.sort],
  };
}

/**
 * A debounced copy of a value. We use this for the search input so typing
 * doesn't fire a request per keystroke. The debounced value is what gets
 * pushed to the URL.
 *
 * Why we don't debounce inside the input component:
 *   Because the URL is the source of truth. The input holds a local copy
 *   for responsiveness, and only writes to the URL after the user pauses.
 *   If the input wrote to the URL on every keystroke, the browser would
 *   get a history entry per letter.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

/* ---------------- helpers ---------------- */

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseSort(raw: string | null): ProductSortKey {
  if (raw && raw in PRODUCT_SORTS) return raw as ProductSortKey;
  return DEFAULTS.sort;
}

/**
 * Write a value to URLSearchParams only if it differs from the default.
 * Keeps URLs clean — /products beats /products?page=1&size=12&sort=newest.
 */
function writeParam<T extends string | number>(
  params: URLSearchParams,
  key: string,
  value: T | null,
  defaultValue: T | null,
): void {
  const isDefault =
    value === defaultValue ||
    value === null ||
    value === undefined ||
    value === '';

  if (isDefault) {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
}
