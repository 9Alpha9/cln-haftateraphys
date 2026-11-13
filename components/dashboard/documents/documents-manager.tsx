'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Download,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Search,
  Upload,
} from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPE_LABELS, type DocumentView } from '@/lib/documents';
import { archiveDocument, uploadDocument } from '@/server/actions/documents';

type PatientOption = { id: string; label: string };

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Semua jenis' },
  ...Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DocumentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

export function DocumentsManager({
  documents,
  patientOptions,
  canUpload,
  canDownload,
  canArchive,
  storageReady,
}: {
  documents: DocumentView[];
  patientOptions: PatientOption[];
  canUpload: boolean;
  canDownload: boolean;
  canArchive: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<DocumentView | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (typeFilter !== 'ALL' && document.documentType !== typeFilter) return false;
      if (!query) return true;
      return (
        (document.originalFilename ?? '').toLowerCase().includes(query) ||
        document.patientName.toLowerCase().includes(query) ||
        (document.medicalRecordNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [documents, search, typeFilter]);

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const patientId = String(formData.get('patientId') ?? '');
    const documentType = String(formData.get('documentType') ?? 'OTHER');
    const patientVisible = formData.get('patientVisible') === 'on';
    const files = formData
      .getAll('file')
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      showToast('error', 'Pilih minimal satu file.');
      return;
    }

    startTransition(async () => {
      let success = 0;
      const failures: string[] = [];

      for (const file of files) {
        const payload = new FormData();
        payload.set('patientId', patientId);
        payload.set('documentType', documentType);
        if (patientVisible) payload.set('patientVisible', 'on');
        payload.set('file', file);

        const result = await uploadDocument(payload);
        if (result.ok) {
          success += 1;
        } else {
          failures.push(`${file.name}: ${result.error}`);
        }
      }

      if (success > 0) {
        showToast(
          'success',
          success === 1 ? 'Dokumen berhasil diunggah.' : `${success} dokumen berhasil diunggah.`,
        );
        setUploadOpen(false);
        form.reset();
        router.refresh();
      }
      if (failures.length > 0) {
        showToast('error', failures[0] ?? 'Sebagian dokumen gagal diunggah.');
      }
    });
  }

  function handleArchive(document: DocumentView) {
    startTransition(async () => {
      const result = await archiveDocument(document.id);
      if (result.ok) {
        showToast('success', 'Dokumen diarsipkan.');
        setArchiveTarget(null);
        router.refresh();
      } else {
        showToast('error', result.error);
      }
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {!storageReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          Penyimpanan dokumen (Cloudflare R2) belum dikonfigurasi. Unggah dokumen dinonaktifkan
          sampai environment `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, dan
          `R2_BUCKET_NAME` diisi.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama file, pasien, atau No. RM"
            aria-label="Cari dokumen"
            className="h-10 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-3 text-xs text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35 sm:text-[13px]"
          />
        </div>
        <div className="w-full sm:w-52">
          <AppSelect
            aria-label="Filter jenis dokumen"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
          />
        </div>
        {canUpload ? (
          <Button
            type="button"
            onClick={() => setUploadOpen(true)}
            disabled={!storageReady}
            className="h-10 shrink-0 gap-2 px-4 text-xs font-bold"
          >
            <Upload className="h-4 w-4" />
            Unggah Dokumen
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white px-5 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
            <Paperclip className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-bold text-[#181700]">Belum ada dokumen</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
            Dokumen pendukung pasien seperti hasil pemeriksaan atau surat rujukan akan tampil di
            sini.
          </p>
          {canUpload ? (
            <Button
              type="button"
              onClick={() => setUploadOpen(true)}
              disabled={!storageReady}
              className="mt-5 h-10 gap-2 px-4 text-xs font-bold"
            >
              <Upload className="h-4 w-4" />
              Unggah Dokumen
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((document) => (
            <article
              key={document.id}
              className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F1] text-[#181700]">
                  <DocumentIcon mimeType={document.mimeType} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#181700]">
                      {document.originalFilename ?? 'Dokumen'}
                    </p>
                    <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}
                    </span>
                    {document.patientVisible ? (
                      <span className="rounded-full bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-grn-700)]">
                        Terlihat pasien
                      </span>
                    ) : null}
                    {document.status === 'ARCHIVED' ? (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                        Arsip
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-stone-500">
                    {document.patientName}
                    {document.medicalRecordNumber ? ` · ${document.medicalRecordNumber}` : ''}
                    {' · '}
                    {formatSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                    {document.uploadedByName ? ` · ${document.uploadedByName}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {canDownload && document.status === 'ACTIVE' ? (
                  <a
                    href={`/api/documents/${document.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh
                  </a>
                ) : null}
                {canArchive && document.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => setArchiveTarget(document)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Arsipkan
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-stone-100 p-5 text-left">
            <DialogTitle className="text-base font-bold text-[#181700]">Unggah Dokumen</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Dokumen disimpan privat dan hanya dapat diakses sesuai kewenangan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Pasien</Label>
              <AppSelect
                name="patientId"
                required
                placeholder="Pilih pasien"
                options={patientOptions.map((patient) => ({
                  value: patient.id,
                  label: patient.label,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis Dokumen</Label>
              <AppSelect
                name="documentType"
                placeholder="Pilih jenis"
                defaultValue="OTHER"
                options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-file">File (bisa lebih dari satu)</Label>
              <input
                id="document-file"
                name="file"
                type="file"
                multiple
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="flex min-h-11 w-full cursor-pointer items-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[var(--hafta-org-100)] file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-[#181700]"
              />
              <p className="text-[10px] text-stone-400">
                PDF/JPG/PNG/WEBP · maksimal 10 MB per file · pilih beberapa file sekaligus.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-[#FAFAF8] p-3 text-xs text-stone-600">
              <input
                type="checkbox"
                name="patientVisible"
                className="mt-0.5 h-4 w-4 rounded border-stone-300"
              />
              <span>Izinkan pasien melihat dokumen ini di portal (opsional).</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={pending}
                className="h-10 px-4 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending} className="h-10 px-4 text-xs font-bold">
                {pending ? 'Mengunggah…' : 'Unggah'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Arsipkan dokumen?"
        description={
          archiveTarget
            ? `"${archiveTarget.originalFilename ?? 'Dokumen'}" akan diarsipkan dan tidak dapat diunduh lagi.`
            : undefined
        }
        confirmLabel="Arsipkan"
        cancelLabel="Batal"
        variant="destructive"
        pending={pending}
        onConfirm={() => archiveTarget && handleArchive(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
      />

      <p className={cn('text-[10px] leading-relaxed text-stone-400')}>
        Semua unggahan dan unduhan dokumen dicatat pada log audit. Jangan mengunggah dokumen yang
        tidak relevan dengan layanan pasien.
      </p>
    </div>
  );
}
