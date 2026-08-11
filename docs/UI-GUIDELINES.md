---
title: Hafta Fisioterapi UI Guidelines
version: 0.3.0
last_updated: 2026-08-12
---

# UI/UX Guidelines

## 1. Product feel

Target visual direction:

- professional;
- calm;
- modern;
- approachable;
- clinical without feeling cold;
- clear and trustworthy;
- high readability.

Do not make the dashboard look like a generic analytics SaaS if it harms clinical usability.

## 2. Canonical design sources

Before implementing UI, read:

1. `docs/DESIGN-REFERENCES.md`;
2. `docs/DESIGN-SYSTEM.md`;
3. `docs/MOBILE-FIRST-STRATEGY.md`.

Visual assets live in `assets/design-references/`.

The original layout reference is inspiration only. The Hafta landing direction and the Markdown design system define the approved implementation direction. Placeholder copy/data inside reference images are not production facts.

## 3. Design system tooling

Use:

- Tailwind CSS;
- shadcn/ui primitives;
- Lucide icons;
- Taste Skill as quality-review guardrail;
- design tokens via CSS variables.

Do not fork shadcn components unnecessarily. Extend through local component wrappers when domain behavior is repeated.

## 4. Taste Skill usage

Taste Skill should improve:

- hierarchy;
- spacing;
- typography;
- composition;
- motion restraint;
- perceived polish.

Taste Skill must not override:

- accessibility;
- security states;
- form clarity;
- content accuracy;
- clinical workflow.

## 5. Landing page structure

Recommended order:

1. Header
2. Hero
3. Trust/service context
4. Services/conditions
5. How therapy works
6. About
7. Therapist
8. Patient portal preview
9. Education
10. Recovery story/testimonial with consent
11. FAQ
12. Location/contact
13. Final CTA
14. Footer + privacy links

## 6. Dashboard shell

Mobile first:

- collapsible/sheet navigation;
- prioritize tasks, not dense metrics;
- forms stay usable without horizontal overflow;
- no hover-only actions;
- pass Mobile Gate before desktop layout work.

Desktop enhancement:

- persistent/compact sidebar;
- topbar with page context and account controls;
- content area with max-width rules based on screen/feature;
- breadcrumbs for deep patient routes.

## 7. Patient profile UX

Avoid showing all sensitive data at once if not needed.

Recommended tabs/sections:

- Overview
- Intake
- Assessment
- Treatment Plan
- Sessions
- History
- Documents

Tabs visible according to permission.

## 8. Clinical forms

Long forms:

- group related fields;
- use clear section headers;
- autosave draft only if implementation is reliable and privacy-reviewed;
- show unsaved state;
- warn before leaving with changes;
- explicit Finalize button separate from Save Draft;
- finalization confirmation describes permanence/amendment behavior.

## 9. Status design

Do not communicate status only with color.

Use text + icon/badge.

Example:

- Draft
- Submitted
- Under Review
- Finalized
- Amended
- Completed

## 10. Tables

Patient table should prioritize:

- name/identifier needed for workflow;
- case status;
- assigned therapist;
- latest activity;
- safe actions.

Do not show complaint details, DOB, phone, or other sensitive fields in list view unless operationally required.

## 11. Empty states

Every major list should define:

- first-use empty state;
- no-search-results state;
- permission-limited state if appropriate.

## 12. Error states

Use distinct handling:

- validation error;
- network/server error;
- unauthorized;
- forbidden;
- not found;
- record finalized/conflict.

Do not leak sensitive details in errors.

## 13. Confirmation dialogs

Mandatory for high-impact actions:

- finalize assessment/session;
- role change;
- account suspension;
- archive;
- export;
- revoke consent where consequences need explanation.

Confirmation copy must describe effect, not generic "Are you sure?" only.

## 14. Motion

Use motion sparingly.

- subtle page/section transitions acceptable;
- avoid animation on clinical data that delays reading;
- respect `prefers-reduced-motion`;
- no excessive parallax in patient dashboard.

## 15. Accessibility

- native labels;
- keyboard navigation;
- visible focus;
- sufficiently large touch targets;
- correct heading order;
- dialogs trap/restore focus correctly;
- accessible tables/forms;
- error summary for long forms where useful.

## 16. Component naming examples

Good:

- `PatientStatusBadge`
- `PatientOverviewCard`
- `AssessmentDraftForm`
- `FinalizeAssessmentDialog`
- `TherapySessionTimeline`

Avoid:

- `Card2`
- `NewComponent`
- `DashboardBox`
- one massive `PatientPageClient.tsx`.

## 17. Design review checklist

Before marking UI complete:

- hierarchy clear?
- user knows primary action?
- Mobile Gate passed before desktop enhancement?
- mobile usable at 320/360/390/430?
- keyboard usable?
- loading/empty/error covered?
- sensitive data minimized?
- permission-hidden actions also protected server-side?
- duplicate component avoided?
- desktop enhancement preserves mobile content hierarchy?
- visual result matches `docs/DESIGN-SYSTEM.md` and approved Hafta reference?
- Taste Skill applied without sacrificing clarity?
