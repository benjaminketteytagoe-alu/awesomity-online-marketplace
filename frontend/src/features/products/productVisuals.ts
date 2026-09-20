/**
 * Deterministic visual fallbacks for products without images.
 *
 * The backend currently returns no imageUrl. Rather than rendering blank
 * boxes (looks broken) or hitting an external placeholder service (slow,
 * third-party dependency), we derive a stable gradient from the product
 * name. Every product gets a consistent visual identity that feels
 * intentional.
 *
 * When the backend adds an image field, we swap the gradient for an <img>
 * inside the same wrapper element — one line change, no call-site churn.
 */

/**
 * Eight curated gradient pairs, chosen to work on the warm off-white
 * background and the near-black dark background. All are mid-saturation
 * so text (white or black) reads cleanly on top.
 *
 * `as const` freezes the literal tuple, so TS knows the exact elements
 * and their exact string values.
 */
const GRADIENTS = [
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-sky-200 to-blue-300',
  'from-emerald-200 to-teal-300',
  'from-violet-200 to-purple-300',
  'from-lime-200 to-green-300',
  'from-cyan-200 to-sky-300',
  'from-fuchsia-200 to-rose-300',
] as const;

/**
 * Explicit fallback. With noUncheckedIndexedAccess enabled (which this
 * project has), GRADIENTS[anyIndex] is typed as T | undefined. Rather
 * than sprinkle non-null assertions, we declare a real fallback. If the
 * array ever becomes empty by accident, we still render something.
 */
const DEFAULT_GRADIENT: (typeof GRADIENTS)[number] = GRADIENTS[0];

/**
 * Stable string hash — FNV-1a, 32-bit. Chosen because it's tiny (~6 lines),
 * well-distributed for short strings, and deterministic across runs.
 *
 * We don't need cryptographic strength; we need "same name -> same index".
 * A non-deterministic hash (like Math.random) would make the card flicker
 * between renders.
 */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

/**
 * Get the Tailwind gradient classes for a product name.
 * Deterministic: same name always returns the same gradient.
 */
export function gradientFor(name: string): string {
  const index = hashString(name) % GRADIENTS.length;
  // `?? DEFAULT_GRADIENT` handles the theoretical undefined case.
  // Because index is `hash % length`, it is always in [0, length-1],
  // but TS cannot prove that, and noUncheckedIndexedAccess forces the
  // explicit fallback. This is defensive, not paranoid.
  return GRADIENTS[index] ?? DEFAULT_GRADIENT;
}

/**
 * Initial(s) to render inside the gradient placeholder. We use up to two
 * characters — "Handmade Vase" -> "HV", "Basket" -> "B".
 *
 * Why destructuring instead of parts[0] / parts[1]:
 *   With noUncheckedIndexedAccess, `parts[0]` is typed as string | undefined.
 *   Array destructuring assigns to typed locals — TS understands that
 *   destructured values from a non-empty array are safe to use, and we can
 *   give explicit defaults where the value might legitimately be missing.
 */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';

  const [first, second] = parts;
  // `first` is string | undefined; we already know parts.length > 0,
  // so first is defined. But TS still types it as possibly undefined, so
  // we provide a final safe fallback.
  if (!first) return '?';
  if (!second) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}

/**
 * Stock classification — shared across all product surfaces so the
 * "out of stock" / "low stock" rules are identical everywhere.
 */
export type StockState = 'in-stock' | 'low-stock' | 'out-of-stock';

export function stockState(stock: number): StockState {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
}

/**
 * Format a price in GBP. We use Intl.NumberFormat for two reasons:
 *   - Locale-correct thousand separators and decimal points
 *   - Stable output shape (no floating-point display bugs like £49.99000001)
 *
 * Note: we never do arithmetic on prices in the frontend — that's the
 * backend's job with BigDecimal. We only format for display.
 *
 * The formatter is constructed once at module scope. Creating an
 * Intl.NumberFormat per render is a surprisingly common performance bug.
 */
const priceFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}
