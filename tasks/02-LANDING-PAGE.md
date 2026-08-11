---
task_id: HF-TASK-002
phase: public-web
status: ready
depends_on: [HF-TASK-001]
requirements: [LP-S01, LP-S02, LP-S03, LP-S04, LP-S05, LP-S06, LP-S07, LP-S08, LP-S09, LP-S11, LP-S12, LP-S13, LP-S14]
---

# Landing Page

## Read first

- `AGENTS.md`
- `docs/DESIGN-REFERENCES.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/pages/01-LANDING-PAGE.md`
- `docs/UI-GUIDELINES.md`
- `docs/CONTENT-REQUIREMENTS.md`


## Visual source

Use:

```text
assets/design-references/02-hafta-landing-direction.png
assets/design-references/03-hafta-design-system-board.png
```

Use `01-layout-reference.png` only for composition inspiration. Do not copy it 1:1. All mockup facts/copy remain placeholders unless confirmed by canonical content docs.

## Scope

Route:

```text
/
```

Build required landing sections using confirmed content or clearly marked development placeholders.

## Content gates

Do not publish unconfirmed:

- therapist credential;
- exact service claim;
- operating hours;
- price;
- testimonial;
- patient recovery story;
- clinical outcome claim.

## Components
Follow component candidates but minimize fragmentation.

## Analytics
Only privacy-safe public CTA events if analytics is already approved. Do not add analytics provider solely for this task.

## Tests/checks

- CTA links;
- header mobile behavior;
- landmark/headings;
- keyboard nav;
- no dead privacy/terms production paths;
- responsive visual review.


## UI execution gates

If this task renders or changes UI:

1. implement base/mobile layout first;
2. validate 320/360/390/430;
3. pass Mobile Gate from `docs/MOBILE-FIRST-STRATEGY.md`;
4. only then add tablet/desktop styles;
5. validate 768/834/1024/1280/1440;
6. pass Desktop Gate and cross-breakpoint QA.

Do not start from a desktop screenshot and shrink it into mobile.

## Done when
Acceptance criteria in `docs/pages/01-LANDING-PAGE.md` pass.
