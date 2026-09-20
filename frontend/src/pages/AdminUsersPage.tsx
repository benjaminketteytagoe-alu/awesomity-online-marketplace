import { Users } from 'lucide-react';

export function AdminUsersPage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-display text-lg font-medium">Users</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        User management lands in a later block.
      </p>
    </div>
  );
}
