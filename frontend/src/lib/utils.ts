import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names intelligently.
 *   cn('p-2', condition && 'p-4') -> "p-4"   (not "p-2 p-4")
 *
 * Uses clsx for conditionals + tailwind-merge for conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
