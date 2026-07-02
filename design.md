# LingoTown Design Specification

Source: Figma file `LingoTown UI Design`, page `03 Knowledge Map - Reference Pixel Layout`.

Purpose: this document captures the current visual system as a `design.md` style specification for UI generation and frontend handoff. It describes the product tone, design tokens, layout rules, components, states, and asset usage visible in the current Figma work.

## Product Direction

LingoTown is a calm pixel-art language learning app. The product combines a structured productivity shell with game-like town progression. The interface should feel friendly and approachable, but the learning task must always stay clear.

Core principles:

- Learning route first: every screen should show where the learner is, what step is active, and what action comes next.
- Pixel charm inside clean UI: pixel icons and location art provide personality; layout, cards, controls, and copy stay simple and readable.
- One primary action: each screen should have one dominant purple CTA.
- State clarity: active uses purple, complete uses green, locked uses muted gray, error uses red.
- No overlap: all screen layouts must use auto layout or equivalent flex/grid constraints. Text must wrap or truncate inside its container.

## Design Tokens

The Figma file currently has no local Variable collections. It uses local Paint Styles and Effect Styles. Treat the following as source tokens.

### Color

| Token | Hex | Figma style | Usage |
|---|---:|---|---|
| `color.text.primary` | `#464563` | `primary` | Primary text, default icons, nav labels |
| `color.border.default` | `#DDD7D2` | `border` | Card borders, dividers, input borders |
| `color.text.secondary` | `#77748A` | `second` | Secondary text, metadata, locked labels |
| `color.accent.purple` | `#4E28D6` | `hight light` | Active route, selected state, key accent text |
| `color.bg.surface-muted` | `#F8F6F4` | `dack bg` | Muted page or card background |
| `color.border.highlight` | `#D8CCFF` | `hilight boarder` | Active card border, focus outline |
| `color.bg.highlight` | `#FAF7FF` | `highlight` | Active card tint, selected row background |
| `color.bg.surface` | `#FBFAF8` | `bg2` | Main panels and white card alternative |
| `color.bg.success` | `#F3F7F5` | `green bg` | Success chip background |
| `color.danger` | `#D75151` | `Incorrect` | Incorrect answer, missed word |
| `color.bg.danger` | `#FBF4F4` | `red bg` | Error card or retry state background |
| `color.success` | `#4AAC6E` | `succissful` | Complete check, correct state |
| `color.bg.info` | `#F1F7FA` | `blue bg` | Informational chip background |
| `color.info` | `#0284C7` | `new blue` | Next state, audio/info accents |

Observed supporting colors:

| Token | Hex | Usage |
|---|---:|---|
| `color.bg.app` | `#F3F0EE` | Global canvas background |
| `color.bg.card` | `#FFFFFF` | Cards, side panels, popovers |
| `color.text.strong` | `#2F2E44` | Strong headings and card titles |
| `color.text.deep` | `#101330` | Large dialogue and lesson text |
| `color.primary.cta` | `#5828DB` | Main button fill and selected nav |
| `color.warning` | `#FBBF24` | Coins, sun, warning state |
| `color.orange` | `#FFC362` | Coin fill and warm game accents |
| `color.gray.subtle` | `#EFECEA` | Subtle separators |
| `color.gray.icon` | `#8F8EA8` | Disabled and locked icon strokes |

### CSS Token Baseline

```css
:root {
  --lt-bg-app: #f3f0ee;
  --lt-bg-card: #ffffff;
  --lt-bg-surface: #fbfaf8;
  --lt-bg-muted: #f8f6f4;
  --lt-bg-highlight: #faf7ff;
  --lt-bg-success: #f3f7f5;
  --lt-bg-danger: #fbf4f4;
  --lt-bg-info: #f1f7fa;

  --lt-text-primary: #464563;
  --lt-text-strong: #2f2e44;
  --lt-text-deep: #101330;
  --lt-text-secondary: #77748a;

  --lt-border-default: #ddd7d2;
  --lt-border-highlight: #d8ccff;
  --lt-border-subtle: #efecea;

  --lt-primary: #4e28d6;
  --lt-primary-cta: #5828db;
  --lt-success: #4aac6e;
  --lt-danger: #d75151;
  --lt-info: #0284c7;
  --lt-warning: #fbbf24;
}
```

