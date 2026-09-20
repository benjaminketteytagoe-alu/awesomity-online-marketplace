import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function HomePage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span className="text-xs font-medium tracking-wide text-foreground">
            Frontend data layer ready
          </span>
        </div>

        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-foreground md:text-5xl text-balance">
          A considered marketplace for careful discovery.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
          Routing, Axios with JWT refresh, TanStack Query, and Zustand auth state
          are all wired. Real product pages come next.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products"
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6',
              'font-medium text-primary-foreground transition-colors hover:bg-primary/90',
            )}
          >
            Browse products
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/register"
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6',
              'font-medium text-foreground transition-colors hover:bg-muted',
            )}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
