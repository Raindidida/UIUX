# OpenRoboto Framer Template Content Map

Use this file to replace the current Lumora AI template content with the OpenRoboto landing page content. Keep the existing dark technical template, but shift the brand from generic AI automation to an open robotics model arena.

## Brand Tokens

- Brand name: `OpenRoboto`
- Tagline: `Robot intelligence, built in the open.`
- Core promise: `Anyone can train a robot model. The best one wins, in the open, every week.`
- Visual tone: dark industrial robotics, public benchmark, live arena, on-chain verification
- Primary accent: `#73F0B6`
- Gold accent: `#E9C27A`
- Background: `#08090B`
- Panel: `#0E1014`
- Text: `#F1F3F4`
- Muted text: `#959CA3`

## Framer Page Structure

### 1. Header

Replace template navigation with:

- Logo: `OpenRoboto`
- Links:
  - `Data` -> `#data`
  - `Live board` -> `#board`
  - `Mechanism` -> `#mechanism`
  - `Roadmap` -> `#roadmap`
- Live status pill: `Round 07 - live`

Suggested component:

- `Header / Sticky`
- Props: `brand`, `navItems`, `status`
- Style: sticky top, black translucent background, 1px divider, compact mono nav.

### 2. Hero

Replace current hero copy:

- Eyebrow: `Open Physical Intelligence`
- H1: `Robot intelligence, built in the open.`
- Body: `Anyone can train a robot model. The best one wins, in the open, every week.`
- Primary CTA: `Join the testnet`
- Secondary CTA: `See the live board`

Add new component below hero copy:

- `Live Champion Stage`
- This should use the provided `OpenRobotoLiveBoard.tsx` Code Component in `hero` mode if you want it dynamic.
- Static fallback content:
  - Current Champion
  - Model: `roboto-g2-mix`
  - Builder: `w7f3a...e21`
  - Score: `0.847 +/- 0.011`
  - Holding: `6d 14h`
  - Next base rotation: dynamic countdown or `17:42:11`

### 3. Credibility Strip

Create a single thin horizontal ticker/strip:

`Base model pi0.5 / Data Axis Robotics - 1M+ trajectories / Sim MuJoCo - RoboVerse / Real-robot transfer Galbot G1 - Unitree G1 / Open weights - public benchmark - on-chain on Bittensor`

Suggested component:

- `CredibilityStrip`
- Layout: horizontal wrap, mono uppercase, tiny separators.

### 4. Open vs Closed

Section label:

- `01`
- `Open vs closed`

Headline:

`The best robot models are locked inside a few labs. We build them in the open.`

Body:

`Open weights. A public benchmark. Every score verifiable on-chain. Anyone can submit a model and prove it's stronger.`

Pull quote:

`An open system compounds faster than any closed lab.`

### 5. Data Advantage

Section label:

- `02`
- `The data advantage`

Headline:

`The bottleneck isn't algorithms. It's data.`

Body:

`A robot model is only as good as the demonstrations it learns from, and high-quality robot data is scarce, expensive, and locked inside a few labs.`

Add new component:

- `Open Data Pool`
- Tag: `Our answer`
- Title: `The Open Data Pool`
- Body: `One open, licensed dataset the whole arena fine-tunes from. Partners push trajectories in; every builder pulls the same fuel out. Better data in, better models out.`
- Launch partner: `Axis Robotics`
- Stats: `100K+ contributors - 1M+ trajectories - sim teleop + first-person capture`
- Note: `+ more data partners plugging into the pool over time`

### 6. Live Board

Section label:

- `03`
- `Live board`

Headline:

`Every challenger, ranked in public.`

Add new component:

- Use `OpenRobotoLiveBoard.tsx` Code Component in `board` mode.
- This component includes:
  - stat bar
  - leaderboard table
  - event stream
  - rules row

Static table content if rebuilding manually:

| Rank | Model | Builder | Score | Delta vs Base | Status | Emission |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | roboto-g2-mix | w7f3a...e21 | 0.847 +/- .011 | +0.092 | Champion | 70% |
| 02 | ft-dexgrasp-d4 | i90bd...ac | 0.831 +/- .014 | +0.076 | Challenger | 15% |
| 03 | pi05-ftk-rev9 | m12e8...b30 | 0.804 +/- .009 | +0.049 | Challenger | 10% |
| 04 | grasp-mix-s2 | n5c01...df | 0.776 +/- .013 | +0.021 | Challenger | 5% |
| 05 | base-pi0.5-ref | reference | 0.755 +/- .012 | - | Base | - |
| 06 | handover-tune-b1 | j8a44...fe | 0.749 +/- .016 | -0.006 | Not qualified | - |

