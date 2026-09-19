/**
 * Guards against open-redirect attacks when navigating to a dynamic path.
 *
 * Background: React Router 6.0.0–7.17.0 (CVE-2026-53669) can be tricked into
 * external navigation when a crafted path containing backslashes flows into
 * <Link to> or navigate(). The correct fix is not just to upgrade the library
 * — it is to never pass untrusted input to a navigation primitive without
 * validating it is an internal path.
 *
 * A path is "safe" if:
 *   - It is a string
 *   - It starts with exactly one '/' (not '//' — that is protocol-relative)
 *   - It contains no backslashes
 *   - It doesn't begin with a scheme like 'javascript:' or 'http:'
 *
 * Returns '/' as the safe fallback for anything that fails these checks.
 */
export function safeInternalPath(path: unknown): string {
  if (typeof path !== 'string' || path.length === 0) return '/';
  if (!path.startsWith('/')) return '/';
  if (path.startsWith('//')) return '/';
  if (path.includes('\\')) return '/';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return '/';
  return path;
}
