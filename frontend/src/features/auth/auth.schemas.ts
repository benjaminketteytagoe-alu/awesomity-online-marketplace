import { z } from 'zod';

/**
 * Shared auth schemas.
 *
 * Why one file, not inline schemas per page:
 *   Register and Login both validate email/password — the rules MUST match.
 *   If they drift (login says min 8, register says min 12), a user who
 *   registered before a rule change can't log in. One file, one rule.
 *
 * Why Zod over manual validation:
 *   We write the rule once and get BOTH runtime validation AND a TypeScript
 *   type derived from it via z.infer. No drift between "what the form checks"
 *   and "what the type says".
 */

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  // Normalize: users type "Bob@Example.com ", backend has "bob@example.com".
  // Trimming + lowercasing at the validation boundary means the API always
  // receives clean input — no server-side surprises.
  .transform((v) => v.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  // 72 is bcrypt's input limit. If we allowed longer, two passwords with
  // the same first 72 bytes would both verify — a subtle security bug.
  .max(72, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name is too long');

export const loginSchema = z.object({
  email: emailSchema,
  // For login we DON'T enforce the full password policy — that would leak
  // information about what the stored password looks like. Just require
  // something non-empty and let the backend reject.
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  // Cross-field refinement: RHF runs this only after per-field validation passes.
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
