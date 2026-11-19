'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SmartFilterMenu } from '@/components/ui/smart-filter-menu';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPE_LABELS, type DocumentView } from '@/lib/documents';
import { removeOwnDocument, uploadDocument } from '@/server/actions/documents';

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

/**
 * Jenis pratinjau mengikuti file yang diunggah: gambar ditampilkan utuh, PDF dan
 * dokumen teks memakai viewer browser, sedangkan format lain (mis. DOCX/XLSX)
 * hanya bisa diunduh karena browser tidak punya penampil bawaan.
 */
function previewKind(mimeType: string): 'image' | 'frame' | 'unsupported' {
  if (mimeType.startsWith('image/')) return 'image';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    return 'frame';
  }
  return 'unsupported';
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
  const [fileKind, setFileKind] = useState<'ALL' | 'PHOTO' | 'DOCUMENT'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<DocumentView | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<{ id: string; message: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentView | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isPhoto = (mimeType: string) => mimeType.startsWith('image/');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (typeFilter !== 'ALL' && document.documentType !== typeFilter) return false;
      if (fileKind === 'PHOTO' && !isPhoto(document.mimeType)) return false;
      if (fileKind === 'DOCUMENT' && isPhoto(document.mimeType)) return false;
      if (!query) return true;
      return (
        (document.originalFilename ?? '').toLowerCase().includes(query) ||
        document.patientName.toLowerCase().includes(query) ||
        (document.medicalRecordNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [documents, search, typeFilter, fileKind]);

  const photoCount = useMemo(
    () => documents.filter((document) => isPhoto(document.mimeType)).length,
    [documents],
  );
  const documentCount = documents.length - photoCount;

  // Paginasi sisi klien: 6–8 berkas per halaman agar daftar tetap ringkas.
  const activeFilterCount =
    (fileKind !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedDocuments = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function applyFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    setSelectedFiles(files);
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      files.forEach((file) => transfer.items.add(file));
      fileInputRef.current.files = transfer.files;
    }
  }

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

    setUploadProgress(0);
    setUploadErrors([]);
    // Server actions don't expose byte-level progress, so show a smooth
    // indeterminate-style ramp up to 90% while the upload is in flight.
    let simulated = 0;
    const progressTimer = window.setInterval(() => {
      simulated = Math.min(90, simulated + Math.max(2, Math.round((92 - simulated) / 8)));
      setUploadProgress(simulated);
    }, 220);

    startTransition(async () => {
      let success = 0;
      const failures: string[] = [];

      try {
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
      } finally {
        window.clearInterval(progressTimer);
        setUploadProgress(100);
        window.setTimeout(() => setUploadProgress(null), 700);
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
        setUploadErrors(failures);
        showToast('error', failures[0] ?? 'Sebagian dokumen gagal diunggah.');
      }
    });
  }

  async function handleDownload(document: DocumentView) {
    setDownloadId(document.id);
    setDownloadProgress(0);
    setDownloadError(null);
    try {
      const response = await fetch(`/api/documents/${document.id}`);
      if (!response.ok) {
        throw new Error('Dokumen tidak dapat diunduh.');
      }

      const total = Number(response.headers.get('content-length') ?? 0);
      const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
      const reader = response.body?.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
          }
          setDownloadProgress((current) => {
            if (total > 0) return Math.min(99, Math.round((received / total) * 100));
            return Math.min(95, current + 4);
          });
        }
      } else {
        chunks.push(await response.blob());
      }

      const blob = new Blob(chunks, { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalFilename ?? 'dokumen';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setDownloadProgress(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunduh dokumen.';
      setDownloadError({ id: document.id, message });
      showToast('error', message);
    } finally {
      window.setTimeout(() => {
        setDownloadId(null);
        setDownloadProgress(0);
      }, 700);
    }
  }

  async function handlePreview(document: DocumentView) {
    setPreviewDoc(document);
    setPreviewStatus('loading');
    setPreviewError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    try {
      const response = await fetch(`/api/documents/${document.id}`);
      if (!response.ok) throw new Error('Dokumen tidak dapat dibuka.');
      const blob = await response.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewStatus('ready');
    } catch (error) {
      setPreviewStatus('error');
      setPreviewError(error instanceof Error ? error.message : 'Gagal membuka dokumen.');
    }
  }

  function closePreview(open: boolean) {
    if (open) return;
    setPreviewDoc(null);
    setPreviewStatus('idle');
    setPreviewError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  function handleDelete(document: DocumentView) {
    startTransition(async () => {
      const result = await removeOwnDocument(document.id);
      if (result.ok) {
        showToast('success', 'Dokumen dihapus.');
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
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari nama file, pasien, atau No. RM"
            aria-label="Cari dokumen"
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--hafta-950)] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35 sm:text-[13px]"
          />
        </div>
        <SmartFilterMenu
          label="Filter"
          aria-label="Filter dokumen"
          count={activeFilterCount}
          className="w-full sm:w-auto"
          panelClassName="flex w-64 flex-col overflow-hidden p-0"
        >
          {(close) => (
            <>
              <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto p-2">
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Jenis berkas
              </p>
              {[
                { key: 'ALL' as const, label: 'Semua', count: documents.length },
                { key: 'PHOTO' as const, label: 'Foto', count: photoCount },
                { key: 'DOCUMENT' as const, label: 'Dokumen', count: documentCount },
              ].map((option) => {
                const selected = fileKind === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setFileKind(option.key);
                      setPage(1);
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors sm:text-[13px]',
                      selected
                        ? 'border-border bg-[var(--hafta-50)] font-bold text-foreground'
                        : 'border-transparent font-medium text-muted-foreground hover:bg-[var(--hafta-50)] hover:text-foreground',
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                      {option.count}
                    </span>
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> : null}
                  </button>
                );
              })}

              <div className="my-1.5 h-px bg-border" />

              <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Jenis dokumen
              </p>
              {TYPE_OPTIONS.map((option) => {
                const selected = typeFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTypeFilter(option.value);
                      setPage(1);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors sm:text-[13px]',
                      selected
                        ? 'border-border bg-[var(--hafta-50)] font-bold text-foreground'
                        : 'border-transparent font-medium text-muted-foreground hover:bg-[var(--hafta-50)] hover:text-foreground',
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> : null}
                  </button>
                );
              })}

              </div>
              <div className="shrink-0 border-t border-border p-2">
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
                >
                  Terapkan
                </button>
              </div>
            </>
          )}
        </SmartFilterMenu>
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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-foreground">
            {fileKind === 'PHOTO' ? <ImageIcon className="h-7 w-7" /> : <Paperclip className="h-7 w-7" />}
          </span>
          <p className="mt-4 text-sm font-bold text-foreground">
            {documents.length === 0
              ? 'Belum ada dokumen'
              : fileKind === 'PHOTO'
                ? 'Belum ada foto'
                : fileKind === 'DOCUMENT'
                  ? 'Belum ada dokumen berkas'
                  : 'Tidak ada berkas yang cocok'}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {documents.length === 0
              ? 'Dokumen pendukung pasien seperti hasil pemeriksaan atau surat rujukan akan tampil di sini.'
              : 'Ubah kata kunci, jenis berkas, atau filter jenis dokumen.'}
          </p>
          {canUpload && documents.length === 0 ? (
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
        <>
          <p className="text-[11px] text-muted-foreground">
            Menampilkan {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} dari {filtered.length} berkas
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {pagedDocuments.map((document) => (
              <div key={document.id} className="relative">
                <button
                  type="button"
                  onClick={() => void handlePreview(document)}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-[var(--hafta-300)] hover:bg-[var(--hafta-50)]/40 focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35',
                    canUpload || canArchive ? 'pr-14' : '',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F1] text-foreground">
                    <DocumentIcon mimeType={document.mimeType} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                      {document.originalFilename ?? 'Dokumen'}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                      {document.patientName}
                      {document.medicalRecordNumber ? ` · ${document.medicalRecordNumber}` : ''}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {formatSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                      {document.uploadedByName ? ` · ${document.uploadedByName}` : ''}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}
                      </span>
                      {document.patientVisible ? (
                        <span className="rounded-full bg-[var(--hafta-grn-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hafta-grn-700)]">
                          Terlihat pasien
                        </span>
                      ) : null}
                      {document.status === 'ARCHIVED' ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Arsip
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>

                {canUpload || canArchive ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setArchiveTarget(document);
                    }}
                    aria-label={`Hapus ${document.originalFilename ?? 'dokumen'}`}
                    title="Hapus dokumen"
                    className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <PaginationBar
              page={safePage}
              pageCount={pageCount}
              pageSize={pageSize}
              pageSizeOptions={[6, 8]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadErrors([]);
          }
        }}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-border p-5 text-left">
            <DialogTitle className="text-base font-bold text-foreground">Unggah Dokumen</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
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
              <Label htmlFor="document-file">Berkas</Label>
              <label
                htmlFor="document-file"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  applyFiles(event.dataTransfer.files);
                }}
                className="flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-[var(--hafta-50)]/40 px-4 py-4 text-center transition-colors hover:bg-[var(--hafta-50)] focus-within:border-[var(--hafta-950)] focus-within:ring-4 focus-within:ring-[var(--hafta-300)]/35"
              >
                <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">
                  Pilih berkas atau lepaskan di sini
                </span>
                <span className="text-[10px] leading-relaxed text-muted-foreground">
                  PDF, JPG, PNG, WEBP · maks. 10 MB per berkas · boleh lebih dari satu
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="document-file"
                name="file"
                type="file"
                multiple
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => applyFiles(event.target.files)}
                className="sr-only"
              />

              {selectedFiles.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-2">
                  <ul className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 text-[11px] text-muted-foreground"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="shrink-0 tabular-nums">{formatSize(file.size)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => applyFiles(null)}
                    className="mt-1.5 inline-flex h-7 cursor-pointer items-center rounded-full px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Batalkan pilihan
                  </button>
                </div>
              ) : null}

              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Berkas tersimpan di arsip dokumen pasien. Untuk melampirkan foto ke{' '}
                <strong>PDF rekam medis</strong>, unggah lewat form rekam medis (Edit →{' '}
                <em>Foto Analisa / Hasil Pemeriksaan</em>).
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-[#FAFAF8] p-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="patientVisible"
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>Tampilkan dokumen ini di portal pasien (opsional).</span>
            </label>

            {uploadErrors.length > 0 && uploadProgress === null ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Sebagian file gagal diunggah
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {uploadErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {uploadProgress !== null ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Mengunggah dokumen…</span>
                  <span className="tabular-nums">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            ) : null}
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

      <Dialog open={Boolean(previewDoc)} onOpenChange={closePreview}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[96dvh] w-[96vw] max-w-[1400px] flex-col gap-0 overflow-hidden p-0 sm:h-[94vh] sm:rounded-xl sm:p-0"
        >
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-2 pr-2.5 text-left sm:px-5">
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-bold leading-tight text-foreground">
                {previewDoc?.originalFilename ?? 'Dokumen'}
              </DialogTitle>
              <DialogDescription className="truncate text-[11px] leading-snug text-muted-foreground">
                {previewDoc
                  ? `${DOCUMENT_TYPE_LABELS[previewDoc.documentType] ?? previewDoc.documentType} · ${previewDoc.patientName} · ${previewDoc.sizeBytes ? formatSize(previewDoc.sizeBytes) : ''}`
                  : ''}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {canArchive && previewDoc && previewDoc.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = previewDoc;
                    closePreview(false);
                    setArchiveTarget(target);
                  }}
                  aria-label="Hapus dokumen"
                  title="Hapus dokumen"
                  className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
              {/* Tombol Unduh hanya perlu saat dokumen tidak punya toolbar viewer
                  sendiri. PDF/teks di dalam iframe sudah menyediakan unduh. */}
              {previewDoc && previewKind(previewDoc.mimeType) !== 'frame' ? (
                <button
                  type="button"
                  onClick={() => void handleDownload(previewDoc)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </button>
              ) : null}
              <DialogClose
                aria-label="Tutup pratinjau dokumen"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
              >
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden bg-stone-100">
            {previewStatus === 'loading' ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Memuat dokumen…
              </div>
            ) : previewStatus === 'error' ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-red-600">
                <AlertCircle className="h-6 w-6" />
                {previewError ?? 'Gagal membuka dokumen.'}
              </div>
            ) : previewUrl && previewDoc ? (
              previewKind(previewDoc.mimeType) === 'image' ? (
                <div className="flex h-full items-center justify-center overflow-auto p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={previewDoc.originalFilename ?? 'Dokumen'}
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                </div>
              ) : previewKind(previewDoc.mimeType) === 'frame' ? (
                <iframe
                  src={previewUrl}
                  title={previewDoc.originalFilename ?? 'Dokumen'}
                  className="h-full w-full border-0 bg-white"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    Pratinjau tidak tersedia untuk jenis file ini
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {previewDoc.mimeType || 'Format tidak dikenal'} tidak dapat ditampilkan di
                    browser. Unduh dokumen untuk membukanya.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDownload(previewDoc)}
                    className="mt-2 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh Dokumen
                  </button>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Hapus dokumen?"
        description={
          archiveTarget
            ? `"${archiveTarget.originalFilename ?? 'Dokumen'}" akan dihapus dari daftar dan tidak dapat diunduh lagi.`
            : undefined
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="destructive"
        pending={pending}
        onConfirm={() => archiveTarget && handleDelete(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
      />

      <p className={cn('text-[10px] leading-relaxed text-muted-foreground')}>
        Semua unggahan dan unduhan dokumen dicatat pada log audit. Jangan mengunggah dokumen yang
        tidak relevan dengan layanan pasien.
      </p>
    </div>
  );
}
