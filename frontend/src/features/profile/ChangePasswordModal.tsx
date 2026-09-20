import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/lib/api/client';
import { useChangePassword } from './profile.queries';
import { useAuthStore } from '@/features/auth/auth.store';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current',
  });

type FormValues = z.infer<typeof schema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Change password modal.
 *
 * On success, logs the user out and redirects to /login. Rationale:
 * a password change doesn't invalidate existing JWTs on the backend,
 * so a session created before the change would continue working. If
 * the user changed their password because they believed their
 * account was compromised, continuing with the old session defeats
 * the purpose. Forcing re-login is the safe default.
 */
export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const mutation = useChangePassword();
  const clearAuth = useAuthStore((s) => s.clear);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (isOpen) form.reset();
  }, [isOpen, form]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, mutation.isPending, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed. Please log in again.');
      clearAuth();
      // Hard redirect — ensures all in-memory state is dropped
      window.location.href = '/login';
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => !mutation.isPending && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-brand" />
            <h2
              id="change-password-title"
              className="font-display text-lg font-medium tracking-tight"
            >
              Change password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          <Field
            label="Current password"
            error={form.formState.errors.currentPassword?.message}
            required
          >
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              {...form.register('currentPassword')}
            />
          </Field>

          <Field
            label="New password"
            error={form.formState.errors.newPassword?.message}
            hint="At least 8 characters with a letter and a number."
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...form.register('newPassword')}
            />
          </Field>

          <Field
            label="Confirm new password"
            error={form.formState.errors.confirmPassword?.message}
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
          </Field>

          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            After changing your password, you'll be logged out and asked
            to sign in again with the new credentials.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing…
                </>
              ) : (
                'Change password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
