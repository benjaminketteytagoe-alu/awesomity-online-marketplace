export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Marketplace</span>
        <span className="font-mono">localhost:3000</span>
      </div>
    </footer>
  );
}