Rules:

- `Qualify: beat Base by >= 1.0pp, clear seed noise`
- `Emission 70 / 15 / 10 / 5 to top-4`
- `Unclaimed shares reflow to the Base holder`

### 7. Mechanism

Section label:

- `04`
- `How a row wins`

Headline:

`A market for robot intelligence.`

Body:

`Every week, the best model becomes everyone's next base.`

Create four process cards:

1. `Base`
   `The current model, published on-chain. Anyone can pull it.`
2. `Challenger`
   `Fine-tune on open data, publish weights, challenge on-chain.`
3. `Champion`
   `Beat the base by a clear margin, and you take the crown.`
4. `New Base`
   `Each week the champion becomes the next base.`

### 8. Compounding

Section label:

- `05`
- `Compounding`

Kicker:

`Generation 02 -> 03 - this week`

Headline:

`The frontier moves every week.`

Body:

`Each champion becomes everyone's base. Improvement stacks in public, on a fixed clock.`

Metrics:

- `+12.2%` / `Base -> gen-02 success`
- `7` / `Rounds settled`
- `infinite` / `Generations ahead`

Add new component:

- `CompoundingCurve`
- Static visual can be a stepped green line chart from g01 to g08 ending at `Champion 0.847`.
- Dynamic version is included inside `OpenRobotoLiveBoard.tsx` in `curve` mode.

### 9. Roadmap

Section label:

- `06`
- `Roadmap`

Headline:

`From a sim leaderboard to robots that earn their keep.`

Timeline items:

1. `Now - Testnet`
   `First champion`
   `pi0.5 + LIBERO minimal loop, a live leaderboard, and the arena's first champion.`
2. `Mainnet`
   `Live on mainnet`
   `The Open Data Pool v1 ships, and the owner's stake is conviction-locked on-chain.`
3. `Define the standard`
   `Our own benchmark`
   `Axis tasks become a living benchmark: tunable sim parameters, task weights, new tasks added from results.`
4. `Real robots`
   `The final gate`
   `Real-robot Final Round on Galbot G1 and Unitree G1. Sim2real, not slides.`
5. `Achieve SOTA`
   `Factory deployment`
   `Factory workstations become challenges; the champion policy deploys to real lines. Real work, real revenue: a real-to-sim-to-real loop.`

Pull quote:

`Whoever defines the benchmark defines what "better" means.`

### 10. Closing CTA

Headline:

`Submit a model. Prove it's better.`

Body:

`The arena is open. Builders, validators, and robotics researchers welcome.`

Buttons:

- `Join the testnet`
- `Read the litepaper`

### 11. Footer

Brand paragraph:

`Physical intelligence, in the open. A live arena for robotics foundation models, fine-tuned by a global community, proven on sim benchmarks, validated on real robots.`

Footer columns:

- Product: `Live board`, `Mechanism`, `Roadmap`, `Litepaper`
- Participate: `Join the testnet`, `For Builders`, `For Validators`, `Open Data Pool`
- Community: `X / Twitter`, `Discord`, `GitHub`, `WeChat`

Fine print:

`Built by HackQuest x Axis Robotics.`

`(c) 2026 OpenRoboto - Physical Intelligence`

## New Components To Add To The Template

1. `LiveChampionStage`
   Hero scoreboard card with current champion, score, holding time, countdown, and full board link.

2. `CredibilityStrip`
   A slim proof strip for base model, data, sim, robot transfer, and on-chain verification.

3. `OpenDataPool`
   Partner/data module with launch partner logo area and contributor/trajectory stats.

4. `LiveLeaderboard`
   Main ranking module with stats, table, event stream, and rules.

5. `MechanismSteps`
   Four-step process component.

6. `CompoundingCurve`
   Stepped line chart showing weekly improvement.

7. `RoadmapRail`
   Vertical milestone rail with current phase highlighted.

## Framer Build Notes

- Keep the original template's responsive desktop/tablet/mobile breakpoints, but replace section content in the order above.
- Use `Stack` layout for section interiors and `Grid` only for the leaderboard/table and 4-step cards.
- Do not flatten the live board into many independent text layers if you need updates later. Use the Code Component for maintainability.
- Use fixed-height or min-height containers for table rows and stat cards so hover/animated states do not shift layout.
- For mobile, collapse:
  - nav links into hidden menu or only keep status pill
  - hero champion stage to one column
  - live board table into horizontal scroll
  - mechanism cards to 1 column
  - roadmap to one vertical rail
