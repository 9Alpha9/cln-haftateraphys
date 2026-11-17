import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'numbered'; items: readonly string[] }
  | { type: 'definition'; items: readonly { term: string; description: string }[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocumentProps = {
  sections: readonly LegalSection[];
  /** Tanggal berlaku efektif, format "1 November 2026". */
  effectiveDate: string;
  /** Tanggal pembaruan terakhir, format "16 November 2026". */
  updatedDate: string;
  /** Ringkasan singkat di bawah judul. */
  summary: string;
  /** Tautan silang ke dokumen legal lain. */
  relatedLink?: { href: string; label: string };
  contactNote: string;
  /** Catatan tambahan di atas kanal kontak, mis. alamat domisili dan syarat permintaan. */
  contactDetail?: string;
  /** Judul dokumen, mis. "Kebijakan Privasi". */
  title?: string;
};

const CONTACT_WHATSAPP =
  'https://wa.me/6281232932872?text=Halo%20Admin%20Hafta%20Fisioterapi,%20saya%20ingin%20menanyakan%20hal%20terkait%20kebijakan%20Hafta.';

/**
 * Render dokumen legal statis (kebijakan privasi, syarat layanan, dll.) dengan daftar isi otomatis.
 * Server component: tidak ada state maupun interaksi klien selain tautan.
 */
export function LegalDocument({
  sections,
  effectiveDate,
  updatedDate,
  summary,
  relatedLink,
  contactNote,
  contactDetail,
  title,
}: LegalDocumentProps) {
  return (
    <article className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-white p-6 md:p-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground">
          Berlaku {effectiveDate}
        </span>
        <span aria-hidden="true">&middot;</span>
        <span>Diperbarui {updatedDate}</span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{summary}</p>

      {relatedLink ? (
        <Link
          href={relatedLink.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {relatedLink.label}
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}

      {/* Daftar isi membantu pengguna di mobile karena dokumen legal panjang. */}
      {sections.length > 4 ? (
        <nav aria-label="Daftar isi" className="mt-7 rounded-xl border border-border bg-surface/70 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">Daftar isi</h2>
          <ol className="mt-2.5 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id} className="flex gap-2">
                <span className="tabular-nums text-xs text-muted-foreground/70">{index + 1}.</span>
                <a
                  href={`#${section.id}`}
                  className="rounded underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="mt-8 space-y-8">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="flex gap-2 text-lg font-semibold tracking-tight text-foreground">
              <span className="tabular-nums text-muted-foreground/60">{index + 1}.</span>
              <span>{section.title}</span>
            </h2>
            <div className="mt-2 space-y-3 pl-0 text-sm leading-relaxed text-muted-foreground sm:pl-6">
              {section.blocks.map((block, blockIndex) => {
                if (block.type === 'paragraph') {
                  return <p key={blockIndex}>{block.text}</p>;
                }
                if (block.type === 'list') {
                  return (
                    <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground/50">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === 'numbered') {
                  return (
                    <ol key={blockIndex} className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground/50">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  );
                }
                return (
                  <dl key={blockIndex} className="space-y-3">
                    {block.items.map((item) => (
                      <div key={item.term}>
                        <dt className="font-semibold text-foreground">{item.term}</dt>
                        <dd className="mt-0.5">{item.description}</dd>
                      </div>
                    ))}
                  </dl>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section id="kontak" className="mt-9 scroll-mt-24 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Pertanyaan dan permintaan terkait kebijakan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contactNote}</p>
        {contactDetail ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contactDetail}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={CONTACT_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp admin
          </a>
          <Link
            href="/kontak"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Halaman kontak
          </Link>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Kami menanggapi permintaan terkait data pribadi paling lama 14 (empat belas) hari kerja setelah identitas
          pemohon diverifikasi sesuai ketentuan pelindungan data pribadi yang berlaku. Permintaan yang memerlukan
          pemeriksaan lintas tim dapat membutuhkan waktu tambahan, dan kami akan menyampaikan perkiraan waktunya.
        </p>
      </section>
    </article>
  );
}
