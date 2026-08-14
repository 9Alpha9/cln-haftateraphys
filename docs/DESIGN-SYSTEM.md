---
title: Hafta Fisioterapi Design System
version: 0.3.0
last_updated: 2026-08-12
status: approved-for-implementation
source_of_truth_for:
  - visual-tokens
  - typography
  - spacing
  - radius
  - shadows
  - component-states
  - responsive-ui-foundation
---

# Hafta Fisioterapi — Design System

## 1. Design principles

Hafta Fisioterapi harus terasa:

- menenangkan;
- profesional;
- modern;
- terpercaya;
- approachable;
- clinical without feeling cold;
- jelas untuk pasien non-teknis;
- efisien untuk therapist/staff.

Visual polish tidak boleh mengorbankan accessibility, form clarity, clinical readability, privacy, atau security state.

## 2. Canonical visual references

Use together with:

```text
assets/design-references/02-hafta-landing-direction.png
assets/design-references/03-hafta-design-system-board.png
```

See `docs/DESIGN-REFERENCES.md` for reference precedence and usage rules.

## 3. Color system

### 3.1 Brand tokens

| Token         | Hex       | Usage                                         |
| ------------- | --------- | --------------------------------------------- |
| `emerald-900` | `#064E3B` | strongest brand surface, dark hero/footer     |
| `emerald-700` | `#065F46` | primary buttons, interactive brand color      |
| `teal-600`    | `#0D766E` | supporting accents, focus/secondary emphasis  |
| `sage-200`    | `#DDEBE3` | soft healthcare surface, chips, subtle panels |
| `yellow-400`  | `#FBBF24` | limited high-attention accent                 |
| `yellow-500`  | `#F59E0B` | hover/strong accent where accessible          |
| `surface`     | `#F6FAF8` | off-white branded page surface                |
| `white`       | `#FFFFFF` | card/surface                                  |

### 3.2 Neutral/text tokens

| Token            | Hex       | Usage                                  |
| ---------------- | --------- | -------------------------------------- |
| `gray-100`       | `#F3F4F6` | subtle background                      |
| `gray-200`       | `#E5E7EB` | default border/divider                 |
| `gray-300`       | `#D1D5DB` | stronger neutral border                |
| `text-primary`   | `#111827` | primary body/headings on light surface |
| `text-secondary` | `#374151` | secondary copy                         |
| `text-muted`     | `#6B7280` | helper/meta text                       |
| `border`         | `#E5E7EB` | default border                         |
| `border-strong`  | `#CBD5E1` | stronger separator/control border      |

### 3.3 Semantic tokens

Prefer semantic aliases instead of direct color names inside feature components.

```text
--color-primary: #065F46
--color-primary-strong: #064E3B
--color-secondary: #0D766E
--color-accent: #FBBF24
--color-surface: #F6FAF8
--color-card: #FFFFFF
--color-text: #111827
--color-text-secondary: #374151
--color-text-muted: #6B7280
--color-border: #E5E7EB
--color-border-strong: #CBD5E1
--color-success: #15803D
--color-warning: #B45309
--color-danger: #B91C1C
--color-info: #0D766E
```

Semantic feedback colors may be tuned for WCAG contrast, but must remain centralized tokens.

### 3.4 Color usage rules

- Emerald is the brand anchor; do not make every section dark green.
- Use white/off-white to create breathing room.
- Yellow is an accent, not a dominant brand color.
- Do not use color alone to communicate status.
- Red is reserved for destructive/error/critical state.
- Clinical severity must not be implied solely through decorative color.
- Maintain WCAG AA contrast for normal text and interactive states.

## 4. Typography

### 4.1 Font family

Primary implementation direction:

```text
Poppins, system-ui, sans-serif
```

Use a framework-managed font loading strategy. If an official client brand font is provided later, change only after explicit approval and update this document first.

### 4.2 Type scale

Mobile values are the implementation starting point. Desktop values are progressive enhancements.

