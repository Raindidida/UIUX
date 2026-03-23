# HackQuest Design System

## 1. Overview & Creative North Star: "The Technical Architect"

This design system is engineered to feel like a high-end developer tool—precise, transparent, and effortlessly powerful. It moves beyond the generic "SaaS template" by embracing **The Technical Architect** as its Creative North Star.

The aesthetic is characterized by **Editorial Precision**: a marriage of expansive white space, a disciplined blueprint-inspired grid, and high-impact typography. We break traditional layouts through intentional asymmetry—utilizing "floating" code modules and overlapping data visualizations that break the container's edge. This system doesn't just display information; it archives it with the authority of a technical manual and the elegance of a premium digital experience.

---

## 2. Colors

Our palette is rooted in a "Warm Industrial" spectrum. It uses a high-contrast primary yellow to signal progress, set against a sophisticated range of paper-like neutrals and brand blacks.

### 2.1 Neutral Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `Neutral/White` | `#FFFFFF` | Pure white backgrounds, card surfaces |
| `Neutral/Neutral 50` | `#FCFCFC` | Page-level canvas, outermost background |
| `Neutral/Neutral 100` | `#F5F5F5` | Hover states, subtle section separators |
| `Neutral/Neutral 200` | `#E5E5E5` | Default borders, dividers, inactive strokes |
| `Neutral/Neutral 300` | `#D4D4D4` | Outer card borders (1px), placeholder fills |
| `Neutral/Neutral 400` | `#A3A3A3` | Disabled text, tertiary metadata |
| `Neutral/Neutral 500` | `#737373` | Muted body copy, secondary icons |
| `Neutral/Neutral 600` / `Secondary Neutral` | `#525252` | Secondary text, supporting metadata |
| `Neutral/Neutral 700` | `#404040` | Subheadings on light bg |
| `Neutral/Neutral 800` | `#262626` | Body copy on white |
| `Neutral/Neutral 900` / `Primary Neutral` | `#171717` | Primary text, high-contrast headings |
| `Neutral 950` | `#0B0B0B` | Near-black for max contrast scenarios |
| `Neutral/Black` | `#000000` | Absolute black |
| `Neutral/RichGray` | `#3E3E3E` | Rich dark gray, code comments |

### 2.2 Primary Yellow (Brand Accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `Primary/Primary 50` | `#FFFCEA` | Lightest tint, alert backgrounds |
| `Primary/Primary 100` | `#FFF8D5` | Highlight fill, tooltip backgrounds |
| `Primary/Primary 300` | `#FFF2AA` | Hover glow, progress track |
| `Primary Yellow` | `#FFE866` | **Main brand accent** — progress bars, active badges, key CTAs |
| `Primary/Primary 600` | `#EDD86C` | Pressed state for yellow elements |
| `Primary/Primary 700` | `#DBC971` | Dark yellow, high-contrast label on light bg |
| `Primary/Green Yellow/Default` | `#FFD850` | Alternate CTA variant |
| `Primary/Green Yellow/Dark` | `#FCC409` | Dark pressed variant |
| `Primary/Green Yellow/Disable` | `#FDEAAA` | Disabled yellow button |
| `Yellow/Dark` | `#FAD81C` | Deep yellow for charts, data highlights |

### 2.3 Blue (Link & Action)

| Token | Hex | Usage |
|-------|-----|-------|
| `Blue/Blue 50` | `#EFFAFF` | Blue tint background |
| `Blue/Blue 100` | `#C8ECFF` | Soft blue chip/tag background |
| `Blue/Blue 300` | `#66CAFF` | Icon hover, link underline |
| `Blue/Blue 500` / `Primary Link` | `#009CEF` | **Default link color**, interactive icons |
| `Blue/Blue 600` | `#0090DC` | Link hover, active state |

### 2.4 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `Success/Success 50` | `#F0FDF4` | Success alert background |
| `Success/Success 100` | `#DCFCE7` | Success fill |
| `Success/Success 500` | `#22C55E` | **Completed badge**, checkmark icon, progress fill |
| `Success/Success 600` | `#16A34A` | Darker success, shadow on completion icons |
| `Destructive/Destructive 50` | `#FEF2F2` | Error background |
| `Destructive/Destructive 100` | `#FEE2E2` | Error fill |
| `Destructive/Destructive 500` | `#EF4444` | Error icons, error states |
| `Destructive/Destructive 600` | `#DC2626` | Dark error, destructive action hover |

