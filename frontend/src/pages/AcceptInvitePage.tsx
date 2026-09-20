import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Store, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/features/auth/auth.api';
import { toErrorMessage } from '@/lib/api/client';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const acceptSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type AcceptFormValues = z.infer<typeof acceptSchema>;

/**
 * Public accept-invite page.
 *
 * Route: /seller-applications/accept?token=...
 *
 * The token is derived from the URL and submitted with the chosen
 * password. The backend resolves the applicant from the token — we
 * don't need to ask for email or name.
 *
 * On success, the user is redirected to /login with a toast
 * prompting them to sign in with the credentials they just set.
 */
export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Missing token — nothing we can do. Render a friendly error.
  if (!token) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
            <Store className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">
            Invite link is invalid
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page expects a token from your invite email. Check your
            inbox for the most recent message.
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await authApi.acceptSellerInvite({
        inviteToken: token,
        password: values.password,
      });
      toast.success('Account created. Log in to continue.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(toErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-sm">
        <header className="mb-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10">
            <CheckCircle2 className="h-5 w-5 text-brand" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">
            Complete your seller account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set a password to activate your account and shop. You'll be
            able to log in with your email and this password.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field
            label="Password"
            error={form.formState.errors.password?.message}
            hint="At least 8 characters with a letter and a number."
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              {...form.register('password')}
            />
          </Field>

          <Field
            label="Confirm password"
            error={form.formState.errors.confirmPassword?.message}
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create my account'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
