'use client';

import { useEffect, useState } from 'react';
import { fetchUserRole } from '@/app/dashboard/actions';
import type { Role } from '@/lib/permissions';

export function useUserRole() {
  const [role, setRole] = useState<Role>('USER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole()
      .then(setRole)
      .catch(() => setRole('USER'))
      .finally(() => setLoading(false));
  }, []);

  return { role, loading };
}
