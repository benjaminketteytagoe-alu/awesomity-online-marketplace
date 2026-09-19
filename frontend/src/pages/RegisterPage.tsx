import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/auth.schemas';
import { useRegister } from '@/features/auth/auth.mutations';
import { toErrorMessage } from '@/lib/api/client';

export function RegisterPage() {
  // The "registered" state is the email we sent verification to, or null.
  // Storing the email (not a boolean) lets us display it in the success UI.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const registerMutation = useRegister();

  const onSubmit = handleSubmit((values) => {
    // Strip confirmPassword before sending. It's a UI concern, not an API one.
    const { confirmPassword: _drop, ...payload } = values;
    void _drop; // silence the unused-var lint

    registerMutation.mutate(payload, {
      onSuccess: () => setRegisteredEmail(values.email),
      onError: (err) => {
        const message = toErrorMessage(err);
        if (/already|registered|exists/i.test(message)) {
          setError('email', { type: 'server', message });
        }
      },
    });
  });

  // ─── Success state ────────────────────────────────────────────────
  // After registering, we DON'T auto-login. Two reasons:
  //  a) The backend requires email verification before login. Auto-login
  //     would 403 immediately, which is confusing.
  //  b) "Check your inbox" is the standard, unambiguous pattern users expect.
  if (registeredEmail) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10">
            <Mail className="h-5 w-5 text-brand" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a verification link to{' '}
            <span className="font-medium text-foreground">{registeredEmail}</span>.
            Click it to activate your account.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setRegisteredEmail(null)}
              className="font-medium text-foreground hover:underline"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  const formError =
    registerMutation.isError &&
    !errors.email &&
    !errors.name &&
    !errors.password &&
    !errors.confirmPassword
      ? toErrorMessage(registerMutation.error)
      : null;

  // ─── Form state ───────────────────────────────────────────────────
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-sm">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start discovering or selling on Marketplace.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Name" error={errors.name?.message} required>
            <Input
              autoComplete="name"
              autoFocus
              placeholder="Ada Lovelace"
              {...register('name')}
            />
          </Field>

          <Field label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            hint="At least 8 characters with a letter and a number."
            required
          >
            <Input
              type="password"
              // new-password (not current-password) — browsers offer to
              // *generate* a strong password for new-password fields.
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
            />
          </Field>

          <Field
            label="Confirm password"
            error={errors.confirmPassword?.message}
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </Field>

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