### 2.5 Tag / Chip Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `Tag/Tag Pink` | `#FAF1F5` | Ecosystem tags, Solana-type labels |
| `Tag/Tag Blue` | `#E7F3F8` | Technology tags, chain tags |
| `Tag/Tag Yellow` | `#FBF3DB` | Reward / prize tags |
| `Tag/Tag Green` | `#EDF2EC` | Active status, live tags |
| `Tag/Tag Grey` | `#F1F1EF` | Neutral category tags |
| `Tag/Tag Brown` | `#F4EEEE` | Community / discussion tags |
| `Tag/Tag Purple` | `#F6F3F9` | Event / special tags |
| `Tag/Tag Red` | `#FDEBEC` | Warning / deadline tags |
| `Tag/Tag Orange` | `#FAEBDD` | Hackathon / contest tags |

### 2.6 Code Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `Code/Code Red` | `#D34C47` | Syntax highlighting — keywords, errors |

### 2.7 Design Rules

- **The "No-Line" Rule:** 1px solid opaque borders are prohibited for sectioning. Boundaries are created through tonal shifts (`Neutral 100` → `White`), not drawn lines.
- **Border Use:** Only use `Neutral/Neutral 200` (`#E5E5E5`) for card and input borders, at 1px.
- **Ghost Border Fallback:** In high-contrast/accessibility modes, use `outline-variant` at 15% opacity.
- **Glassmorphism:** Navigation and floating popovers use `Neutral/Neutral 50` at 70% opacity + `backdrop-blur: 20px`.

---

## 3. Typography

The typography system uses two typefaces for distinct roles:

- **NEXT Book** — Display and title headings. Bold weight only, tight leading.
- **Nunito** — Body, labels, and UI text. Regular, SemiBold, Bold weights.

### 3.1 Display Scale

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `Display 2` | NEXT Book | Bold (700) | 40px | 100% (40px) | 0 | Page-level hero titles, section headers |

### 3.2 Title Scale

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `Title 1` | NEXT Book | Bold (700) | 32px | 1.5 (48px) | 0 | Main content headings |
| `Title 2` | NEXT Book | Bold (700) | 24px | 100% (24px) | 0 | Card section headings |
| `Title 3` | NEXT Book | Bold (700) | 20px | 100% (20px) | 0 | Widget headings, dialog titles |
| `Title 5` | NEXT Book | Bold (700) | 18px | 1.5 (27px) | 0 | Sub-section labels, sidebar headings |
| `Title 6` | NEXT Book | Bold (700) | 16px | 22px | 0 | Card titles, list item headings |

### 3.3 Headline Scale (Nunito Bold — UI Labels)

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `Headline L` | Nunito | Bold (700) | 18px | 100% | 0 | Section labels, prominent UI text |
| `Headline M` | Nunito | Bold (700) | 16px | 100% | 0 | Navigation items, button text |
| `Headline S` | Nunito | Bold (700) | 14px | 100% | 0 | Secondary labels, filter chips |
| `Headline XS` | Nunito | Bold (700) | 12px | 100% | 0 | Micro-labels, count badges |

### 3.4 Body Scale (Nunito Regular)

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `Body M` / `Body/M` | Nunito | Regular (400) | 16px | 1.6 (25.6px) | 0 | Primary body copy, descriptions |
| `Body S` / `Body/S` | Nunito | Regular (400) | 14px | 1.6 (22.4px) | 0 | Secondary descriptions, card metadata |
| `Body XS` | Nunito | Regular (400) | 12px | 1.5 (18px) | 0 | Captions, footnotes, tooltips |

### 3.5 Special

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `Caption 12px` | Nunito | SemiBold (600) | 12px | 100% | +3px (letter-spacing: 3) | Uppercase tracking labels, VERSION TAGS |

### 3.6 Typography Rules

- **NEXT Book** is used exclusively for headings (`Title`, `Display`). Never use for body.
- **Nunito** handles all UI labels and body copy.
- **Tight leading (100%)** applies to all Title/Headline tokens—use for anchor text only.
- **Generous leading (1.5–1.6)** applies to body tokens for readability of multi-line copy.
- **Letter spacing `+3px`** is reserved for Caption only (uppercase developer metadata tags).
- Never use blue for links; use `Primary Link` (`#009CEF`) or `Primary Neutral` (`#171717`) with underline.

