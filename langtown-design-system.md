# LangTown Design System

> Reference format: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) and [getdesign Airbnb design-md](https://getdesign.md/airbnb/design-md).  
> Source UI: LangTown 6.1 screenshots for knowledge map, word learning, memory check, pattern, listen, conversation, recap, and notebook.

## 1. Product Direction

LangTown is a pixel-art language learning product with a calm productivity shell. The interface should feel like a structured learning town: friendly, game-like, but still clear enough for daily study.

### 1.1 Design Principles

- **Learning first:** every screen must make the current lesson, step, and next action obvious.
- **Pixel charm inside clean UI:** pixel-art assets provide warmth; cards, controls, and layout stay crisp and modern.
- **Progress is visible:** users should always see location, day, streak, route progress, lesson step, and completion state.
- **One primary action per screen:** use a single purple primary CTA for the next learning action.
- **Soft focus, strong state:** the active item uses purple borders, glow, and filled step markers; completed items use green checks.

---

## 2. Color System

### 2.1 Core Tokens

| Token | Hex | Usage |
|---|---:|---|
| `color.bg.canvas` | `#FFFFFF` | App background, top-level canvas |
| `color.bg.subtle` | `#FBFAFF` | Side panels, active card tint, right rail tint |
| `color.bg.panel` | `#FFFFFF` | Cards, panels, inputs, list items |
| `color.bg.elevated` | `#FFFFFF` | Floating popovers, dropdowns |
| `color.text.primary` | `#0B123D` | Main headings, primary labels |
| `color.text.secondary` | `#3F4A78` | Body copy, descriptions |
| `color.text.muted` | `#6D759E` | Metadata, helper text |
| `color.text.placeholder` | `#9AA1C2` | Input placeholder, disabled text |
| `color.border.default` | `#DDE1EE` | Default card/input border |
| `color.border.subtle` | `#EEF0F7` | Dividers, table lines |
| `color.border.focus` | `#6A3CF0` | Active cards, inputs, selected nav |

### 2.2 Brand Purple

| Token | Hex | Usage |
|---|---:|---|
| `color.primary.50` | `#F6F2FF` | Light purple panel background |
| `color.primary.100` | `#EEE7FF` | Active list item fill, info strips |
| `color.primary.200` | `#D6C6FF` | Secondary button border, progress track accent |
| `color.primary.500` | `#5D32D9` | Main brand purple, selected step dots |
| `color.primary.600` | `#4D22D0` | Primary button gradient start |
| `color.primary.700` | `#3515B8` | Pressed primary button |
| `color.primary.glow` | `rgba(93, 50, 217, 0.24)` | Active card glow |

### 2.3 Semantic Tokens

| Token | Hex | Usage |
|---|---:|---|
| `color.success.50` | `#ECFDF3` | Success chip background |
| `color.success.500` | `#12A05C` | Completed check, positive state |
| `color.success.600` | `#078A4C` | Success text |
| `color.info.500` | `#2F80ED` | Next node, audio control, progress nodes |
| `color.warning.500` | `#FFB020` | Day/time icon, coin highlight |
| `color.danger.500` | `#E5484D` | Missed word, incorrect state |
| `color.locked.500` | `#8A90A8` | Locked and unavailable states |

### 2.4 Component Color Rules

- Use purple only for active selection, current step, primary CTA, and key learning actions.
- Use green only for completion and correctness.
- Use blue for “next”, audio, and secondary progress states.
- Use gray for locked, disabled, and future content.
- Pixel-art icons may use richer colors, but surrounding UI should stay within the token system.

### 2.5 CSS Variables

```css
:root {
  --lt-bg-canvas: #ffffff;
  --lt-bg-subtle: #fbfaff;
  --lt-bg-panel: #ffffff;
  --lt-text-primary: #0b123d;
  --lt-text-secondary: #3f4a78;
  --lt-text-muted: #6d759e;
  --lt-border-default: #dde1ee;
  --lt-border-subtle: #eef0f7;
  --lt-primary-50: #f6f2ff;
  --lt-primary-100: #eee7ff;
  --lt-primary-200: #d6c6ff;
  --lt-primary-500: #5d32d9;
  --lt-primary-600: #4d22d0;
  --lt-primary-700: #3515b8;
  --lt-success-500: #12a05c;
  --lt-info-500: #2f80ed;
  --lt-warning-500: #ffb020;
  --lt-danger-500: #e5484d;
  --lt-locked-500: #8a90a8;
}
```

---

## 3. Typography

The UI should use a rounded, readable sans-serif for learning content and a pixel-style typeface only for pixel-art labels or decorative in-world text.

### 3.1 Font Stack

| Token | Font Stack | Usage |
|---|---|---|
| `font.ui` | `"Inter", "Nunito Sans", system-ui, sans-serif` | Product UI, labels, buttons |
| `font.learning` | `"Nunito Sans", "Inter", system-ui, sans-serif` | Lesson content and helper text |
| `font.pixel` | `"Press Start 2P", "Pixelify Sans", monospace` | Optional pixel headings inside game-world assets |

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---:|---:|---:|---|
| `text.display` | 34px | 42px | 800 | Completion title, major result screens |
| `text.page-title` | 28px | 36px | 800 | Notebook title, Knowledge Map |
| `text.step-title` | 26px | 34px | 800 | `Step 1/6 · Words` |
| `text.card-title` | 20px | 28px | 800 | Node title, panel title |
| `text.body` | 16px | 26px | 500 | Descriptions, instructional copy |
| `text.label` | 15px | 22px | 700 | Buttons, tabs, list titles |
| `text.caption` | 13px | 20px | 500 | Metadata, helper text |
| `text.micro` | 12px | 18px | 600 | Chips, status labels |

### 3.3 Typography Rules

- Never use letter spacing below `0`.
- Keep body copy at `16px` minimum for study instructions.
- Use weight and spacing before adding new colors for hierarchy.
- Limit pixel-style font to decorative or in-world text; do not use it for dense UI controls.

---

## 4. Layout System

### 4.1 Desktop Shell

| Region | Width / Behavior | Notes |
|---|---|---|
| `App rail` | 88px fixed | Icon nav: Map/Town, Learn, Notebook, Profile |
| `Top bar` | 80px height | Logo left, location/day/time center, streak/coin/user/settings right |
| `Left context panel` | 280-320px | Current node, step list, vocabulary level |
| `Main content` | Flexible, max readable area | Primary lesson interaction |
| `Right support panel` | 300-360px | Rules, hints, tools, detail panel |

### 4.2 Spacing Scale

| Token | Value | Usage |
|---|---:|---|
| `space.1` | 4px | Icon/text gap, tiny offsets |
| `space.2` | 8px | Compact internal gaps |
| `space.3` | 12px | Chips, small cards |
| `space.4` | 16px | Default card padding |
| `space.5` | 20px | Section gaps |
| `space.6` | 24px | Panel padding |
| `space.8` | 32px | Major content groups |
| `space.10` | 40px | Page section padding |

### 4.3 Radius Scale

| Token | Value | Usage |
|---|---:|---|
| `radius.sm` | 8px | Chips, small buttons |
| `radius.md` | 12px | Inputs, tabs, word cards |
| `radius.lg` | 16px | Panels, lesson cards |
| `radius.full` | 999px | Avatars, step dots, pills |

### 4.4 Shadow Scale

| Token | Value | Usage |
|---|---|---|
| `shadow.card` | `0 8px 24px rgba(11, 18, 61, 0.06)` | Default panels |
| `shadow.active` | `0 14px 32px rgba(93, 50, 217, 0.22)` | Current node, selected learning card |
| `shadow.popover` | `0 16px 40px rgba(11, 18, 61, 0.14)` | Tooltips, word definition popover |

---

## 5. Navigation Components

### 5.1 App Rail

Use a narrow vertical rail with icon + label. The active item is a soft purple tile.

| State | Visual |
|---|---|
| Default | Transparent background, navy icon, navy label |
| Hover | `color.primary.50` background |
| Active | `color.primary.100` background, purple icon/text, optional 4px active bar |
| Disabled | 45% opacity, no hover elevation |

### 5.2 Top Status Bar

The center status capsule shows:

- Location: `Cafe Luz`, `Mercado Verde`, or `Spanish Travel`
- Day: `Day 2`
- Time: `08:12`, `08:16`, etc.

The right status group shows:

- Streak: flame icon + `3 day streak`
- Coins: coin icon + `120`
- User avatar: circular `la`
- Settings icon

Use vertical dividers between status groups, not heavy borders.

---

## 6. Learning Components

### 6.1 Primary Button

Primary buttons are purple gradient blocks for forward movement.

| Property | Value |
|---|---|
| Height | 56-64px |
| Radius | 10-12px |
| Fill | `linear-gradient(135deg, #5D32D9 0%, #4322D9 100%)` |
| Text | White, 18px, 800 |
| Icon | Left play or right arrow, white |

#### States

| State | Style |
|---|---|
| Default | Purple gradient, `shadow.card` |
| Hover | Slightly brighter gradient, translateY(-1px) |
| Pressed | `color.primary.700`, no translate |
| Focus | 3px ring `rgba(93, 50, 217, 0.25)` |
| Disabled | Gray fill `#EEF0F7`, muted text, no shadow |

### 6.2 Secondary Button

Used for review, back to map, mark familiar, and schedule actions.

| Property | Value |
|---|---|
| Fill | `#FFFFFF` |
| Border | `1px solid #D6C6FF` |
| Text | `color.primary.600` |
| Height | 48-56px |

### 6.3 Word Card

Used in `Step 1/6 · Words` and Word Bank.

| Element | Spec |
|---|---|
| Container | White card, 1px border, 12px radius |
| Selected | Purple border, faint purple fill |
| Image | Pixel icon, 72-96px square |
| Word | 20px bold, navy |
| Translation | 15px, secondary text |
| Audio button | 32px icon button, blue icon |
| Repeat button | 44px high, white, border, mic icon |

### 6.4 Step List Item

Used in the left lesson context panel.

| State | Visual |
|---|---|
| Current | Purple border, purple number dot, light purple fill |
| Completed | White card, green check at right |
| Locked | Gray number dot with lock icon |
| Upcoming | White card, muted subtitle |

Content format:

```text
1  Words
   See it, hear it, say it.
```

### 6.5 Knowledge Map Node

The knowledge map is a vertical route with dotted connector line.

| State | Visual |
|---|---|
| Completed | Green check dot, normal white node card |
| Today | Large purple pin, purple card border, active glow |
| Next | Blue numbered dot, `Next` chip |
| Available | Blue numbered dot, muted text |
| Locked | Gray dot, lock icon, muted text |
| Coming soon | Gray dot, muted label |

Node card content:

- Pixel location icon
- Title: `Cafe Luz`, `Mercado Verde`, `Street`
- Status chip: `Today`, `Next`, `Available`, `Coming soon`
- Optional details: Chinese phrase, estimated time

### 6.6 Memory Check Input

Used in `Step 2/6 · Memory Check`.

| Element | Spec |
|---|---|
| Prompt image panel | Large soft purple panel, centered pixel image |
| Hint row | Lightbulb icon + hidden answer language |
| Input | 56px height, 12px radius, 1px border |
| Check button | 56px height, purple gradient |
| Footer metrics | Word index, mistakes count |

### 6.7 Pattern Builder

Used in `Step 3/6 · Pattern`.

Pattern hero card:

- Large pixel speech bubble or location-related icon
- Sentence template: `Quiero _____, por favor.`
- Translation line below
- Audio icon button at right

Choice buttons:

- Selected answer uses purple border, left check circle, and light purple fill.
- Unselected answer is white with default border.
- Wrong answer should use red border and error text.

### 6.8 Listen Dialogue

Used in `Step 4/6 · Listen`.

| Element | Spec |
|---|---|
| Speaker row | Avatar, speaker name, role, dialogue text |
| Waveform | Purple waveform line under transcript |
| Play button | Circular 64px purple outline button |
| Locked line | Blurred/low-opacity transcript + lock button |
| Heard words | Selectable word pills with green check when selected |

### 6.9 Try Conversation

Used in `Step 5/6 · Try Conversation`.

Core layout:

- NPC line card with avatar, role, sentence, translation toggle.
- Inline dictionary popover anchored to selected word.
- History accordion.
- Recommended sentence strip.
- Large reply input with mic and send buttons.
- Feedback rubric: Meaning, Words used, Pattern used.

The send action is the primary action inside the input, not a full-width page CTA.

### 6.10 Recap

Used in `Step 6/6 · Recap`.

Recap screen must include:

- Completion hero with green success mark and location pixel art.
- Three summary cards: Words learned, Pattern saved, Conversation used.
- Review-later queue.
- Primary action: `Open Word Bank`.
- Secondary action: `Back to Knowledge Map`.
- Right panel map progress with current and next location.

---

## 7. Notebook Components

### 7.1 Word Bank Grid

Use a responsive card grid. Desktop target: 4 columns in the main area.

Word card content:

- Pixel icon
- Spanish word
- Chinese translation
- Source node, e.g. `Cafe Luz C1`
- Status chip: `New`, `Seen`, `Recalled`, `Used`
- Next review date
- Audio icon button

### 7.2 Word Detail Panel

Right-side detail panel includes:

- Close icon in top right
- Large pixel icon
- Word + translation
- Pronunciation button
- Example sentence
- Source and added date
- Status timeline: New → Recalled → Used
- Next review
- Primary action: `Practice now`
- Secondary action: `Mark familiar`

### 7.3 Notebook Side Menu

Notebook left menu:

- Word Bank
- Pattern Book
- History

Active row uses a light purple background and purple icon.

---

## 8. Status, Chips, and Badges

### 8.1 Status Chips

| Chip | Fill | Text | Usage |
|---|---|---|---|
| `Today` | `#EEE7FF` | `#4D22D0` | Current map node |
| `Next` | `#EAF2FF` | `#005EEB` | Next available node |
| `Completed` | `#ECFDF3` | `#078A4C` | Finished route or step |
| `Available` | Transparent | `#6D759E` | Unstarted unlocked item |
| `Coming soon` | Transparent | `#6D759E` | Future content |
| `Locked` | `#F1F3F8` | `#6D759E` | Locked step/node |
| `Missed once` | `#FFF1F1` | `#E5484D` | Retry word |

### 8.2 Progress Indicators

Use circular step dots connected by a 2px line.

- Completed: green circle with check.
- Current: purple filled circle.
- Upcoming: white circle with gray border.
- Locked: gray circle with lock.

---

## 9. Pixel Art Asset Rules

Pixel art is core to LangTown’s identity.

### 9.1 Asset Categories

| Category | Examples |
|---|---|
| Locations | Cafe Luz, Mercado Verde, Hotel, Airport, Restaurant |
| Vocabulary | café, agua, té, leche, gracias, manzana |
| Characters | Ana the barista |
| Objects | coin, badge, notebook, keyboard, microphone |

### 9.2 Rendering Rules

- Render pixel art at integer scale to avoid blur.
- Use transparent PNG or sprite sheets.
- Keep UI icons separate from pixel art; UI icons should remain line icons.
- Location art should be visible in the first viewport for location-specific screens.
- Do not replace pixel art with generic gradients or abstract illustrations.

---

## 10. Accessibility

- Text contrast must meet WCAG AA: 4.5:1 for normal text.
- All icon-only controls need labels: audio, settings, close, microphone, send.
- Touch targets must be at least 44x44px.
- Focus ring: 3px purple translucent ring.
- Do not communicate state only by color; pair color with icons or text.
- Locked content must expose a readable reason, not only a lock icon.
- Audio controls need captions or transcript access.

---

## 11. Responsive Behavior

### 11.1 Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 768px` | Single-column learning flow; collapse side panels into drawers |
| `768-1199px` | Rail + main content; right panel below or drawer |
| `1200-1439px` | Rail + left panel + main content; optional right panel |
| `1440px+` | Full desktop shell with left and right panels |

### 11.2 Mobile Rules

- Keep current lesson and primary action visible without horizontal scroll.
- Collapse top status details into a compact pill.
- Use bottom navigation if the vertical rail becomes cramped.
- Word cards become 2-column or horizontal list depending on width.
- Right support panel becomes a bottom sheet or inline help accordion.

---

## 12. Implementation Tokens

```ts
export const langTownTheme = {
  colors: {
    canvas: "#FFFFFF",
    subtle: "#FBFAFF",
    panel: "#FFFFFF",
    textPrimary: "#0B123D",
    textSecondary: "#3F4A78",
    textMuted: "#6D759E",
    borderDefault: "#DDE1EE",
    primary: "#5D32D9",
    primaryDark: "#4D22D0",
    success: "#12A05C",
    info: "#2F80ED",
    warning: "#FFB020",
    danger: "#E5484D",
    locked: "#8A90A8",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
  },
  shadows: {
    card: "0 8px 24px rgba(11, 18, 61, 0.06)",
    active: "0 14px 32px rgba(93, 50, 217, 0.22)",
    popover: "0 16px 40px rgba(11, 18, 61, 0.14)",
  },
};
```

---

## 13. AI Design Instructions

When generating new LangTown screens:

1. Start with the desktop shell: rail, top bar, left context, main learning area, right support panel.
2. Use the current learning step as the main title.
3. Include pixel art related to the location or vocabulary.
4. Use exactly one primary purple CTA unless the screen is an input-first conversation screen.
5. Show progress state in at least two places: step list and top/main progress.
6. Use green checks for completed state and gray lock icons for locked state.
7. Keep cards white, borders subtle, and active states purple.
8. Avoid marketing-page layouts, large decorative gradients, and abstract hero art.

---

## 14. Screen Patterns

### Knowledge Map

- Left rail: Map active.
- Main panel: route title, legend, vertical map route.
- Right panel: today node details and step list.
- Bottom-left: vocabulary level card.

### Words

- Left panel: current node, step list, route progress.
- Main panel: word card carousel/grid, selected word practice module, retry queue, progress bar, CTA.
- Right panel: why these words, location pixel art, pronunciation note.

### Memory Check

- Main panel: hidden-answer prompt, image, input, check button, word index.
- Right panel: step reason and retry counter.

### Pattern

- Main panel: sentence template, answer choices, sentence output, type/say input.
- Right panel: pattern rule, examples, pattern book unlock.

### Listen

- Main panel: dialogue player, heard-word selection, heard summary, CTA.
- Right panel: listening guidance and replay note.

### Try Conversation

- Main panel: NPC prompt, dictionary popover, history, recommended sentence, reply composer, rubric.
- Right panel: language tools and NPC context.

### Recap

- Main panel: completion hero, learning summary, review queue, Word Bank CTA.
- Right panel: map progress and next node.

### Word Bank

- Main panel: search, filters, sort, word grid, pagination.
- Right panel: selected word detail.
- Left panel: notebook menu and review stats.
