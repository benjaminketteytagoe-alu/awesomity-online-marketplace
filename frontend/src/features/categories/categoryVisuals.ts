/**
 * Visual theming for category cards.
 *
 * Why categories get their own palette rather than reusing
 * productVisuals.gradientFor():
 *   - Product gradients are pastel (200/300-level Tailwind) sized for
 *     1:1 thumbnails with dark text. They look washed out when scaled
 *     to a 4:3 full-bleed category card.
 *   - Categories are a discovery surface, not a data record. They
 *     deserve weight: deep backgrounds, light text, and a subtle
 *     ornament. That's a different design system from product tiles.
 *   - Keeping the two palettes separate means changing one doesn't
 *     accidentally restyle the other.
 *
 * The palette is deliberately small (6 themes). More would feel
 * random; fewer would repeat too often. Six gives visual variety
 * without losing curation.
 */

/**
 * One category theme.
 *
 *   bg       — Tailwind gradient class for the full-bleed background.
 *   fg       — Primary text color for the category name.
 *   fgMuted  — Text color for the subtitle and secondary content.
 *   accent   — A small dot or chip color, used sparingly.
 *   ornament — Text color for the large faded monogram in the corner.
 */
export interface CategoryTheme {
  bg: string;
  fg: string;
  fgMuted: string;
  accent: string;
  ornament: string;
}

const CATEGORY_THEMES: readonly CategoryTheme[] = [
  {
    bg: 'from-slate-900 via-slate-800 to-slate-700',
    fg: 'text-slate-50',
    fgMuted: 'text-slate-200/70',
    accent: 'bg-sky-400',
    ornament: 'text-slate-50/10',
  },
  {
    bg: 'from-orange-900 via-orange-800 to-rose-700',
    fg: 'text-orange-50',
    fgMuted: 'text-orange-100/75',
    accent: 'bg-amber-300',
    ornament: 'text-orange-50/10',
  },
  {
    bg: 'from-emerald-950 via-emerald-900 to-teal-800',
    fg: 'text-emerald-50',
    fgMuted: 'text-emerald-100/75',
    accent: 'bg-emerald-300',
    ornament: 'text-emerald-50/10',
  },
  {
    bg: 'from-indigo-950 via-indigo-900 to-violet-800',
    fg: 'text-indigo-50',
    fgMuted: 'text-indigo-100/75',
    accent: 'bg-violet-300',
    ornament: 'text-indigo-50/10',
  },
  {
    bg: 'from-rose-950 via-rose-900 to-pink-800',
    fg: 'text-rose-50',
    fgMuted: 'text-rose-100/75',
    accent: 'bg-rose-300',
    ornament: 'text-rose-50/10',
  },
  {
    bg: 'from-blue-950 via-blue-900 to-sky-800',
    fg: 'text-sky-50',
    fgMuted: 'text-sky-100/75',
    accent: 'bg-cyan-300',
    ornament: 'text-sky-50/10',
  },
] as const;

/**
 * Stable FNV-1a 32-bit hash. Same algorithm as productVisuals so both
 * systems behave identically for the same input.
 *
 * Local to this file rather than imported from productVisuals because:
 *   - It's 8 lines, and duplicating avoids a cross-feature dependency
 *     that would couple categories to products for no real reason.
 *   - If we ever extract a shared lib/hash.ts, both call sites can
 *     move to it in one commit.
 */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick a theme for a category, deterministically by slug.
 *
 * Why slug, not name:
 *   Slugs are stable identifiers. If an admin renames "Home & Garden"
 *   to "Home and Garden", the slug stays "home-garden" and the color
 *   doesn't shift. Hashing the name would cause a visible flicker on
 *   every rename — a small thing, but the kind of detail users notice
 *   when it goes wrong.
 */
export function themeFor(slug: string): CategoryTheme {
  const index = hashString(slug) % CATEGORY_THEMES.length;
  // Non-null assertion is avoided: we provide a real fallback.
  return CATEGORY_THEMES[index] ?? CATEGORY_THEMES[0]!;
}

/**
 * Initials for the category monogram. Reimplemented here (three lines)
 * rather than imported from productVisuals — the two files are peer
 * visual systems, not one depending on the other.
 */
export function categoryInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const [first, second] = parts;
  if (!first) return '?';
  if (!second) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}