---

## 4. Spacing System

| Token | Value | px equivalent | Usage |
|-------|-------|---------------|-------|
| `4px` | 4 | 4px | Micro gap — icon-to-text offset, badge padding |
| `16px` | 16 | 16px | Standard inner padding, gap between metadata items |
| (inferred) `8px` | — | 8px | Gap between icon and label, chip padding |
| (inferred) `12px` | — | 12px | List item padding, dropdown row padding |
| (inferred) `20px` | — | 20px | Card internal gap (metadata row) |
| (inferred) `24px` | — | 24px | Card padding, section inner spacing |
| (inferred) `32px` | — | 32px | Section separation |
| (inferred) `48px` | — | 48px | Major section padding |

---

## 5. Border Radius

| Usage | Value |
|-------|-------|
| Chips / Tags (pill) | `9999px` (full round) |
| Cards | `16px` |
| Dropdowns / Menus | `12px` |
| Input fields | `8px` |
| Progress bar | `3px` / `3.5px` |
| Status badges (small) | `8px` |
| Syllabus cells | `12px` |

---

## 6. Elevation & Depth

### 6.1 Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `Card Shadow` | `drop-shadow(0px 3px 10px rgba(0,0,0,0.10)), drop-shadow(0px 2px 4px rgba(0,0,0,0.08))` | Default card elevation |
| Dropdown shadow | `drop-shadow(0px 2px 4px rgba(0,0,0,0.08))` | Dropdown menu, popover |
| Completion icon inset | `inset(-1px, -2px, 0px, #34A853)` | Checkmark badge depth |

### 6.2 Tonal Layering (Surface Hierarchy)

| Level | Background | Usage |
|-------|-----------|-------|
| Level 0 — Canvas | `Neutral/Neutral 50` (`#FCFCFC`) | Outer page background |
| Level 1 — Section | `Neutral/Neutral 100` (`#F5F5F5`) | Hover states, section fill |
| Level 2 — Card | `Neutral/White` (`#FFFFFF`) | Default card surface |
| Level 3 — Hover Card | `Neutral/Neutral 100` (`#F5F5F5`) | Card hover state |
| Level 4 — Active/Selected | `Neutral/Neutral 200` (`#E5E5E5`) | Pressed, selected row |

### 6.3 Rules

- Traditional drop shadows are replaced by tonal shifts for static elements.
- Only use `Card Shadow` for cards and `Dropdown Shadow` for popovers/menus.
- Never use solid opaque 1px borders as section separators—shift surface tone instead.

---

## 7. Components

### 7.1 Cards

#### Course Card
- **Size:** 368×237px (default/hover) · 368×247px (in-progress)
- **Border:** 1px solid `#E5E5E5`
- **Border Radius:** `16px`
- **Background:** `White` → `#F5F5F5` (hover)
- **Padding:** `24px` all sides
- **Internal gap:** `16px` (default/hover) · `justify-between` (in-progress)
- **States:** Default · Hover · In Progress
  - **In Progress:** shows progress bar (`bg-[#E5E5E5]` track, `bg-[#FFE866]` fill, `6px` height, `3.5px` radius)
  - **Hover:** background shifts to `#F5F5F5`
- **Tag chip:** `bg-[#FAF1F5]`, `px-8px py-4px`, `border-radius: 8px`, `Body XS / Nunito Regular 12px`
- **Title:** `Title 6` (NEXT Book Bold 16px, lineHeight 22px)
- **Description:** `Body S` (Nunito Regular 14px, `#525252`)
- **Metadata row:** gap `20px`, icons `16×16px`, label `Body S` `#525252`

#### Ecosystem Card
- Same as Course Card in structure; 368×237px default, 368×247px in-progress

#### Glossary Card
- **Size:** 368×191px
- **States:** Default · Hover (background `#F5F5F5`)
- **Border:** 1px `#E5E5E5`, `border-radius: 16px`

#### Job Card
- **Size:** 824×191px (full width card)
- **States:** Default · Hover · Saved
- **Border:** 1px `#E5E5E5`, `border-radius: 16px`

#### Blog Card Large
- **Size:** 1136×221px
- **States:** Default · Hover

#### Blog Card Small
- **Size:** 368×431px (with tag) · 368×393px (no tag)
- **States:** Default · Hover

