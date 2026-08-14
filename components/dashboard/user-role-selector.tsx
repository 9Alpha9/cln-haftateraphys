'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { getRoleLabel } from '@/lib/role-utils';
import type { Role } from '@/lib/permissions';
import { assignRole } from '@/server/actions/user-roles';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER'];

export function UserRoleSelector({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: Role;
  disabled: boolean;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  function onChange(next: string) {
    if (next === role || !next) return;
    const prev = role;
    setRole(next as Role);
    setFeedback(null);

    startTransition(async () => {
      const result = await assignRole({ userId, role: next });
      if (!result.ok) {
        setRole(prev);
        setFeedback({ type: 'error', text: result.error });
        return;
      }
      setFeedback({ type: 'success', text: 'Role diperbarui.' });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label="Ubah role"
        value={role}
        disabled={disabled || pending}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-44"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {getRoleLabel(r)}
          </option>
        ))}
      </Select>
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : feedback ? (
        feedback.type === 'error' ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-label={feedback.text} />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label={feedback.text} />
        )
      ) : null}
    </div>
  );
}
