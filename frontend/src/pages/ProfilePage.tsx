import { useEffect, useState } from 'react';
import { BadgeCheck, AlertCircle, KeyRound, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/lib/api/client';
import { useProfile, useUpdateProfile } from '@/features/profile/profile.queries';
import { ChangePasswordModal } from '@/features/profile/ChangePasswordModal';
import { useAuthStore } from '@/features/auth/auth.store';
import { UserRoleBadge } from '@/features/admin/UserRoleBadge';
import { UserStatusBadge } from '@/features/admin/UserStatusBadge';

/**
 * The authenticated user's profile page.
 *
 * Sections:
 *   - Account summary (name, email, role, verified, joined date)
 *   - Editable name (inline)
 *   - Password change (modal)
 *   - Email (read-only, with explanation)
 */
export function ProfilePage() {
  const query = useProfile();
  const updateName = useUpdateProfile();
  const [nameInput, setNameInput] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  // Sync local input with fetched profile
  useEffect(() => {
    if (query.data) setNameInput(query.data.name);
  }, [query.data]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!query.data || trimmed === query.data.name) return;
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    try {
      const updated = await updateName.mutateAsync({ name: trimmed });
      // Keep the Zustand store in sync so the header updates
      setUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: updated.status,
      });
      toast.success('Name updated');
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  /* Loading */
  if (query.isLoading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-2xl space-y-4" role="status" aria-label="Loading profile">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/50" />
        </div>
      </div>
    );
  }

  /* Error */
  if (query.isError || !query.data) {
    return (
      <div className="container py-8">
        <div
          role="alert"
          className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {query.error ? toErrorMessage(query.error) : 'Profile not available'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const profile = query.data;
  const initials = getInitials(profile.name);
  const canSave = nameInput.trim().length >= 2 && nameInput.trim() !== profile.name;

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile and password.
          </p>
        </header>

        {/* Identity card */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700">
              <span className="font-display text-lg font-medium text-slate-50">
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-medium tracking-tight">
                {profile.name}
              </h2>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <UserRoleBadge role={profile.role} />
                <UserStatusBadge status={profile.status} />
                {profile.emailVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-warning">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Email not verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Member since {formatDate(profile.createdAt)}
          </p>
        </section>

        {/* Name edit */}
        <section className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-medium">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            Display name
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="" className="flex-1 min-w-[200px]">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={updateName.isPending}
                aria-label="Display name"
              />
            </Field>
            <Button
              type="button"
              onClick={handleSaveName}
              disabled={!canSave || updateName.isPending}
              isLoading={updateName.isPending}
            >
              Save
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            This name appears on your reviews and in your order history.
          </p>
        </section>

        {/* Password */}
        <section className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-medium">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Password
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Changing your password will sign you out of this session.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Change password
            </Button>
          </div>
        </section>

        {/* Email (read-only) */}
        <section className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-medium">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email
          </h2>
          <p className="text-sm">{profile.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Changing your email is not currently supported. Contact an
            admin if you need to update it.
          </p>
        </section>

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const [first, second] = parts;
  if (!first) return '?';
  if (!second) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