| Style      | Mobile | Desktop |  Weight | Use                       |
| ---------- | -----: | ------: | ------: | ------------------------- |
| Display    |  34/40 |   44/52 | 600–700 | hero statement            |
| H1         |  28/36 |   36/44 | 600–700 | page title                |
| H2         |  24/32 |   32/40 |     600 | section title             |
| H3         |  18/26 |   20/28 |     600 | card/subsection title     |
| Body Large |  17/28 |   18/30 |     400 | important supporting copy |
| Body       |  16/26 |   16/26 |     400 | default readable body     |
| Small      |  14/22 |   14/22 |     400 | metadata/helper           |
| Caption    |  12/18 |   12/18 | 400–500 | compact metadata          |
| Button     |  14/20 |   14/20 |     600 | controls                  |

Rules:

- body text should generally not drop below 16px for core patient content;
- avoid ultra-thin weights;
- keep line lengths readable; public editorial copy target roughly 45–75 characters where possible;
- do not use all caps for long labels;
- headings should remain concise on mobile.

## 5. Spacing system

Use a 4px-compatible scale with strong preference for 8px rhythm.

```text
space-0  = 0px
space-1  = 4px
space-2  = 8px
space-3  = 12px
space-4  = 16px
space-6  = 24px
space-8  = 32px
space-10 = 40px
space-12 = 48px
space-16 = 64px
space-20 = 80px
space-24 = 96px
space-32 = 128px
```

### Section rhythm

| Token        |  Mobile | Desktop |
| ------------ | ------: | ------: |
| `section-xs` | 40–48px |    48px |
| `section-sm` | 48–56px |    64px |
| `section-md` | 56–64px |    80px |
| `section-lg` | 64–80px |    96px |
| `section-xl` | 80–96px |   128px |

Do not blindly add huge desktop-style whitespace to mobile.

## 6. Radius system

```text
radius-xs   = 2px
radius-sm   = 4px
radius-md   = 8px
radius-lg   = 12px
radius-xl   = 16px
radius-2xl  = 20px
radius-full = 9999px
```

Recommended:

- input/button: `radius-md` to `radius-lg`;
- cards: `radius-lg` to `radius-xl`;
- large branded panels: `radius-xl` to `radius-2xl`;
- pills/chips/avatar: `radius-full`.

Do not randomize radii per component.

## 7. Shadow system

```text
shadow-sm = 0 1px 2px rgba(16,24,40,0.05)
shadow    = 0 2px 6px rgba(16,24,40,0.08)
shadow-md = 0 8px 24px rgba(16,24,40,0.08)
shadow-lg = 0 20px 40px rgba(16,24,40,0.12)
```

Rules:

- border + subtle shadow is preferred to heavy floating-card effects;
- avoid strong shadows on every card;
- dashboard tables/forms should generally use borders and surface hierarchy first.

## 8. Layout/container system

### Mobile-first container

Base:

```text
width: 100%
padding-inline: 16px
```

Comfortable mobile >= 390px may use 20px if content still fits cleanly.

Tablet:

```text
padding-inline: 24px
```

Desktop:

```text
max-width: 1280px
padding-inline: 32px
margin-inline: auto
```

Use 12-column conceptual grid on desktop where needed. Do not force a grid system into simple mobile content.

## 9. Breakpoint strategy

Canonical responsive behavior is defined in `docs/MOBILE-FIRST-STRATEGY.md`.

Implementation principle:

```text
Base CSS / Tailwind classes = mobile
md:* = tablet enhancement where required
lg:* = desktop structural enhancement
xl:* / 2xl:* = large-screen refinement only
```

Avoid writing a desktop layout and then using many overrides to shrink it.

## 10. Buttons

### Primary

Use for the most important action in a local context.

Examples:

- `Buat Janji`
- `Simpan`
- `Lanjutkan`
- `Kirim`

Style direction:

- emerald background;
- high-contrast text;
- clear focus ring;
- minimum touch target 44×44px;
- disabled state visually and semantically disabled.

### Secondary

Use for WhatsApp/supporting action or safe alternative.

### Outline

