---
title: Hafta Fisioterapi Mobile-First Development Strategy
version: 0.3.0
last_updated: 2026-08-12
status: non-negotiable
source_of_truth_for:
  - responsive-development-order
  - mobile-layout
  - tablet-enhancement
  - desktop-enhancement
  - responsive-qa
---

# Mobile-First Development Strategy

## 1. Core rule

Development UI/UX Hafta Fisioterapi MUST follow this order:

```text
CONTENT + FUNCTION CONTRACT
        ↓
MOBILE BASE IMPLEMENTATION
        ↓
MOBILE GATE
        ↓
TABLET ENHANCEMENT
        ↓
DESKTOP ENHANCEMENT
        ↓
CROSS-BREAKPOINT QA
```

The AI agent MUST NOT begin with a desktop composition and later compress it into mobile.

## 2. Why this is locked

The product includes:

- patient onboarding;
- login/register;
- intake forms;
- patient history;
- appointment/contact actions;
- therapist workflows;
- account/security actions.

These flows must remain usable from phones first. Desktop is a progressive enhancement for information density and operational efficiency.

## 3. Reference viewport targets

Do not optimize for only one phone.

### Mobile validation

At minimum test:

```text
320px  — narrow safety check
360px  — common Android width
390px  — primary design/reference width
430px  — larger phone
```

### Tablet validation

```text
768px
834px
```

### Desktop validation

```text
1024px
1280px
1440px
```

The app must remain fluid between these widths. These are QA references, not fixed-device layouts.

## 4. Tailwind implementation rule

Base classes represent mobile.

