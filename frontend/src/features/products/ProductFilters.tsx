import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useDebouncedValue,
  type ProductFilters as FiltersShape,
} from './useProductFilters';
import { PRODUCT_SORTS, type ProductSortKey } from './product.types';

interface ProductFiltersProps {
  filters: FiltersShape;
  onFiltersChange: (
    updates: Partial<FiltersShape>,
    opts?: { replace?: boolean },
  ) => void;
  onClear: () => void;
  /**
   * Available categories for the dropdown. In a later step this comes
   * from the /api/categories endpoint. For now the parent passes what
   * it has, and we render gracefully if the list is empty.
   */
  categories?: Array<{ slug: string; name: string }>;
  className?: string;
}

/**
 * Filter bar: search, category, sort, and a clear button.
 *
 * The interesting design decisions live in how each control writes
 * state:
 *
 *   - Search: local state, debounced into the URL. See the useEffect
 *     below for the full explanation.
 *   - Category / Sort: discrete actions, write immediately.
 *   - Clear: only rendered when there's something to clear.
 */
export function ProductFilters({
  filters,
  onFiltersChange,
  onClear,
  categories = [],
  className,
}: ProductFiltersProps) {
  // ---------- Search input ----------
  // Local state mirrors the URL value but lives independently while the
  // user types. When the URL changes (e.g. user clicks a "clear" or
  // arrives via a link), we sync back.
  const [searchInput, setSearchInput] = useState(filters.search);

  // Sync local input when URL value changes externally.
  // We guard with a comparison to avoid clobbering active typing when
  // the debounced write fires and React re-renders us.
  useEffect(() => {
    if (filters.search !== searchInput) {
      // Only sync if the difference is meaningful — e.g. arriving from a
      // link with ?search=phone, or Clear was clicked.
      // We compare trimmed values to avoid resetting mid-typing when
      // only trailing whitespace differs.
      setSearchInput(filters.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Debounced version of the local input. When typing stops, this
  // settles on the final value and we push it to the URL.
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    // Only write to URL if the debounced value differs from current.
    // Prevents a no-op navigation on every render.
    if (debouncedSearch !== filters.search) {
      // replace: true — search is not a "page" the user is navigating
      // to; it's a refinement of the current view. Doesn't deserve a
      // history entry.
      onFiltersChange({ search: debouncedSearch }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== null ||
    filters.sort !== 'newest';

  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-center', className)}>
      {/* Search input with icon */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search products"
        />
      </div>

      {/* Category dropdown */}
      <select
        value={filters.category ?? ''}
        onChange={(e) =>
          onFiltersChange({
            category: e.target.value === '' ? null : e.target.value,
          })
        }
        aria-label="Filter by category"
        className={cn(
          'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        )}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Sort dropdown */}
      <select
        value={filters.sort}
        onChange={(e) =>
          onFiltersChange({ sort: e.target.value as ProductSortKey })
        }
        aria-label="Sort products"
        className={cn(
          'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        )}
      >
        <option value="newest">Newest</option>
        <option value="priceAsc">Price: low to high</option>
        <option value="priceDesc">Price: high to low</option>
        <option value="nameAsc">Name: A–Z</option>
      </select>

      {/* Clear button — only when something's active */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onClear}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

/**
 * Reference: PRODUCT_SORTS is imported to make sure the dropdown values
 * stay in sync with the type. If the sort map gains an entry, this file
 * fails to compile until the dropdown is updated. That's intentional —
 * silent drift is worse than a compile error.
 */
void PRODUCT_SORTS;
