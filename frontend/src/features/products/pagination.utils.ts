/**
 * Pure utility functions for pagination.
 *
 * Why this file exists separate from Pagination.tsx:
 *   The react-refresh/only-export-components rule requires that a file
 *   exporting components export ONLY components. Mixing components with
 *   utility functions forces Vite's HMR to do full page reloads instead
 *   of fast, stateful hot updates.
 *
 *   Beyond satisfying the linter, splitting has real benefits:
 *     - buildWindow is testable in isolation (pure function, no React)
 *     - Importable from non-React code (scripts, admin tables, SSR later)
 *     - Pagination.tsx stays focused on rendering
 */

/**
 * Compute the page window for a paginated UI.
 * Returns a mixed array of numbers and the literal string 'ellipsis'
 * for gaps between numbers.
 *
 * @example
 *   buildWindow(6, 50, 2)
 *   // [1, 'ellipsis', 4, 5, 6, 7, 8, 'ellipsis', 50]
 *
 *   buildWindow(1, 5, 2)
 *   // [1, 2, 3, 4, 5]
 *
 *   buildWindow(3, 3, 2)
 *   // [1, 2, 3]
 *
 * Algorithm:
 *   - Always include first page (1) and last page (total).
 *   - Show windowSize pages on either side of current.
 *   - Insert 'ellipsis' for any gap > 0 between shown ranges.
 *   - Handle edge cases: current near start, near end, or single page.
 */
export function buildWindow(
  current: number,
  total: number,
  windowSize: number,
): Array<number | 'ellipsis'> {
  const result: Array<number | 'ellipsis'> = [];

  // Single page or no pages — just return what we have.
  if (total <= 1) {
    return total === 1 ? [1] : [];
  }

  // Always include the first page.
  result.push(1);

  // Window boundaries around current, clamped to (2, total-1).
  const start = Math.max(2, current - windowSize);
  const end = Math.min(total - 1, current + windowSize);

  // Gap between page 1 and the start of the window.
  if (start > 2) result.push('ellipsis');

  // The window itself.
  for (let i = start; i <= end; i++) result.push(i);

  // Gap between the end of the window and the last page.
  if (end < total - 1) result.push('ellipsis');

  // Always include the last page.
  result.push(total);

  return result;
}