Preferred direction:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
```

Not:

```tsx
<div className="grid grid-cols-4 max-md:grid-cols-1">
```

Use project-configured responsive breakpoints. Typical intention:

- base: phone;
- `md`: tablet / medium enhancement;
- `lg`: desktop structural change;
- `xl`/`2xl`: wide-screen refinement.

Avoid unnecessary breakpoint churn.

## 5. Mobile Gate

A page/feature may proceed to desktop only when all applicable checks pass:

- [ ] usable at 320px without body-level horizontal scrolling;
- [ ] primary action is obvious;
- [ ] navigation works by touch and keyboard;
- [ ] touch targets are comfortable, target >= 44×44px where practical;
- [ ] text is readable without zoom;
- [ ] forms are single-column unless a pair genuinely improves comprehension;
- [ ] labels/errors/help text do not overlap;
- [ ] long values wrap safely;
- [ ] sheet/dialog content fits viewport and remains scrollable;
- [ ] sticky/fixed elements do not cover primary content;
- [ ] tables have a mobile strategy;
- [ ] empty/loading/error/forbidden states are usable;
- [ ] no hover-only action;
- [ ] images/media do not create layout shift or overflow;
- [ ] keyboard/focus order follows visual order;
- [ ] sensitive data is not exposed simply to fill the mobile screen.

Only after this gate passes may the agent add desktop layout enhancements.

## 6. Desktop Gate

After mobile passes, desktop enhancement may add:

- multi-column composition;
- persistent sidebar;
- denser data table;
- split-view content;
- wider image treatment;
- secondary contextual panels;
- larger whitespace and typography;
- hover enhancement, never hover dependency.

Desktop Gate:

- [ ] content hierarchy remains consistent with mobile;
- [ ] no duplicated conflicting actions;
- [ ] no excessive empty space;
- [ ] line length remains readable;
- [ ] tables preserve permission and row-action clarity;
- [ ] focus states remain visible;
- [ ] responsive transitions do not produce intermediate broken states;
- [ ] desktop enhancements do not introduce additional sensitive data without product need.

## 7. Landing page behavior

### Mobile first

Preferred order:

```text
Header
Hero text
Hero CTA
Trust context
Hero/media
Services
Stats/trust
About
Process vertical
Benefits
Portal preview
Testimonials if approved
Contact/form
Gallery
Education
Final CTA/location
Footer
```

Rules:

- hero is predominantly single-column;
- headline must not use desktop-only forced line breaks;
- CTA can stack full-width/near-full-width when appropriate;
- service cards: 1 column base;
- stats: 2×2 or stacked depending content;
- image/text split becomes stacked;
- process timeline becomes vertical/step cards;
- contact information and form stack;
- footer stacks into logical groups/accordions if needed.

### Desktop enhancement

May become:

- hero split 5/7 or 6/6;
- 4-column service cards;
- horizontal stat strip;
- image + text split;
- horizontal process journey;
- 2-column contact block;
- multi-column footer.

Reference visual:

```text
assets/design-references/02-hafta-landing-direction.png
```

## 8. Authentication behavior

### Mobile

- form is the primary content;
- no forced split-screen;
- submit button remains easy to reach;
- password controls remain accessible;
- validation is inline and clear.

### Desktop

Optional brand/clinic visual panel can be introduced beside the form without moving essential instructions away from the form.

## 9. Patient portal behavior

Mobile is first-class.

### Mobile

- next action first;
- intake/status/history use clear vertical hierarchy;
- avoid wide dashboard analytics;
- long forms use logical sections or steps;
- timeline becomes vertical;
- sensitive detail is progressively disclosed;
- navigation uses compact header/sheet/bottom pattern as approved.

### Desktop

- persistent sidebar optional;
- summary content may use two/three columns;
- history and document management may use denser table/list patterns;
- do not transform patient portal into an analytics-heavy admin dashboard.

## 10. ADMIN/Therapist behavior

### Mobile

Mobile support is required even if desktop is more operationally efficient.

- patient search/filter must remain usable;
- patient list should use compact cards or priority rows;
- clinical forms stay single-column by default;
- finalize/save actions remain unambiguous;
- do not rely on complex data grids;
- high-risk actions must not be placed too close together.

### Desktop

After mobile gate:

- list/table density may increase;
- sidebar becomes persistent;
- patient summary + actions may use multi-column layout;
- assessment/session forms may use safe paired fields when logical;
- sticky contextual action bar is allowed if it does not obscure content.

## 11. SUPER_ADMIN behavior

### Mobile

- user/account actions remain possible;
- data tables become priority cards/list or controlled horizontal container where unavoidable;
- role changes use dialog/sheet with clear confirmation;
- audit filters stack.

### Desktop

- full tables and filter toolbars may be used;
- permission matrix can expand;
- audit log can use dense table mode.

## 12. Table strategy

Never allow the entire page to overflow horizontally because of a table.

Choose one:

1. mobile card/list representation;
2. priority columns + hidden secondary columns;
3. controlled horizontal scroll inside a labeled table container;
4. detail drill-down.

Core actions must remain discoverable.

## 13. Dialog and sheet strategy

On small screens:

- prefer Sheet/Drawer or full-height dialog for complex forms;
- confirm destructive/security-sensitive actions clearly;
- ensure close/back action is reachable;
- content can scroll internally;
- do not create nested modal stacks unless unavoidable.

Desktop may use centered dialogs where appropriate.

## 14. Forms

Mobile defaults:

- one column;
- full-width controls;
- 16px minimum input text to avoid mobile zoom issues;
- labels above fields;
- helper/error text directly connected;
- date/time controls must remain touch-friendly;
- logical grouping with clear section headings.

Desktop may pair fields only if they are naturally related, e.g. first/last name if product actually uses both, or date/time pair.

## 15. Images and media

- use responsive image component and explicit sizing/aspect ratio;
- mobile should prioritize crop that preserves clinical action/context;
- do not hide critical copy behind image overlays;
- lazy-load non-critical media;
- preserve alt-text behavior;
- do not use patient images without approved consent.

## 16. Responsive component philosophy

Prefer one semantic component tree with CSS layout adaptation.

Avoid maintaining separate `MobileX.tsx` and `DesktopX.tsx` unless behavior is genuinely different. Duplicated trees risk inconsistent permissions, state, accessibility, and content.

## 17. AI execution protocol

For every UI task, agent must explicitly work in two checkpoints:

### Checkpoint A — Mobile implementation

1. implement base markup and styles;
2. validate 320/360/390/430;
3. fix mobile accessibility and overflow;
4. run Mobile Gate;
5. stop if Mobile Gate fails.

### Checkpoint B — Tablet/Desktop enhancement

1. add `md`/`lg`/`xl` refinements;
2. validate 768/834/1024/1280/1440;
3. compare against design references;
4. run Desktop Gate;
5. run cross-breakpoint regression.

Commit/PR notes should mention both gates.

## 18. Definition of responsive done

Responsive implementation is complete only when:

```text
Mobile Gate = PASS
Desktop Gate = PASS
Cross-breakpoint QA = PASS
Accessibility basics = PASS
No body horizontal overflow = PASS
```