## Typography

Primary UI font: `Inter`.

Observed font usage:

| Font | Usage |
|---|---|
| `Inter Medium` | Main labels, compact body, metadata |
| `Inter Semi Bold` | Buttons, selected labels, strong controls |
| `Inter Bold` | Page titles, step titles, node titles |
| `Inter Regular` | Descriptions and helper text |
| `VT323 Regular` | Pixel/game decorative text only |
| `Share Regular` | Pixel or game-adjacent decorative labels |

Type scale:

| Token | Size | Weight | Line height | Usage |
|---|---:|---|---:|---|
| `text.hero-pixel` | 100px+ | Regular | Auto | Large canvas labels only, not app UI |
| `text.page-title` | 24px | Bold | 118%-140% | Page title, panel title |
| `text.section-title` | 20px | Bold/Semi Bold | 135%-142% | Step title, card heading |
| `text.card-title` | 18px | Bold/Semi Bold | 142% | Route node title, word card title |
| `text.body` | 16px | Medium/Regular | 140%-142% | Body text, descriptions, CTA text |
| `text.label` | 14px | Medium/Semi Bold | 140%-142% | Nav label, tab, metadata |
| `text.caption` | 13px | Medium | 142% | Chips, timing, helper copy |
| `text.micro` | 12px | Medium | 142% | Small captions and level labels |

Rules:

- Use `Inter` for all product UI and learning content.
- Use pixel fonts only inside decorative assets or large page annotations.
- Avoid negative letter spacing.
- Dialogue and lesson text can use `text.deep` for stronger contrast.
- Keep line height around 1.35-1.42 for readability.

## Layout System

Primary desktop frame:

- Width: `1440px`
- Common height: `900px` or `960px`
- Canvas background: `#F3F0EE`
- Shell structure: left rail + main content + right contextual panel
- Default page padding: `24px`
- Default card gap: `16px` to `24px`

Observed spacing:

| Token | Value | Usage |
|---|---:|---|
| `space.4` | 4px | Icon/text micro gap |
| `space.8` | 8px | Chip padding, tight row gap |
| `space.12` | 12px | Small control padding |
| `space.16` | 16px | Card internal spacing |
| `space.20` | 20px | Form row gap |
| `space.24` | 24px | Page padding, card section gap |
| `space.30` | 30px | Large panel internal padding |
| `space.32` | 32px | Main content separation |

Auto layout rules:

- Every repeated list, route card, step row, tab row, chip row, sidebar, and form section must be auto layout.
- Use `Hug contents` for chips, buttons, labels, icon containers, and text groups.
- Use `Fill container` for main cards, search fields, input fields, progress tracks, and flexible text containers.
- Do not place text with fixed absolute positions inside resizable cards unless the parent is a decorative asset.
- Cards should resize vertically when helper text wraps.
- Right panels must stay within viewport height and use vertical auto layout with consistent gaps.

## Shape, Border, and Effects

Corner radius:

| Token | Value | Usage |
|---|---:|---|
| `radius.xs` | 6px | Tiny chips, icon badges |
| `radius.sm` | 8px | Buttons, segmented controls, small cards |
| `radius.md` | 12px | Inputs, step rows, word cards |
| `radius.lg` | 16px | Major panels and sidebars |
| `radius.pill` | 999px | Status pills, circular avatars, progress dots |

Border:

- Default card border: `1px solid #DDD7D2`.
- Active/focus border: `1px solid #4E28D6` or `#D8CCFF`.
- Muted dividers: `#EFECEA`.
- Disabled items use low contrast border and secondary text.

Effects:

Figma local Effect Styles:

| Style | Usage |
|---|---|
| `shadow` | Soft panel elevation, popovers |
| `highlight` | Active selection glow |

Use shadows sparingly. The UI should feel clean and flat, with only active cards or floating popovers receiving extra elevation.

## Iconography and Image Assets

System icons:

- Use Phosphor Icons Light style for UI controls.
- Stroke weight should be light, usually `1.5px` to `2px`.
- Icon size defaults: `16px`, `20px`, `24px`.
- Icon color defaults to `#464563`; active icons use `#4E28D6`; disabled uses `#77748A`.

Pixel assets:

- Use 16-bit / 32-bit pixel art with thick dark outline.
- Icons should be square, centered, and readable at `48px`, `64px`, `85px`, and `202px`.
- Keep white or transparent background.
- Do not add text inside generated pixel icons unless it is an unreadable decorative sign.

Known pixel asset categories:

- Route locations: Cafe Luz, A0 Quick Start, Mercado Verde, Street, Hotel, Help, Airport, Restaurant, Advanced Scenes.
- Word icons: cafe cup, water glass, teapot/cup, milk carton, smiley, apple, toilet, service bell.
- Learning assets: A1 badge, hidden answer, keyboard, microphone, map icon, completion medal, fireworks.
- NPC assets: Ana/barista portrait.

## App Shell Components

### Top Bar

Purpose: global learning context and account status.

Content:

- Current path or location: e.g. `Spanish Travel`, `Cafe Luz`, `Mercado Verde`.
- Day indicator: `Day 2`.
- Time: e.g. `08:12`.
- Streak: flame icon + `3 day streak`.
- Coins: coin icon + amount.
- Avatar: circular initials.
- Settings icon.

Layout:

- Height around `80px` to `88px`.
- Center status pill uses white surface, border, and compact horizontal auto layout.
- Right account cluster uses horizontal auto layout with dividers.

States:

- Default: all values visible.
- Active location: purple map pin or location icon.
- Missing value: preserve slot size and show muted placeholder.
- Mobile/folded: compress center pill before hiding critical progress data.

### Left Navigation

Purpose: primary app navigation.

Items:

- Map/Town
- Learn
- Notebook
- Profile
- Help

Layout:

- Expanded rail width around `96px` to `124px`.
- Collapsed mode should keep icons visible and hide text.
- Active item uses purple icon/text, light purple background, and left indicator.
- Inactive item uses `#464563` or `#77748A`.

States:

- Default, hover, active, disabled.
- Collapsed rail: tooltip required for icon-only labels.
- Help item may pin to bottom.

## Core Screens

### Knowledge Map / Town Shell

Purpose: show route progression and current daily node.

Layout:

- Left rail.
- Top bar.
- Main route panel: list/timeline of town nodes.
- Right panel: today's node steps and CTA.

Route card content:

- Pixel location icon.
- Node title.
- State chip or status text.
- Reward cluster when relevant.
- Optional NPC preview for active node.

Route states:

- `Completed`: green check, success text, muted active border if past.
- `Today`: purple active border, highlighted background, current chip.
- `Next`: blue or purple outlined state, available CTA.
- `Available`: normal card, secondary metadata.
- `Locked`: gray title, lock icon, muted icon.
- `Coming soon`: gray title, disabled border, no CTA.

Right panel content:

- Current node title.
- Pixel location image.
- Micro-lesson list: Words, Memory Check, Pattern, Listen, Try Conversation, Recap.
- Step state badges.
- Primary CTA: `Start today's node`.
- Secondary CTA: `Review due words`.
- Info strip: conversation is part of node.

Boundary conditions:

- Long node names truncate after one line in route cards.
- Step list must remain scroll-free at 1440x960; if content grows, reduce spacing before reducing type.
- Locked future nodes must not look clickable unless preview is allowed.

### Learn Hub

Purpose: continue active node, review due words, and access unlocked practice.

Layout:

- Main content column with continue card, review due section, unlocked practice grid.
- Right column with map context, purpose explanation, and today's goal.

Key components:

- Continue node card with large pixel icon, progress bar, step chips, primary CTA.
- Review due word cards with word icon, pronunciation button, due date, memory status.
- Practice scene cards with location icon and module availability.

States:

- Active step: purple numbered chip.
- Completed step: green check.
- Locked practice: gray lock and disabled CTA.
- Review due: purple count chip.
- Empty review: show "No words due today" and route CTA.

### Lesson Step Screens

Common structure:

- Left step navigation panel.
- Central lesson workspace.
- Right helper/context panel.
- One primary bottom CTA.

