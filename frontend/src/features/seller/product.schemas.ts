import { z } from 'zod';

/**
 * Product form schema.
 *
 * Validation rules are copied verbatim from the backend's
 * CreateProductRequest annotations so the frontend rejects the same
 * inputs the backend would. When they agree, the user never sees a
 * round-trip error for something the browser could have caught.
 *
 * Note on price: the backend uses BigDecimal with @Digits(integer=10,
 * fraction=2). We validate the string representation to avoid
 * floating-point precision surprises at the boundary.
 */

const MAX_DESCRIPTION = 5000;

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name is too long'),

  // Description is optional. Empty string → undefined at submit time.
  // We still cap the length to match the backend.
  description: z
    .string()
    .max(MAX_DESCRIPTION, `Description must be at most ${MAX_DESCRIPTION} characters`)
    .optional()
    .or(z.literal('')),

  // Price kept as a string through the form, converted to number at
  // submit. Why: <input type="number"> gives us the value as a string
  // and we don't want to lose the ability to type "19." mid-keystroke
  // without the value being truncated to 19.
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(v.trim()),
      'Price must be a number with up to 2 decimal places',
    )
    .refine((v) => parseFloat(v) >= 0, 'Price cannot be negative'),

  // Same rationale — string through the form.
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine((v) => /^\d+$/.test(v.trim()), 'Stock must be a whole number')
    .refine((v) => parseInt(v, 10) >= 0, 'Stock cannot be negative'),

  categoryId: z.string().min(1, 'Category is required'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
