'use client';

import { useEffect, useState, useTransition } from 'react';
import { Loader2, Monitor, ShieldOff } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonBlock, SkeletonLine } from '@/components/dashboard/skeletons/skeleton-primitives';
import { useToast } from '@/components/ui/toast';
import {
  listUserSessions,
  revokeOtherUserSessions,
  revokeUserSession,
  type UserSessionView,
} from '@/server/actions/sessions';

type ConfirmTarget =
  | { type: 'one'; id: string; label: string }
  | { type: 'others' }
  | null;

function describeAgent(userAgent: string | null) {
  if (!userAgent) return 'Perangkat tidak dikenal';
  const browser = /Edg\//i.test(userAgent)
    ? 'Microsoft Edge'
    : /Chrome\//i.test(userAgent)
      ? 'Chrome'
      : /Firefox\//i.test(userAgent)
        ? 'Firefox'
        : /Safari\//i.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/i.test(userAgent)
    ? 'Windows'
    : /Android/i.test(userAgent)
      ? 'Android'
      : /iPhone|iPad|iPod/i.test(userAgent)
        ? 'iOS'
        : /Mac OS X/i.test(userAgent)
          ? 'macOS'
          : /Linux/i.test(userAgent)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

function formatDate(value: Date) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionManager() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<UserSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    listUserSessions()
      .then((items) => {
        if (!active) return;
        setSessions(items);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Daftar sesi tidak dapat dimuat.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function refresh() {
    return listUserSessions()
      .then((items) => {
        setSessions(items);
        setError(null);
      })
      .catch(() => setError('Daftar sesi tidak dapat dimuat.'));
  }

  function confirmRevoke() {
    if (!confirmTarget) return;
    startTransition(async () => {
      const result =
        confirmTarget.type === 'others'
          ? await revokeOtherUserSessions()
          : await revokeUserSession(confirmTarget.id);

      if (!result.ok) {
        showToast('error', result.error);
        return;
      }

      showToast(
        'success',
        result.count > 0
          ? `${result.count} sesi berhasil dicabut.`
          : 'Tidak ada sesi lain yang perlu dicabut.',
      );
      setConfirmTarget(null);
      await refresh();
    });
  }

  const otherSessions = sessions.filter((item) => !item.isCurrent);

  return (
    <div className="mt-5 border-t border-stone-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#181700]">Perangkat &amp; Sesi Aktif</h3>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Cabut sesi yang tidak Anda kenali untuk melindungi akun.
          </p>
        </div>
        {otherSessions.length > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmTarget({ type: 'others' })}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-3 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Cabut semua sesi lain
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-3 space-y-3" aria-busy="true" aria-label="Memuat sesi">
          {[0, 1].map((item) => (
            <div key={item} className="flex items-start gap-2.5 py-2.5">
              <SkeletonBlock className="h-8 w-8 shrink-0 rounded-xl bg-stone-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-44 max-w-full rounded-md bg-stone-200/80" />
                <SkeletonLine className="w-56 max-w-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {sessions.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F1] text-[#181700]">
                  <Monitor className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#181700]">
                    {describeAgent(item.userAgent)}
                    {item.isCurrent ? (
                      <span className="ml-2 inline-flex rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[9px] font-bold text-[var(--hafta-grn-700)]">
                        Sesi ini
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-stone-500">
                    {item.ipAddress ? `${item.ipAddress} · ` : ''}
                    Masuk {formatDate(item.createdAt)}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Berlaku sampai {formatDate(item.expiresAt)}
                  </p>
                </div>
              </div>
              {!item.isCurrent ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setConfirmTarget({
                      type: 'one',
                      id: item.id,
                      label: describeAgent(item.userAgent),
                    })
                  }
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cabut
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'others'
            ? 'Cabut semua sesi lain?'
            : `Cabut sesi ${confirmTarget?.type === 'one' ? confirmTarget.label : ''}?`
        }
        description={
          confirmTarget?.type === 'others'
            ? 'Semua perangkat lain akan keluar dari akun ini. Sesi yang sedang Anda gunakan tetap aktif.'
            : 'Perangkat tersebut akan keluar dari akun ini dan harus masuk kembali untuk mengakses data.'
        }
        confirmLabel={pending ? 'Mencabut…' : 'Ya, Cabut'}
        cancelLabel="Batal"
        variant="destructive"
        pending={pending}
        onConfirm={confirmRevoke}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
