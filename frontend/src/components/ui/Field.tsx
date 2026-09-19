import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a form input with a label, optional hint, and error slot.
 *
 * Why forwardRef:
 *   RHF's register() spreads ref onto the input. If Field swallowed the ref
 *   without forwarding it, RHF couldn't reach the DOM node and validation
 *   would silently break. This is the #1 bug when wrapping inputs.
 *
 * Why useId:
 *   Each field gets a stable, unique id for the label→input association.
 *   Screen readers announce the label; clicking the label focuses the input.
 *
 * Why we clone the child:
 *   We inject `id`, `aria-invalid`, and `aria-describedby` onto whatever
 *   <Input>, <Select>, or <Textarea> the caller passed. This keeps the
 *   call-site clean: <Field label="Email"><Input {...register('email')} /></Field>
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, error, hint, required, children, className }, ref) => {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const describedBy =
      [error ? errorId : null, hint && !error ? hintId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const child = isValidElement(children)
      ? cloneElement(children as ReactElement, {
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        })
      : children;

    return (
      <div ref={ref} className={cn('space-y-1.5', className)}>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {child}

        {hint && !error && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Field.displayName = 'Field';