#### Hackathon Card (Large)
- **Size:** 1136×253px
- **Variants:** live · voting · submission · end
- **Internal layout:** text block (left) + image (right, 365×206px, `border-radius` auto)
- **Title:** Nunito Bold 27px (`leading-none`)
- **Subtitle:** Nunito Regular 21px · `#Secondary Neutral`
- **Metadata grid:** icon 16×16 + label `Body S` · spacing `gap-8px`, row `gap-20px`
- **Tag pill:** full round, 23px height, `px-8px py-2px`
- **Countdown tag:** `110px` width, inline number+unit pairs

#### Founder Course Card
- **Size:** 368×200px

---

### 7.2 Syllabus Cell

- **Size:** 744px width, height responsive per state
- **States:** Not Started · Not Started Hover · In Progress · In Progress Hover · Completed · Completed Hover
- **Padding:** `16px` all
- **Border radius:** `12px`
- **Background:**
  - Not Started: `#F5F5F5`
  - Not Started Hover: `#E5E5E5`
  - In Progress: `White` + 2px border `#E5E5E5`
  - In Progress Hover: `#F5F5F5` + 2px border `#E5E5E5`
  - Completed: `#F5F5F5`
  - Completed Hover: `#E5E5E5`
- **Title:** `Headline M` (Nunito Bold 16px)
- **Subtitle / type label:** `Body S` `#525252` + `book-open` icon 16×16
- **Progress bar** (In Progress):
  - Track: `bg-[#E5E5E5]` 80px × 6px, `border-radius: 3px`
  - Fill: `bg-[#FFE866]` 35px × 6px (≈43%), `border-radius: 3.5px`
  - Percentage label: `Body XS` `#525252`
- **Completed indicator:** Circle `24×24px` `bg-[#22C55E]`, `border-radius: 16px`, inner check icon 16×16, inset shadow `#34A853`

---

### 7.3 Dropdown Menu

- **Container:** `White` bg, 1px `#E5E5E5` border, `border-radius: 12px`, `padding: 8px`, shadow `0px 2px 4px rgba(0,0,0,0.08)`
- **Width:** `229px`
- **Row height:** `48px` (12px vertical padding each side)
- **Row padding:** `px-12px py-12px`
- **Row gap:** `12px` (icon + label)
- **Icon size:** `16×16px`
- **Label:** `Body M` (Nunito Regular 16px, `#171717`)
- **Active / Selected row:** `bg-[#F5F5F5]`, `border-radius: 8px`
- **Chevron icon:** `16×16px` right-aligned for sub-menu indicator
- **Language sub-menu:** same container, two rows (`简体中文` / `English`)

---

### 7.4 Tags & Chips

- **Height:** `23px` (standard) · `26px` (large) · `19px` (compact)
- **Padding:** `px-8px py-2px` (standard)
- **Border radius:** `9999px` (pill) or `8px` (rectangular chip)
- **Typography:** `Body XS` / Nunito Regular 12px
- **Background:** Use Tag color tokens (see Section 2.5)
- **Text color:** `#171717` (Primary Neutral)
- **Countdown tag:** inline `{number}{unit}` pairs with `gap-4px`, uses `Body XS` for unit and `Headline S` weight for number

---

### 7.5 Progress Bar

- **Track:** `bg-[#E5E5E5]` · height `6px` · `border-radius: 3px`
- **Fill:** `bg-[#FFE866]` (Primary Yellow) · `border-radius: 3.5px`
- **Orientation:** horizontal (rotate-90 transform used in implementation)
- **Label:** percentage text `Body XS` `#525252`, right of bar with `gap-8px`

---

### 7.6 Status / Completion Indicator

| State | Background | Icon | Shadow |
|-------|-----------|------|--------|
| Completed (16px) | `#22C55E` | check 12×12px | none |
| Completed (24px) | `#22C55E` | check 16×16px | `inset(-1px,-2px,0,#34A853)` |
| Not Started | — | empty circle outline or no icon | — |
| In Progress | Progress bar (see 7.5) | — | — |

---

### 7.7 Metadata Row (Card Footer)

Used consistently across Course, Ecosystem, Job, Hackathon cards:

- **Layout:** horizontal flex, `gap-20px`
- **Item:** icon `16×16px` + label `Body S` (Nunito Regular 14px, `#525252`), `gap-8px`
- **Common icons:** `code` (language), `bar-chart` (difficulty), `book` (category), `clock`, `signal` (level), `money-bill` (prize), `award`
- **Icon style:** outline, 1px–1.5px stroke weight, `16×16px` target area

---

## 8. Icon System

- **Size grid:** `16×16px` standard · `24×24px` medium · `32×32px` large
- **Style:** Phosphor Icons (outline variant), 1.5px stroke
- **Color:** inherits from parent text color (`#525252` or `#171717`)
- **Key icons used in system:**
  - `code` — programming language indicator
  - `bar-chart` — difficulty level
  - `book` / `book-open` — content type
  - `clock` — time remaining
  - `u:signal` — skill level
  - `u:money-bill` — prize/reward
  - `u:award` — winner indicator
  - `check` — completion
  - `user` — profile
  - `settings` — configuration
  - `log-out` — authentication
  - `chevron-right` — navigation sub-menu

---

## 9. Layout & Grid

- **Base grid:** 40px blueprint grid overlay using `outline-variant` at 5% opacity
- **Container padding:** `24px` (card) · `16px` (list item) · `12px` (dropdown row)
- **Section gap:** minimum `32px` between major sections; `48px` preferred for premium feel
- **Card width:** 368px (standard) · 824px (job, wide) · 1136px (blog large, hackathon)
- **Content canvas:** `Neutral/Neutral 50` (`#FCFCFC`) with `Neutral/Neutral 300` outer border
- **Asymmetric layout rule:** Allow elements to "break the container" edge intentionally for editorial feel

---

## 10. Motion & Interaction

| Interaction | Behavior |
|-------------|----------|
| Card hover | Background transitions from `White` → `#F5F5F5` |
| Syllabus row hover | Background shifts one tone darker (`#F5F5F5` → `#E5E5E5`) |
| Progress bar | No animation on static display; animate on mount with ease-out |
| Dropdown open | Appears with `drop-shadow` applied; no sliding animation specified |
| Completion check | Static circle; inset shadow simulates depth |

---

## 11. Do's and Don'ts

### Do
- **Do** use `Primary Yellow` (`#FFE866`) for progress bars, active states, and key data highlights.
- **Do** separate sections by tonal background shifts, not lines.
- **Do** use NEXT Book exclusively for headings and Nunito for all body/UI text.
- **Do** use `gap-20px` between metadata icon-label pairs in card footers.
- **Do** use `Card Shadow` (dual drop-shadow) for elevated card components.
- **Do** maintain `16px` border-radius on cards for a premium, modern feel.
- **Do** use pill (9999px) radius for status badges and countdown chips.
- **Do** use the semantic color system: green for completion, yellow for progress, red for destructive.

### Don't
- **Don't** use 1px solid opaque borders to separate page sections.
- **Don't** use blue (`#009CEF`) for anything other than links and interactive actions.
- **Don't** use Nunito for headings—NEXT Book is the exclusive heading typeface.
- **Don't** mix tag background colors arbitrarily—each tag token has a semantic category.
- **Don't** use flat solid primary colors on buttons without tonal depth.
- **Don't** place metadata icons smaller than 16×16px.
- **Don't** use regular-weight text for card titles—NEXT Book Bold only.

---

## 12. Component Node Reference (Figma)

| Component | Figma Node ID | Notes |
|-----------|--------------|-------|
| Dropdown Menu | `19:574` | Includes Language sub-menu |
| Course Syllabus Cell | `187:5917` | 6 states |
| Course Cards | `230:6860` | 3 states (Default/Hover/In Progress) |
| Ecosystem Cards | `870:670` | 3 states |
| Glossary Cards | `249:7213` | 2 states |
| Job Cards | `252:8601` | 3 states (Default/Hover/Saved) |
| Blog Card Large | `260:9220` | 2 states |
| Blog Card Small | `260:9254` | 3 variants |
| Hackathon Large Cards | `1853:962` | 4 variants (live/voting/submission/end) |
| Hackathon Small Cards | `1852:1001` | 3 variants (leader/reward/default) |
| Founder Course Cards | `1592:1175` | 2 variants |

**Figma File:** [HackQuest Design System v4](https://www.figma.com/design/iFNHNupOW8yf3xdEBbUYAS/%E2%9A%99%EF%B8%8F-HackQuest-Design-System-v4?node-id=19-501)
