import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas';
import { useLogin } from '@/features/auth/auth.mutations';
import { toErrorMessage } from '@/lib/api/client';

export function LoginPage() {
  const location = useLocation();
  // If we arrived here because RequireAuth bounced us, show a gentle note.
  const wasRedirected = Boolean(
    (location.state as { from?: string } | null)?.from,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // setError lets us inject SERVER-side errors into field errors — see below.
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // mode: 'onTouched' means validate when the user leaves a field, not on
    // every keystroke. The user gets feedback when they've finished typing,
    // not while they're mid-word. Small UX detail, makes forms feel calm.
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onError: (err) => {
        // Server-side validation errors (e.g. "Email not verified") don't
        // map to a field. If the message mentions "email", attach it to the
        // email field; otherwise show form-level. Real systems return
        // structured error codes and the frontend switches on code, not
        // message text — we'll switch to that when the backend exposes it.
        const message = toErrorMessage(err);
        if (/email/i.test(message)) {
          setError('email', { type: 'server', message });
        }
      },
    });
  });

  // Derive a form-level error: any error that isn't tied to a specific field.
  const formError =
    login.isError && !errors.email && !errors.password
      ? toErrorMessage(login.error)
      : null;

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-sm">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {wasRedirected
              ? 'Log in to continue where you left off.'
              : 'Log in to your Marketplace account.'}
          </p>
        </header>

        {/* autoComplete lets password managers fill credentials.
            autoFocus saves a click for keyboard users. Both are cheap and
            every serious login page has them. */}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              {...register('email')}
            />
          </Field>

          <Field label="Password" error={errors.password?.message} required>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
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
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
