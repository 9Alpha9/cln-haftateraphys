# START DEVELOPMENT — Hafta Fisioterapi

> Package: v0.3.0
> Strategy: Mobile-first, then desktop enhancement.

## 1. First AI-agent session

Give the coding agent this instruction:

```text
Read AGENTS.md first.
Then read README-AI.md and the mandatory canonical docs.
For UI work, DESIGN-REFERENCES.md, DESIGN-SYSTEM.md, and MOBILE-FIRST-STRATEGY.md are mandatory.
Use only dummy/de-identified patient data.
Do not start desktop UI before the relevant Mobile Gate passes.

Execute tasks/00-PROJECT-BOOTSTRAP.md.
Stop after its Done criteria pass and report changed files, checks, and unresolved items.
```

## 2. Second session — design foundation

After Task 000 passes:

```text
Read AGENTS.md.
Execute tasks/01-DESIGN-FOUNDATION.md.
Inspect assets/design-references/02-hafta-landing-direction.png and 03-hafta-design-system-board.png if image inspection is supported.
Implement mobile/base visual primitives first.
Validate 320/360/390/430 and pass Mobile Gate before adding desktop variants.
Do not proceed to Landing Page until Done criteria pass.
```

## 3. Third session — landing page

After Task 001 passes:

```text
Read AGENTS.md.
Execute tasks/02-LANDING-PAGE.md.
Use the approved Hafta visual reference and DESIGN-SYSTEM.md.
Stage A: implement mobile landing page first and pass Mobile Gate.
Stage B: only after Stage A passes, implement tablet/desktop enhancements and pass Desktop Gate.
Do not publish placeholder metrics, addresses, credentials, testimonials, or clinical claims as facts.
```

## 4. Development order

```text
HF-TASK-000 Project Bootstrap
      ↓
HF-TASK-001 Design Foundation
      ↓
HF-TASK-002 Landing Page
      ↓
HF-TASK-003 Auth + Database
      ↓
HF-TASK-004 Permission Framework
      ↓
HF-TASK-005 USER Patient Portal
      ↓
HF-TASK-006 ADMIN/Therapist Clinical
      ↓
HF-TASK-007 SUPER_ADMIN
      ↓
HF-TASK-008 Security Hardening
```

For every UI-capable task:

```text
Mobile -> Mobile Gate -> Tablet/Desktop -> Desktop Gate -> QA
```

## 5. Important visual files

```text
assets/design-references/01-layout-reference.png
assets/design-references/02-hafta-landing-direction.png
assets/design-references/03-hafta-design-system-board.png
```

The first file is inspiration only. The second and third represent the approved Hafta direction. Exact tokens live in `docs/DESIGN-SYSTEM.md`.
