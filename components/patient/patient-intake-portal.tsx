'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, FilePlus2, Loader2, PencilLine } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { NotchedCard } from '@/components/ui/notched-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { PatientIntakeForm } from '@/components/patient/patient-intake-form';
import {
  INTAKE_STATUS_META,
  PatientIntakeSummaryContent,
  intakeToFormValues,
  type PatientIntakeHistoryItem,
} from '@/components/patient/patient-intake-summary';
import { startNewPatientIntake } from '@/server/actions/patient-intakes';

type Mode = 'view' | 'edit' | 'new';

function formatDate(value: Date | null) {
  if (!value) return 'Belum dikirim';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const EDITABLE_STATUSES = new Set<PatientIntakeHistoryItem['status']>([
  'DRAFT',
  'NEEDS_REVISION',
  'SUBMITTED',
  'UNDER_REVIEW',
]);

export function PatientIntakePortal({ history }: { history: PatientIntakeHistoryItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [activeIntake, setActiveIntake] = useState<PatientIntakeHistoryItem | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [isOpen, setIsOpen] = useState(false);
  const [showNewEpisodeConfirm, setShowNewEpisodeConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosingAfterSave, setIsClosingAfterSave] = useState(false);

  const current = history[0] ?? null;
  const canStartEpisode = !current || current.status === 'ACCEPTED' || current.status === 'ARCHIVED';

  function openSummary(intake: PatientIntakeHistoryItem) {
    setActiveIntake(intake);
    setMode('view');
    setIsOpen(true);
  }

  function openEditor(intake: PatientIntakeHistoryItem | null) {
    setActiveIntake(intake);
    setMode(intake ? 'edit' : 'new');
    setIsOpen(true);
  }

  function closeDrawer() {
    if ((mode === 'edit' || mode === 'new') && !isClosingAfterSave) {
      setShowCloseConfirm(true);
      return;
    }
    setIsOpen(false);
    setMode('view');
    setIsClosingAfterSave(false);
  }

  function handleSaved() {
    setIsClosingAfterSave(true);
    closeDrawer();
  }

  function handleCloseConfirm() {
    setShowCloseConfirm(false);
    setIsOpen(false);
    setMode('view');
  }

  function createNewEpisode() {
    startTransition(async () => {
      const result = await startNewPatientIntake();
      setShowNewEpisodeConfirm(false);

      if (!result.success) {
        if (result.reason === 'STILL_IN_REVIEW') {
          showToast('error', 'Form awal Anda masih ditinjau. Tunggu hingga proses tinjauan selesai.');
        } else if (result.reason === 'HAS_ACTIVE_DRAFT') {
          showToast('error', 'Selesaikan terlebih dahulu form yang masih berstatus draft.');
        } else {
          showToast('error', 'Episode keluhan baru belum dapat dibuat saat ini.');
        }
        return;
      }

      showToast('success', 'Episode keluhan baru dibuat. Silakan isi form berikutnya.');
      router.refresh();
      setActiveIntake(null);
      setMode('new');
      setIsOpen(true);
    });
  }

  if (!current) {
    return (
      <div className="space-y-6">
        <NotchedCard
          variant="accent"
          icon={ClipboardList}
          badge="Langkah pertama"
          title="Ceritakan keluhan awal Anda"
          description="Isi Form Keluhan Awal sebelum sesi asesmen di klinik. Fisioterapis akan menggunakan informasi ini untuk menyiapkan pemeriksaan yang tepat."
          buttonText="Mulai Isi Form Awal"
          onClick={() => openEditor(null)}
          showRings
        />

        <IntakeDrawer
          isOpen={isOpen}
          onClose={closeDrawer}
          onSaved={handleSaved}
          activeIntake={activeIntake}
          mode={mode}
          onEdit={() => setMode('edit')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#181700]">Form Awal Aktif</h2>
          <p className="mt-1 text-sm text-stone-500">
            Satu form mewakili satu episode keluhan. Perbarui jawaban yang sama bila ada informasi tambahan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <NotchedCard
            variant={current.status === 'ACCEPTED' ? 'white' : 'accent'}
            icon={ClipboardList}
            badge={INTAKE_STATUS_META[current.status].label}
            title={current.chiefComplaint || 'Form Awal'}
            description={`${INTAKE_STATUS_META[current.status].description} Terakhir diperbarui ${formatDate(current.updatedAt)}.`}
            buttonText={
              current.status === 'DRAFT' || current.status === 'NEEDS_REVISION'
                ? 'Lanjutkan Form Awal'
                : current.status === 'SUBMITTED' || current.status === 'UNDER_REVIEW'
                  ? 'Lihat Data Terkirim'
                  : 'Buka Ringkasan'
            }
            onClick={() =>
              current.status === 'DRAFT' || current.status === 'NEEDS_REVISION'
                ? openEditor(current)
                : openSummary(current)
            }
            showRings
          />

          <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#181700]">Ringkasan episode</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                <dt className="text-stone-500">Area keluhan</dt>
                <dd className="max-w-[60%] text-right font-semibold text-[#181700]">
                  {current.affectedArea || '-'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                <dt className="text-stone-500">Tujuan terapi</dt>
                <dd className="max-w-[60%] text-right font-semibold text-[#181700]">
                  {current.patientGoal || '-'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-stone-500">Versi form</dt>
                <dd className="font-semibold text-[#181700]">Ke-{current.version}</dd>
              </div>
            </dl>
            {current.reviewMessage ? (
              <p className="mt-4 rounded-xl bg-[var(--hafta-red-50)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--hafta-red-700)]">
                {current.reviewMessage}
              </p>
            ) : null}
          </div>
        </div>

        {canStartEpisode ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#181700]">Punya keluhan baru di area berbeda?</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Ajukan episode baru agar riwayat keluhan sebelumnya tetap tersimpan sebagai referensi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewEpisodeConfirm(true)}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)]"
            >
              <FilePlus2 className="h-4 w-4" />
              Ajukan Keluhan Baru (Episode Baru)
            </button>
          </div>
        ) : null}
      </section>

      {history.length > 1 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-[#181700]">Riwayat Form Awal</h2>
            <p className="mt-1 text-sm text-stone-500">
              Semua form yang pernah Anda kirim, termasuk episode keluhan sebelumnya.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {history.slice(1).map((intake) => (
              <NotchedCard
                key={intake.id}
                variant="white"
                icon={ClipboardList}
                badge={INTAKE_STATUS_META[intake.status].label}
                title={intake.affectedArea || `Form Awal versi ${intake.version}`}
                description={`${intake.chiefComplaint || 'Tidak ada ringkasan keluhan.'} Dikirim ${formatDate(intake.submittedAt)}.`}
                buttonText="Buka Ringkasan"
                onClick={() => openSummary(intake)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <IntakeDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        onSaved={handleSaved}
        activeIntake={activeIntake}
        mode={mode}
        onEdit={() => setMode('edit')}
      />

      <ConfirmDialog
        isOpen={showNewEpisodeConfirm}
        title="Ajukan Keluhan Baru?"
        description="Gunakan formulir ini hanya jika Anda ingin berkonsultasi untuk area cedera atau keluhan baru yang berbeda dari program terapi Anda saat ini. Form sebelumnya tetap tersimpan sebagai riwayat."
        confirmLabel={pending ? 'Membuat...' : 'Ya, Ajukan Episode Baru'}
        pending={pending}
        onConfirm={createNewEpisode}
        onCancel={() => setShowNewEpisodeConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Batalkan Pengisian Form?"
        description="Anda memiliki isian form yang belum disimpan. Jika batal, data yang telah Anda isi akan hilang dan tidak akan dikirimkan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tetap Isi Form"
        variant="destructive"
        onConfirm={handleCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}

function IntakeDrawer({
  isOpen,
  onClose,
  onSaved,
  activeIntake,
  mode,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  activeIntake: PatientIntakeHistoryItem | null;
  mode: Mode;
  onEdit: () => void;
}) {
  const editing = mode === 'edit' || mode === 'new';
  const editable = !activeIntake || EDITABLE_STATUSES.has(activeIntake.status);
  const [formFooterNode, setFormFooterNode] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!isOpen || !editing) {
      setFormFooterNode(null);
    }
  }, [isOpen, editing]);

  if (mode === 'view' && activeIntake) {
    return (
      <GlobalSlideOver
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        icon={<ClipboardList className="h-5 w-5" />}
        title="Form Awal"
        subtitle={`Versi ${activeIntake.version} · ${INTAKE_STATUS_META[activeIntake.status].label}`}
        badge={
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${INTAKE_STATUS_META[activeIntake.status].tone}`}>
            {INTAKE_STATUS_META[activeIntake.status].label}
          </span>
        }
        footer={
          editable ? (
            <button
              type="button"
              onClick={onEdit}
              className="w-full h-11 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all px-5"
            >
              <PencilLine className="h-4 w-4" />
              Perbarui Jawaban
            </button>
          ) : undefined
        }
      >
        <PatientIntakeSummaryContent intake={activeIntake} />
      </GlobalSlideOver>
    );
  }

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<ClipboardList className="h-5 w-5" />}
      title={
        mode === 'new'
          ? 'Form Keluhan Baru'
          : activeIntake?.status === 'DRAFT'
            ? 'Lanjutkan Form Awal'
            : 'Perbarui Form Awal'
      }
      subtitle={
        mode === 'new'
          ? 'Episode keluhan baru'
          : 'Perubahan akan dikirim ulang untuk ditinjau fisioterapis'
      }
      footer={formFooterNode}
    >
      {editing ? (
        <PatientIntakeForm
          key={activeIntake?.id ?? 'new-intake'}
          status={mode === 'new' ? null : activeIntake?.status ?? null}
          initialValues={activeIntake ? intakeToFormValues(activeIntake) : null}
          onSaved={onSaved}
          onFooterChange={setFormFooterNode}
          showStartNewAction={false}
        />
      ) : (
        <div className="flex min-h-48 items-center justify-center text-stone-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </GlobalSlideOver>
  );
}
