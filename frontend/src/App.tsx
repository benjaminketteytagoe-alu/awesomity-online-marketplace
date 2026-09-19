import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Step 14.1 landing card.
 * Confirms the full toolchain works: React, TypeScript, Tailwind tokens,
 * self-hosted fonts, lucide icons, and the cn() utility.
 * Replaced in Step 14.4 with the real application shell + router.
 */
function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">
                M
              </span>
            </div>
            <span className="font-display text-base font-medium tracking-tight text-foreground">
              Marketplace
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            v0.0.1
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-xl animate-fade-in">
          <div className="rounded-2xl border border-border bg-surface p-10 shadow-sm">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-medium tracking-wide text-foreground">
                Frontend scaffold ready
              </span>
            </div>

            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-foreground text-balance">
              A considered foundation for the marketplace.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              Vite · React 18 · TypeScript (strict) · Tailwind tokens · shadcn/ui ·
              self-hosted Inter & JetBrains Mono · Lucide icons · nginx reverse proxy.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4',
                  'font-medium text-primary-foreground',
                  'transition-colors duration-150',
                  'hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Featured
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">GET /api/actuator/health</span>
            <span>
              Backend proxy:{' '}
              <code className="font-mono text-foreground">/api/*</code>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Marketplace</span>
          <span className="font-mono">localhost:3000</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
