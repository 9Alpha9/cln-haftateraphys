'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'THERAPIST' | 'STAFF' | 'PASIEN' | 'USER';

const IDLE_DURATIONS: Record<string, number> = {
  SUPER_ADMIN: 15 * 60 * 1000, // 15 menit
  ADMIN: 15 * 60 * 1000,
  THERAPIST: 15 * 60 * 1000,
  STAFF: 15 * 60 * 1000,
  PASIEN: 45 * 60 * 1000, // 45 menit
  USER: 45 * 60 * 1000,
};

const WARNING_BEFORE_EXPIRY = 60 * 1000; // 60 detik terakhir
const HEARTBEAT_INTERVAL = 10 * 1000; // 10 detik
const SESSION_STORAGE_KEY = 'hafta_tab_active';
const LOCAL_TAB_COUNT_KEY = 'hafta_active_tabs_count';
const LOCAL_LAST_HEARTBEAT_KEY = 'hafta_last_heartbeat';
const REMEMBER_ME_KEY = 'hafta_remember_me';

export function SessionSecurityGuard({
  role,
  userId,
  onForceLogout,
}: {
  role: Role;
  userId: string;
  onForceLogout?: () => void;
}) {
  const router = useRouter();

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State hanya untuk UI visibility dan countdown display
  const [warningVisible, setWarningVisible] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);

  const idleDuration = IDLE_DURATIONS[role] ?? IDLE_DURATIONS.USER;

  const rememberMe =
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem(REMEMBER_ME_KEY));

  // ── Close all slide overs ──
  const closeAllSlideOvers = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hafta:close-all-slide-overs'));
  }, []);

  // ── Force logout ──
  const forceLogout = useCallback(async (reason: 'idle' | 'closed') => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    const message = JSON.stringify({ type: 'FORCE_LOGOUT', reason });
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(message);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('hafta_auth_sync', message);
    }

    closeAllSlideOvers();

    if (onForceLogout) {
      onForceLogout();
    } else {
      await signOut();
      router.push(`/login?reason=${reason}`);
    }
  }, [onForceLogout, router, closeAllSlideOvers]);

  // ── 1. Tab aktif / deteksi tutup browser vs refresh ──
  useEffect(() => {
    const wasTabActive = sessionStorage.getItem(SESSION_STORAGE_KEY) === '1';

    sessionStorage.setItem(SESSION_STORAGE_KEY, '1');

    let activeCount = 0;
    try {
      const stored = localStorage.getItem(LOCAL_TAB_COUNT_KEY);
      activeCount = stored ? parseInt(stored, 10) + 1 : 1;
      localStorage.setItem(LOCAL_TAB_COUNT_KEY, String(activeCount));
      localStorage.setItem(LOCAL_LAST_HEARTBEAT_KEY, String(Date.now()));
    } catch {
      // abaikan
    }

    // Jika tab baru dan tidak ingat perangkat dan heartbeat sudah lama (>15 detik) → logout
    if (!wasTabActive && !rememberMe) {
      const lastHeartbeat = localStorage.getItem(LOCAL_LAST_HEARTBEAT_KEY);
      const now = Date.now();
      const heartbeatTime = lastHeartbeat ? parseInt(lastHeartbeat, 10) : 0;
      const isStale = now - heartbeatTime > 15 * 1000;

      if (isStale) {
        const timer = setTimeout(() => {
          const stillStale =
            sessionStorage.getItem(SESSION_STORAGE_KEY) === '1' &&
            Date.now() - (parseInt(localStorage.getItem(LOCAL_LAST_HEARTBEAT_KEY) ?? '0', 10)) >
              15 * 1000;
          if (stillStale && !rememberMe) {
            forceLogout('closed');
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    // BroadcastChannel untuk sinkronisasi logout antar-tab
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('hafta_auth_sync');
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data?.type === 'FORCE_LOGOUT') {
          closeAllSlideOvers();
          if (onForceLogout) {
            onForceLogout();
          } else {
            router.push(`/login?reason=closed`);
          }
        }
      };
    }

    // Fallback storage event listener
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'hafta_auth_sync' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data?.type === 'FORCE_LOGOUT') {
            closeAllSlideOvers();
            if (onForceLogout) {
              onForceLogout();
            } else {
              router.push(`/login?reason=closed`);
            }
          }
        } catch {
          // abaikan parse error
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Heartbeat setiap 10 detik
    heartbeatRef.current = setInterval(() => {
      localStorage.setItem(LOCAL_LAST_HEARTBEAT_KEY, String(Date.now()));
    }, HEARTBEAT_INTERVAL);

    return () => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      try {
        activeCount = Math.max(0, activeCount - 1);
        localStorage.setItem(LOCAL_TAB_COUNT_KEY, String(activeCount));
      } catch {
        // abaikan
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      window.removeEventListener('storage', handleStorage);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [rememberMe, onForceLogout, forceLogout, closeAllSlideOvers, router]);

  // ── 2. Idle activity listener ──
  // resetIdleTimer disimpan di ref untuk menghindari dependency array effect
  const resetIdleTimerRef = useRef<(() => void) | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setWarningVisible(false);
    setCountdownSeconds(60);

    idleTimeoutRef.current = setTimeout(() => {
      // Masuk ke fase peringatan 60 detik terakhir
      setWarningVisible(true);
      let remaining = 60;
      setCountdownSeconds(remaining);
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setCountdownSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          forceLogout('idle');
        }
      }, 1000);
    }, idleDuration);
  }, [idleDuration, forceLogout]);

  // Sync ref setelah render agar activityHandler selalu pakai versi terbaru
  useEffect(() => {
    resetIdleTimerRef.current = resetIdleTimer;
  }, [resetIdleTimer]);

  const activityHandler = useCallback(() => {
    // Saat warning tampil, aktivitas sembarangan tidak boleh reset timer
    if (warningVisible) return;

    resetIdleTimerRef.current?.();
  }, [warningVisible]);

  useEffect(() => {
    const options: AddEventListenerOptions = { passive: true };
    window.addEventListener('mousedown', activityHandler, options);
    window.addEventListener('keydown', activityHandler, options);
    window.addEventListener('touchstart', activityHandler, options);
    window.addEventListener('scroll', activityHandler, options);

    // Mulai timer idle saat montir (difered untuk menghindari cascading render)
    const timerId = setTimeout(() => resetIdleTimerRef.current?.(), 0);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('mousedown', activityHandler, options);
      window.removeEventListener('keydown', activityHandler, options);
      window.removeEventListener('touchstart', activityHandler, options);
      window.removeEventListener('scroll', activityHandler, options);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [activityHandler]);

  // ── 3. Auto-save draft ke sessionStorage ──
  const saveDraft = useCallback(
    (patientId: string, formData: Record<string, string>) => {
      try {
        const key = `hafta_draft_soap_${patientId}`;
        sessionStorage.setItem(key, JSON.stringify({ ...formData, savedAt: Date.now() }));
      } catch {
        // abaikan
      }
    },
    []
  );

  const loadDraft = useCallback((patientId: string): Record<string, string> | null => {
    try {
      const key = `hafta_draft_soap_${patientId}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback((patientId: string) => {
    try {
      sessionStorage.removeItem(`hafta_draft_soap_${patientId}`);
    } catch {
      // abaikan
    }
  }, []);

  // Expose draft functions via window for drawer components
  useEffect(() => {
    (window as any).__hafta_draft__ = { saveDraft, loadDraft, clearDraft };
    return () => {
      delete (window as any).__hafta_draft__;
    };
  }, [saveDraft, loadDraft, clearDraft]);

  // ── 5. Warning Modal ──
  // Selalu di-mount untuk menghindari unmount/remount flicker;
  // visibilitas dikontrol melalui CSS opacity + pointer-events
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200 ease-in-out',
          warningVisible
            ? 'opacity-100 pointer-events-auto bg-[#181700]/45 backdrop-blur-[2px]'
            : 'opacity-0 pointer-events-none',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Peringatan sesi akan berakhir"
        aria-hidden={!warningVisible}
      >
        <div
          className={cn(
            'rounded-3xl bg-white border border-stone-200/90 p-6 shadow-2xl max-w-md w-full mx-4 sm:mx-0 transition-all duration-200 ease-in-out',
            warningVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4',
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-11 w-11 aspect-square items-center justify-center rounded-full bg-[var(--hafta-ylw-100)] text-[#181700] shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#181700] text-center">
              Sesi Akan Segera Berakhir
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed">
              Tidak ada aktivitas terdeteksi. Demi keamanan data rekam medis, akun akan keluar otomatis dalam:
            </p>
            <div className="flex items-center gap-2 text-2xl font-mono font-bold text-[#181700]">
              <span>{countdownSeconds}</span>
              <span className="text-sm">detik</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 w-full pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setWarningVisible(false);
                setCountdownSeconds(60);
                if (countdownRef.current) clearInterval(countdownRef.current);
                countdownRef.current = null;
                resetIdleTimerRef.current?.();
              }}
              className="h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all flex-1 shrink-0"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Tetap Masuk
            </button>
            <button
              type="button"
              onClick={() => forceLogout('idle')}
              className="h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all flex-1 shrink-0"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Keluar Sekarang
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
