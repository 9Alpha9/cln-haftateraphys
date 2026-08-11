---
title: Hafta Fisioterapi Design References
version: 0.3.0
last_updated: 2026-08-12
status: approved-direction
---

# Design References

## 1. Purpose

Dokumen ini mengunci sumber referensi visual yang harus dibaca AI coding agent sebelum mengimplementasikan halaman publik, authentication UI, Patient Portal, ADMIN/Therapist dashboard, atau SUPER_ADMIN dashboard.

Referensi visual digunakan untuk **arah komposisi, hierarchy, rhythm, card treatment, photography placement, CTA treatment, dan perceived quality**. Referensi bukan sumber kebenaran untuk copy, alamat, angka statistik, klaim klinis, nomor telepon, jam operasional, nama pasien, atau credential therapist.

## 2. Reference precedence

Jika terjadi perbedaan visual, gunakan prioritas berikut:

1. `docs/DESIGN-SYSTEM.md` — token dan rule implementasi yang canonical.
2. `assets/design-references/03-hafta-design-system-board.png` — visual design-system board.
3. `assets/design-references/02-hafta-landing-direction.png` — approved Hafta visual direction.
4. `assets/design-references/01-layout-reference.png` — third-party/reference layout inspiration only.
5. `docs/UI-GUIDELINES.md` — general UX guardrails.

Security, accessibility, content accuracy, dan clinical workflow selalu memiliki prioritas lebih tinggi daripada visual reference.

## 3. Original layout reference

![Original layout reference](../assets/design-references/01-layout-reference.png)

File:

```text
assets/design-references/01-layout-reference.png
```

### What to learn from it

Gunakan sebagai inspirasi untuk:

- long-form healthcare landing page;
- alternation antara white/light surface dan branded section;
- hero dengan strong CTA hierarchy;
- service cards yang mudah discan;
- stat/trust strip;
- image + content split sections;
- process timeline;
- testimonial cards;
- contact/form block;
- gallery/editorial content;
- final CTA + location;
- structured footer.

### What must NOT be copied

Jangan menyalin secara 1:1:

- logo/brand;
- exact text/copy;
- clinic claims;
- patient/testimonial identity;
- images;
- exact color palette;
- exact dimensions;
- unique branded illustrations;
- contact information;
- proprietary visual assets.

Implementasi Hafta harus menjadi karya sendiri yang mengikuti brand Hafta dan dokumen project ini.

## 4. Approved Hafta landing-page visual direction

![Hafta landing-page visual direction](../assets/design-references/02-hafta-landing-direction.png)

File:

```text
assets/design-references/02-hafta-landing-direction.png
```

### Visual language to preserve

- dominant deep emerald/forest green;
- teal supporting color;
- soft sage/mint supporting surfaces;
- generous white/off-white space;
- yellow used sparingly as action accent;
- modern healthcare photography;
- strong but calm hero;
- clean rounded cards;
- restrained shadows;
- friendly icon circles;
- readable informational hierarchy;
- patient-portal awareness integrated without making landing page feel like SaaS.

### Content warning

Text, addresses, metrics, hours, ratings, names, map labels, and contact details visible inside the mockup are **visual placeholders unless separately confirmed in canonical content documentation**.

AI agents MUST NOT extract those placeholder values and publish them as production facts.

## 5. Approved design-system visual board

![Hafta design-system board](../assets/design-references/03-hafta-design-system-board.png)

File:

```text
assets/design-references/03-hafta-design-system-board.png
```

The implementation counterpart is:

```text
docs/DESIGN-SYSTEM.md
```

The Markdown design-system document wins whenever exact token values or responsive behavior are needed.

## 6. Instagram-derived brand direction

The visual direction intentionally follows the Hafta Fisioterapi public-brand impression already reviewed in this project: green/teal healthcare identity, clean clinical communication, movement/recovery context, and a warm professional tone.

Do not scrape Instagram during build to derive runtime design tokens. Brand tokens are now locked in `docs/DESIGN-SYSTEM.md` until the owner provides an official brand guideline or explicitly approves a change.

## 7. AI-agent instruction

Before building UI, the agent must:

1. read `docs/DESIGN-SYSTEM.md`;
2. read `docs/MOBILE-FIRST-STRATEGY.md`;
3. inspect the relevant visual asset in `assets/design-references/` when the tool supports image viewing;
4. implement base/mobile UI first;
5. pass Mobile Gate;
6. only then add tablet/desktop enhancements;
7. compare the result against the Hafta visual direction, not against generic SaaS templates.

If an AI agent cannot inspect images, it must rely on the written descriptions and token rules in this file plus `docs/DESIGN-SYSTEM.md` rather than inventing a different visual identity.