Step statuses:

- Pending: gray number.
- Active: purple number and selected row.
- Completed: green check.
- Locked: lock icon and muted text.

Words step:

- Word cards: icon, Spanish word, translation, audio button, repeat button.
- Selected word opens practice tray.
- Retry section appears only after missed or weak words.
- Progress bar requires repeated/heard count before next step unlocks.

Memory Check:

- Large image prompt.
- Hidden answer.
- Input field and check button.
- Mistake counter and retry count.
- Correct: green success feedback and auto advance.
- Incorrect: red feedback and add to retry.

Pattern Build:

- Pattern prompt with target sentence.
- Input or voice action.
- Hints panel with show pattern and show words.
- Full answer remains hidden until attempt.
- Round count must be visible.

Listen:

- Audio dialogue card with speaker portrait, waveform, play state, transcript control.
- Choose heard words buttons.
- Heard summary chip.
- Replay allowed.

Try Conversation:

- NPC dialogue card.
- Word tap tooltip with add-to-word-bank action.
- Reply input with microphone and send.
- Language tools panel: goal, words, pattern, examples.
- NPC context panel: memory and relationship state.

Completion:

- Celebration badge, optional pixel fireworks.
- Route progress bar.
- Summary cards for words saved, pattern used, conversation completed.
- Primary CTA: continue on map.
- Secondary CTA: review words later.
- Next node preview on the right.

### Notebook / Word Bank

Purpose: review saved vocabulary and patterns.

Layout:

- Left notebook subnav: Word Bank, Pattern Book, History.
- Main word grid with filters and search.
- Right detail panel for selected word.

Word card content:

- Pixel word icon.
- Spanish word and translation.
- Source node.
- Status chip: New, Seen, Recalled, Used.
- Next review date.
- Audio action.

Filters:

- All
- Due soon
- Used
- Recalled
- Seen
- Source node filters
- Sort by review order

Right detail:

- Large word icon.
- Word and translation.
- Pronunciation button.
- Example sentence.
- Source and added date.
- Status timeline.
- Next review.
- Practice now and mark familiar actions.

Boundary conditions:

- Grid card titles should not wrap more than two lines.
- Detail panel stays fixed width.
- Empty search shows no-results state with reset filters.

### Profile / Settings

Purpose: account, learning preferences, progress, and recommendation controls.

Layout:

- Main profile card and settings sections.
- Right rail with progress, streak, current map node, account actions.

Sections:

- Profile summary: avatar, name, current path, vocabulary level, member since.
- Learning settings: starting point, beginner support, translations, review reminders.
- Language and voice: learning language, voice/accent, playback speed, recording status.
- Daily goal: duration segmented control, reminder time, save settings.

States:

- Toggle on: purple fill.
- Toggle off: muted border and background.
- Segmented active: purple fill and white text.
- Save success: temporary success strip.
- Destructive recommendation reset: warning background and explicit copy.

## Components

### Card

Default:

- Fill `#FFFFFF` or `#FBFAF8`.
- Border `#DDD7D2`.
- Radius `12px` or `16px`.
- Padding `16px` to `30px`.

Active:

- Border `#4E28D6` or `#D8CCFF`.
- Background `#FAF7FF`.
- Optional `highlight` shadow.

Disabled:

- Text `#77748A`.
- Border `#DDD7D2`.
- Pixel image opacity may be reduced, but keep readable.

### Button

Primary:

- Fill `#5828DB` or `#4E28D6`.
- Text white.
- Radius `8px` to `12px`.
- Height `44px` to `56px`.
- Use icon + label when action is important.

Secondary:

- White or `#FBFAF8` fill.
- Border `#DDD7D2` or `#D8CCFF`.
- Text `#464563` or purple.

Disabled:

- Muted fill.
- Text `#77748A`.
- No shadow.

### Chip / Pill

Use for state, filters, and small metadata.

- Default height `22px` to `32px`.
- Horizontal padding `8px` to `12px`.
- Radius `999px` or `8px`.
- Active filter: purple fill and white text.
- Informational filter: white fill, default border.

### Step Row

Content:

- Number/check/lock badge.
- Step title.
- Subtitle.
- Optional time or status.

States:

- Active: purple border and tint.
- Completed: green check.
- Locked: muted and disabled.
- Available: white card with default border.

### Input

- Height `44px` to `64px`.
- Border `#DDD7D2`.
- Focus border `#4E28D6`.
- Placeholder `#77748A`.
- Error border `#D75151`.
- Include icon slot only when functional.

### Progress Bar

- Track: `#DDD7D2` or `#E7E5EF`.
- Fill: `#4E28D6` for active learning; `#4AAC6E` for completed route.
- Height `6px` to `8px`.
- Radius pill.

## Interaction and State Rules

Hover:

- Slightly deepen border or tint background.
- Do not shift layout.

Focus:

- Use visible purple outline or border.
- Keyboard focus must be visible on all buttons, inputs, step rows, and nav items.

Pressed:

- Darken purple by one step or reduce opacity slightly.

Loading:

- Preserve card dimensions.
- Use skeleton lines or disabled CTA with spinner.

Error:

- Use `#D75151` for text/icon.
- Use `#FBF4F4` for background.
- Explain what to retry.

Empty:

- Use a calm card with a clear next action.
- Avoid decorative empty states that hide the route.

Locked:

- Show lock icon.
- Explain unlock requirement if space allows.
- Do not use primary button styling.

## Content Rules

Tone:

- Direct, supportive, and task-focused.
- Avoid long educational paragraphs in main workflow.
- Use short subtitles under section titles.

Examples:

- `Continue today's node: Cafe Luz`
- `Order one drink with Ana.`
- `Words to review today`
- `No pronunciation score in 6.1 - repeat action only.`

Do not:

- Mix Chinese UI labels into English delivery screens unless the product intentionally supports bilingual copy.
- Place implementation notes inside app frames.
- Use explanatory paragraphs where a status chip or short helper line is enough.

## Accessibility

- Maintain strong text contrast on white and muted backgrounds.
- Do not communicate state only through color; pair color with icon or label.
- Icon-only controls require tooltip or accessible label.
- Inputs require visible labels or strong contextual heading.
- Keep touch targets at least `40px`; primary CTAs should be `44px+`.
- Audio actions must expose text alternatives.

## Frontend Implementation Notes

Recommended structure:

```txt
AppShell
  TopBar
  LeftNav
  MainContent
  RightContextPanel
```

Use CSS variables from this file as canonical tokens. Implement layout with flex/grid:

- `LeftNav`: fixed width, collapsible.
- `TopBar`: fixed height.
- `MainContent`: `minmax(0, 1fr)` to prevent overflow.
- `RightContextPanel`: fixed width on desktop, collapsible/drawer on smaller screens.
- Repeated rows and cards must use component arrays, not manually positioned elements.

Responsive behavior:

- Desktop target is `1440px`.
- At narrower widths, collapse left nav to icons first.
- Then stack or drawer the right context panel.
- Keep the active lesson workspace visible before secondary panels.

## Figma Handoff Notes

Current source facts:

- Page: `03 Knowledge Map - Reference Pixel Layout`
- Main desktop frame size: `1440 x 960`
- Paint styles exist; local variables do not.
- Local paint styles: `primary`, `border`, `second`, `hight light`, `dack bg`, `hilight boarder`, `highlight`, `bg2`, `green bg`, `Incorrect`, `red bg`, `succissful`, `blue bg`, `new blue`.
- Local effect styles: `shadow`, `highlight`.
- Main repeated components are named around `Left Nav`, `Top Bar`, `Route Card`, `Today Panel`, `Step row`, `Primary button`, `Chip`, `Account`, `Selected Word Detail`.

Recommended cleanup before frontend handoff:

- Convert paint styles into Figma Variables with normalized names.
- Fix typo style names while preserving mapping: `hight light` -> `accent/purple`, `hilight boarder` -> `border/highlight`, `dack bg` -> `background/muted`, `succissful` -> `success`.
- Create shared component sets for Button, Chip, Card, Step Row, Nav Item, Word Card, and Progress Bar.
- Keep pixel assets as exported PNG/WebP resources with stable names.

