import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useVerifyEmail } from '@/features/auth/auth.mutations';
import { toErrorMessage } from '@/lib/api/client';

/**
 * Verify-email page. Fires the verification automatically on mount.
 *
 * Why auto-fire instead of a "click to verify" button:
 *   The link in the email IS the confirmation. Making the user click again
 *   is a redundant second consent.
 *
 * Known trade-off: some email scanners prefetch URLs. Our backend treats
 * /verify as a GET, so a prefetch consumes the token. For a challenge
 * project that's acceptable; the fix would be to make /verify a POST with
 * a client-side form.
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const verify = useVerifyEmail();

  // React 18 StrictMode double-invokes effects in dev. Without this guard,
  // we'd fire two verify requests, and if the token is single-use the second
  // one fails — user sees an error even though verification succeeded.
  // A ref persists across the double-invoke; state does not reliably.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true;
    verify.mutate(token);
    // verify.mutate is stable in TanStack Query v5; deps deliberately minimal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <StatusShell
        icon={<XCircle className="h-6 w-6 text-destructive" />}
        title="Missing verification link"
        description="This page expects a verification link from your email. Check your inbox for the most recent message."
        action={
          <Link to="/login">
            <Button variant="secondary">Back to login</Button>
          </Link>
        }
      />
    );
  }

  if (verify.isPending) {
    return (
      <StatusShell
        icon={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        title="Verifying your email…"
        description="This will only take a moment."
      />
    );
  }

  if (verify.isSuccess) {
    return (
      <StatusShell
        icon={<CheckCircle2 className="h-6 w-6 text-success" />}
        title="Email verified"
        description="Your account is active. You can now log in."
        action={
          <Link to="/login">
            <Button>Log in</Button>
          </Link>
        }
      />
    );
  }

  return (
    <StatusShell
      icon={<XCircle className="h-6 w-6 text-destructive" />}
      title="Verification failed"
      description={toErrorMessage(verify.error)}
      action={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button variant="secondary">Back to login</Button>
          </Link>
          <Link to="/register">
            <Button variant="ghost">Create a new account</Button>
          </Link>
        </div>
      }
    />
  );
}

/**
 * Presentational helper — four states, same layout. Extracting it keeps the
 * main component's branching readable.
 */
function StatusShell({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
          {icon}
        </div>
        <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
