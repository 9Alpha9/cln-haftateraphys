---
title: Hafta Fisioterapi Landing Page Specification
version: 0.3.0
status: implementation-ready-with-content-placeholders
last_updated: 2026-08-12
source_of_truth_for:
  - public-homepage
  - public-navigation
  - landing-page-components
  - landing-page-content-states
---

# Landing Page Specification

> **UI implementation contract:** read `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, and `docs/MOBILE-FIRST-STRATEGY.md`. Build and pass the mobile version first; desktop enhancement is not allowed before Mobile Gate passes.


## 1. Purpose

Landing page Hafta Fisioterapi adalah public acquisition layer sekaligus pintu masuk menuju Patient Portal. Halaman harus membangun kepercayaan, menjelaskan alur layanan secara mudah, mengarahkan calon pasien ke kanal konsultasi/booking yang disetujui Hafta, dan memberi akses jelas ke login/register.

Landing page tidak boleh membuat diagnosis otomatis, menjanjikan hasil klinis, atau mengubah konten edukasi Instagram menjadi klaim layanan resmi tanpa validasi client.

## 2. Primary audiences

- calon pasien baru;
- pasien aktif yang ingin masuk Patient Portal;
- keluarga/pengantar pasien yang mencari informasi layanan;
- calon partner/referral source yang ingin memahami Hafta;
- user yang datang dari Instagram.

## 3. Page goals

### LP-G01 — Trust
User memahami siapa Hafta, apa pendekatannya, dan bagaimana menghubungi Hafta.

### LP-G02 — Clarity
User memahami proses umum dari registrasi/konsultasi sampai evaluasi tanpa terminology klinis berlebihan.

### LP-G03 — Conversion
User memiliki CTA jelas untuk konsultasi/booking atau masuk ke Patient Portal.

### LP-G04 — Portal awareness
User memahami bahwa website tidak hanya company profile; pasien dapat memiliki portal untuk data dan history yang memang diizinkan.

### LP-G05 — Privacy-aware acquisition
Tidak ada data kesehatan sensitif dikumpulkan langsung dari landing page selain melalui flow resmi yang authenticated/approved.

## 4. Route

```text
/
```

## Design direction for this page

Visual references:

```text
assets/design-references/01-layout-reference.png       # inspiration only
assets/design-references/02-hafta-landing-direction.png # approved Hafta direction
assets/design-references/03-hafta-design-system-board.png # token/component board
```

Rules:

- preserve the approved emerald/teal/sage/off-white/yellow-accent visual language;
- use `docs/DESIGN-SYSTEM.md` for exact tokens;
- treat all text/data inside images as placeholders unless canonical docs confirm it;
- do not clone the original reference 1:1;
- implement mobile hierarchy first, then translate the wide mockup into desktop composition only after Mobile Gate.

Mobile landing composition is defined in `docs/MOBILE-FIRST-STRATEGY.md`.

## 5. Navigation

### Desktop navigation

Order recommended:

1. Beranda
2. Layanan
3. Proses Terapi
4. Tentang
5. Fisioterapis
6. FAQ
7. Kontak
8. `Masuk` secondary action
9. `Buat Janji` / CTA utama

### Mobile navigation

Gunakan Sheet/Drawer. CTA utama tetap terlihat atau mudah dijangkau. Jangan memaksa seluruh menu tetap horizontal.

### Navigation rules

- gunakan anchor section jika seluruh konten masih satu halaman;
- jangan membuat route baru hanya untuk memperbanyak halaman;
- jika `/layanan/[slug]` belum tersedia, link service harus scroll ke section, bukan 404;
- header boleh sticky jika tidak mengganggu viewport mobile;
- login/register harus tetap dapat diakses tanpa scroll panjang.

## 6. Page composition

Canonical order:

```text
Header
Hero
Trust Context
Services / Conditions Context
How Therapy Works
About Hafta
Therapist Team
Patient Portal Preview
Education / Insights
Recovery Story / Testimonial [only when approved]
FAQ
Location & Contact
Final CTA
Footer
```

Urutan boleh dioptimalkan berdasarkan hasil desain, tetapi `Hero`, `Service context`, `Process`, `Portal`, `Contact`, dan `Footer privacy links` tidak boleh hilang.

---

## 7. Section requirements

## LP-S01 — Header

### Objective
Memberi orientasi dan access path utama.

### Required UI

- brand/logo;
- navigation links;
- login action;
- primary conversion CTA;
- mobile menu trigger.

### Component candidates

```text
components/landing/header/LandingHeader.tsx
components/landing/header/MobileNavigation.tsx
```

### Rules

- logo asset harus berasal dari client-approved asset;
- jangan membuat logo AI/placeholder untuk production;
- active section indicator optional;
- header tidak boleh menyembunyikan content saat anchor scroll.

### Acceptance criteria

- keyboard navigable;
- mobile menu accessible;
- Login dan CTA utama dapat ditemukan dalam <= 2 interaction dari mobile header;
- tidak ada overflow horizontal.

---

## LP-S02 — Hero

### Objective
Menjelaskan positioning Hafta dalam 5–10 detik pertama.

### Content model

```yaml
headline: client-approved or approved product copy
supporting_text: short description of physiotherapy/recovery support
primary_cta: booking/contact
secondary_cta: patient portal/login or learn process
location_context: Sidoarjo, only after final verification
visual: approved clinic/therapist/recovery asset
```

### Copy direction

Tone:

- profesional;
- hangat;
- jelas;
- tidak fear-based;
- tidak menjanjikan “pasti sembuh”;
- tidak menggunakan klaim klinis absolut.

Approved directional example, not production final copy:

```text
Kembali bergerak dengan lebih percaya diri.
Pendampingan fisioterapi yang terstruktur untuk membantu memahami kondisi,
menjalani program pemulihan, dan memantau perkembangan terapi.
```

### Visual rules

- gunakan foto asli Hafta jika tersedia;
- hindari generic stock doctor image jika client mempunyai dokumentasi sendiri;
- jangan menggunakan ilustrasi anatomi mengerikan/menakutkan;
- hero media harus responsive dan optimized.

### CTA

Primary:

```text
Buat Janji / Konsultasi
```

Secondary:

```text
Masuk Patient Portal
```

CTA final mengikuti flow operasional Hafta.

### Analytics event candidate

```text
landing_primary_cta_clicked
landing_portal_cta_clicked
```

Tidak boleh membawa patient identifiers.

---

## LP-S03 — Trust Context

### Objective
Menjawab cepat: lokasi, fokus umum, dan apa yang user dapat harapkan.

### Allowed content

- lokasi kota/area yang sudah dikonfirmasi;
- pendekatan assessment → plan → progress;
- layanan berbasis appointment jika benar;
- credential yang telah dikonfirmasi;
- social proof non-sensitive.

### Avoid

- angka pasien jika tidak tervalidasi;
- “#1”, “terbaik”, “100% sembuh”;
- credential yang belum dikonfirmasi;
- klaim testimoni tanpa consent.

### UI
Boleh berupa compact trust strip, 3–4 info blocks, atau statement row. Hindari card spam.

---

## LP-S04 — Services / Conditions Context

### Objective
Membantu user mengenali konteks keluhan/rehabilitasi yang relevan tanpa menjadikannya self-diagnosis tool.

### Current public-content inspiration
Tema yang sebelumnya ditemukan pada konten publik Hafta dapat digunakan sebagai inspirasi editorial saja, misalnya:

- ankle sprain/cedera pergelangan kaki;
- keluhan tumit;
- strain otot betis;
- rehabilitasi pasca operasi ACL dan kembali ke aktivitas.

**IMPORTANT:** tema tersebut bukan otomatis daftar layanan resmi. Final service list harus berasal dari client.

### Card data model

```ts
type ServiceCard = {
  id: string;
  title: string;
  shortDescription: string;
  icon?: string;
  href?: string;
  status: "CONFIRMED" | "PLACEHOLDER";
};
```

### UX rules

- maksimal 4–8 item pada homepage;
- gunakan bahasa awam;
- CTA `Tanyakan Kondisi Anda` lebih aman daripada `Diagnosa Sekarang`;
- jika detail page belum ada, jangan membuat fake links.

---

## LP-S05 — How Therapy Works

### Objective
Mengurangi ketidakpastian pasien baru.

### Baseline steps

1. Hubungi / Registrasi
2. Lengkapi Informasi Awal
3. Assessment
4. Rencana Terapi
5. Sesi & Monitoring
6. Evaluasi / Completion

Terminology final harus mengikuti workflow Hafta.

### UI
Gunakan timeline/stepper yang tetap mudah dibaca di mobile. Jangan memakai animasi yang membuat step sulit dibaca.

### Copy rules

- bedakan `registrasi` dengan `assessment`;
- jangan menyatakan portal melakukan diagnosis;
- patient intake bukan pengganti pemeriksaan fisioterapis.

---

## LP-S06 — About Hafta

### Objective
Memberi identitas dan alasan keberadaan Hafta.

### Required client content

- official short story;
- value/approach;
- tahun berdiri jika ingin dipublikasikan;
- clinic photo;
- service philosophy yang sudah disetujui.

### Placeholder behavior
Jika content belum diberikan, gunakan fixture copy yang jelas ditandai development-only. Jangan deploy lorem ipsum atau invented history.

---

## LP-S07 — Therapist Team

### Objective
Membangun trust terhadap tenaga yang memberikan layanan.

### Therapist card allowed fields

```yaml
name: required when published
photo: approved
credential: verified
role: verified
focus_area: verified, optional
short_bio: approved, optional
```

### Privacy/accuracy

- jangan scrape credential dari pihak ketiga tanpa validasi;
- jangan menambahkan title/sertifikasi yang tidak diberikan client;
- therapist detail page future only if useful.

---

## LP-S08 — Patient Portal Preview

### Objective
Menjelaskan fungsi digital system Hafta dan mengarahkan patient existing untuk login.

### Key benefits to communicate

- melengkapi informasi pasien secara terstruktur;
- melihat status data/intake milik sendiri;
- melihat history yang ditandai patient-visible;
- mengelola keamanan akun;
- akses informasi terapi yang memang telah difinalisasi/dibuka oleh therapist.

### Must not claim

- live chat therapist unless implemented;
- AI diagnosis;
- automatic medical advice;
- real-time appointment scheduler unless implemented;
- unrestricted access to internal therapist notes.

### Visual
Boleh menampilkan dashboard mock preview dengan **dummy data only**.

### CTA

```text
Sudah menjadi pasien? Masuk Portal
```

Secondary optional:

```text
Buat Akun
```

Jika registration policy berubah menjadi invitation-only, CTA harus mengikuti policy.

---

## LP-S09 — Education / Insights

### Objective
Menunjukkan edukasi yang relevan dan memberi jalur dari Instagram ke website.

### V1 options

Option A — curated static content:

- 3–6 educational cards curated manually;
- source/link ke Instagram atau future article.

Option B — future CMS/article pages:

- `/edukasi`;
- `/edukasi/[slug]`.

### Rule
Jangan membuat Instagram scraping yang rapuh atau melanggar access model hanya untuk homepage. Konten bisa dikurasi manual pada v1.

---

## LP-S10 — Recovery Story / Testimonial

### Status
Optional. Hidden until consent and content approval complete.

### Requirement

```text
publication_consent = valid
AND content_approved = true
```

### Prohibited

- screenshot pasien dari social media tanpa approval formal;
- before/after clinical promise;
- exposing medical details melebihi consent.

### Data model recommendation

```ts
type Testimonial = {
  id: string;
  displayName: string; // may be initials/pseudonym if approved
  quote: string;
  context?: string;
  consentReference: string;
  approvedAt: string;
};
```

---

## LP-S11 — FAQ

### Candidate topics

- bagaimana memulai konsultasi;
- apa yang perlu dipersiapkan sebelum datang;
- apakah harus membuat akun;
- bagaimana Patient Portal digunakan;
- bagaimana menghubungi Hafta;
- pertanyaan operasional lain yang dikonfirmasi client.

### Requirements

- no medical diagnosis answers;
- use accessible accordion;
- FAQ content editable via source file/config in v1 if no CMS.

---

## LP-S12 — Location & Contact

### Required verified data

- address;
- operating hours;
- phone/WhatsApp;
- booking method;
- map destination;
- parking/access note if client wants.

### UX

Primary actions:

- `Hubungi via WhatsApp` or approved channel;
- `Buka Lokasi`;
- optional `Buat Janji`.

### Security/privacy
Landing contact form is not required for v1. Avoid collecting health complaint via unprotected generic contact form.

---

## LP-S13 — Final CTA

### Objective
Memberi satu keputusan jelas setelah user memahami layanan.

Candidate:

```text
Mulai langkah pemulihan Anda bersama Hafta.
```

Buttons:

- primary consultation/booking;
- secondary login patient portal.

Copy final requires approval.

---

## LP-S14 — Footer

### Required

- brand;
- contact summary;
- navigation;
- Privacy Policy;
- Terms;
- copyright/dynamic year;
- optional Instagram link.

### Production gate
`/privacy` dan `/terms` tidak boleh dead link ketika registration/data collection production diaktifkan.

---

## 8. Responsive behavior

### Mobile

- single-column first;
- hero CTA stack when necessary;
- touch target >= practical accessible size;
- timeline becomes vertical;
- no tiny service card grids;
- location CTA visible;
- no horizontal body overflow.

### Tablet

- 2-column compositions allowed;
- maintain text measure;
- avoid dashboard-like density.

### Desktop

- use generous whitespace;
- max text width to preserve readability;
- visual compositions may be asymmetric if Taste Skill recommends it;
- do not fill every area with cards.

## 9. Design guardrails

- clinical but not sterile;
- use the locked Hafta tokens from `docs/DESIGN-SYSTEM.md`; do not introduce page-local brand colors;
- no excessive gradients;
- no glassmorphism if it reduces readability;
- no autoplay audio;
- motion subtle and optional;
- use real photo assets when possible;
- avoid generic AI-looking healthcare illustration as primary brand identity.

## 10. SEO baseline

Required:

- page metadata;
- canonical URL;
- Open Graph metadata;
- semantic headings;
- local business/service wording only when verified;
- structured data only when information is validated;
- optimized image alt text;
- no keyword stuffing.

Candidate metadata must use client-approved brand description.

## 11. Performance

- Next/Image for compatible images;
- responsive sizes;
- no heavy client JS for static sections;
- Server Components by default;
- lazy-load below-fold media when appropriate;
- avoid loading dashboard packages on landing page;
- web fonts configured responsibly.

## 12. Analytics baseline

Allowed public events after privacy review:

```text
landing_primary_cta_clicked
landing_login_clicked
landing_register_clicked
landing_service_viewed
landing_location_clicked
landing_instagram_clicked
```

Never attach:

- patient ID;
- complaint text;
- phone;
- email;
- clinical data.

## 13. Content states

Every content item should be classified:

```text
PLACEHOLDER
CLIENT_CONFIRMED
LEGAL_REVIEW_REQUIRED
READY_FOR_PRODUCTION
```

AI Agent must not silently promote PLACEHOLDER content to production-confirmed content.

## 14. Component tree candidate

```text
components/landing/
├── header/
│   ├── LandingHeader.tsx
│   └── MobileNavigation.tsx
├── hero/
│   ├── HeroSection.tsx
│   └── HeroMedia.tsx
├── trust/
│   └── TrustContext.tsx
├── services/
│   ├── ServicesSection.tsx
│   └── ServiceCard.tsx
├── process/
│   ├── TherapyProcessSection.tsx
│   └── TherapyProcessStep.tsx
├── about/
│   └── AboutHaftaSection.tsx
├── therapists/
│   ├── TherapistSection.tsx
│   └── TherapistCard.tsx
├── portal/
│   ├── PatientPortalSection.tsx
│   └── PortalPreview.tsx
├── education/
│   ├── EducationSection.tsx
│   └── EducationCard.tsx
├── testimonials/
│   └── TestimonialSection.tsx
├── faq/
│   └── FaqSection.tsx
├── contact/
│   ├── ContactSection.tsx
│   └── LocationActions.tsx
└── footer/
    └── LandingFooter.tsx
```

Do not create all files if a smaller component structure is sufficient. Avoid premature fragmentation.

## 15. Landing page acceptance criteria

Landing page is implementation-complete when:

- [ ] all required sections implemented or intentionally hidden by feature/content gate;
- [ ] content placeholders clearly separated from confirmed content;
- [ ] CTA routes/channels work;
- [ ] login/register accessible;
- [ ] responsive on mobile/tablet/desktop;
- [ ] keyboard navigation works;
- [ ] visible focus state;
- [ ] no unauthorized patient data rendered;
- [ ] no fake testimonial/credential/service claim;
- [ ] privacy and terms links work before production intake;
- [ ] metadata/OG configured;
- [ ] image optimization applied;
- [ ] lint/typecheck pass;
- [ ] no unnecessary client bundle from dashboard feature code.