Use for lower-priority action.

### Ghost

Use only where hierarchy is already obvious.

### Destructive

Use only for legitimate destructive operations. Clinical records do not use hard-delete controls.

### Button hierarchy rule

Prefer one dominant primary action per card/form section. Avoid multiple equally strong CTAs.

## 11. Form controls

Canonical states:

- default;
- hover where relevant;
- focus;
- filled;
- success only when useful;
- error;
- disabled;
- readonly.

All inputs must have programmatic labels. Placeholder is not a label.

Error state must include:

- text message;
- semantic association (`aria-describedby` or framework equivalent);
- color/icon may support but not replace text.

Healthcare/patient forms prioritize clarity over compactness.

## 12. Cards

Supported card families:

- Service Card;
- Stat/Trust Card;
- Testimonial Card;
- Article Card;
- Contact Card;
- Patient Next Action Card;
- Clinical Summary Card;
- Security Alert Card.

Rules:

- card content must have a clear purpose;
- avoid card-inside-card nesting unless structurally necessary;
- avoid turning every text group into a card;
- keep interactive cards keyboard accessible;
- patient-sensitive summary cards should disclose the minimum necessary information.

## 13. Icons and badges

Use Lucide icons unless a client-approved custom brand icon is provided.

Icon treatment:

- simple line icon;
- brand-colored circular/square soft surface;
- do not use decorative icons that can be mistaken for clinical indicators.

Status chips require text labels such as:

```text
Baru
Menunggu
Draft
Selesai
Dibatalkan
Perlu Tindakan
```

Use semantic colors consistently.

## 14. Navigation patterns

### Public

- compact brand header;
- mobile drawer/sheet;
- prominent appointment CTA;
- patient portal/login access remains discoverable.

### Patient portal

- mobile bottom/compact navigation or sheet based on final information architecture;
- desktop sidebar may be introduced only after mobile navigation is stable.

### Admin/Therapist

- mobile sheet/drawer navigation;
- desktop persistent sidebar allowed;
- clinical actions must remain clear without relying on hover.

## 15. Motion

Motion is optional and restrained.

Allowed:

- subtle reveal;
- short hover/focus transitions;
- accordion/sheet/dialog motion;
- tasteful section movement if reduced-motion safe.

Avoid:

- scroll hijacking;
- long parallax;
- bouncing CTAs;
- motion that hides clinical content;
- animations blocking form interaction.

Respect `prefers-reduced-motion`.

## 16. Photography

Preferred:

1. real Hafta clinic/team photography with approval;
2. client-approved professional photography;
3. temporary development placeholders.

Avoid:

- images implying services/credentials that Hafta does not provide;
- identifiable patient imagery without consent;
- fake before/after clinical outcomes;
- sensational injury imagery.

## 17. Accessibility baseline

- keyboard access for all interactive UI;
- visible focus state;
- touch targets ideally >= 44×44px;
- WCAG AA contrast target;
- no information by color alone;
- semantic headings;
- form labels and errors connected;
- dialogs/sheets manage focus correctly;
- images have meaningful alt or empty alt when decorative.

## 18. shadcn/ui mapping

Preferred primitives may include:

```text
Button
Input
Textarea
Select
Checkbox
RadioGroup
Form
Card
Badge
Alert
Accordion
Sheet
Dialog
DropdownMenu
Tabs
Table
Tooltip
Skeleton
Sonner/Toast
```

Extend with domain components under `components/`. Do not repeatedly fork primitives.

## 19. Design-token implementation

Centralize tokens in CSS/theme layer. Feature components should consume semantic tokens rather than raw hex values.

Example naming direction:

```text
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--border
--input
--ring
--destructive
```

Map these to the Hafta token system rather than inventing shadcn defaults per page.

## 20. Mobile-first non-negotiable

No page is considered visually complete until its mobile implementation passes the Mobile Gate in `docs/MOBILE-FIRST-STRATEGY.md`.

Desktop styling may enhance composition but must not redefine the content hierarchy or require duplicated markup solely to make layout work.
