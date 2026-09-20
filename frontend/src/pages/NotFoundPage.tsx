import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container py-24 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
      >
        Back to home
      </Link>
    </div>
  );
}
