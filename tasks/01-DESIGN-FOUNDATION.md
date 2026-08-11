---
task_id: HF-TASK-001
phase: design-foundation
status: ready
depends_on: [HF-TASK-000]
---

# Design Foundation

## Read first

- `AGENTS.md`
- `docs/DESIGN-REFERENCES.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/MOBILE-FIRST-STRATEGY.md`
- `docs/UI-GUIDELINES.md`
- `docs/ARCHITECTURE.md`
- `docs/pages/01-LANDING-PAGE.md`
- `docs/pages/02-AUTHENTICATION-PAGES.md`

## Objective
Create reusable visual foundations before individual pages, based on the approved Hafta design system and references. Mobile primitives are completed first; desktop variants are progressive enhancements.

## Scope

- CSS design tokens;
- typography scale;
- container/layout primitives;
- button/input/form treatment based on shadcn/ui;
- focus states;
- status badge base;
- public header/footer primitives;
- auth shell;
- dashboard shell skeleton;
- responsive navigation foundation.

## Taste Skill
Run Taste Skill/design review against hierarchy, spacing, typography, and generic-AI visual patterns.

## Do not

- invent or replace the locked brand palette from `docs/DESIGN-SYSTEM.md` without explicit approval;
- hardcode page-specific clinical logic;
- create dozens of wrapper components with no reuse.


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

- mobile/tablet/desktop shell works;
- keyboard focus visible;
- no body overflow;
- components use tokens rather than ad-hoc styling where practical;
- design review checklist passes.
