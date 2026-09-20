export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="container flex h-14 items-center justify-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Marketplace</span>
      </div>
    </footer>
  );
}
