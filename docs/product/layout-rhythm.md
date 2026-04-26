# Layout Rhythm

## Purpose

This document defines Hudson Hustle's stable layout rhythm system.

The goal is not maximal flexibility. The goal is a repeatable shell rhythm that:
- keeps the board dominant
- gives setup and lobby an authored pace
- makes panels feel related instead of scattered

## Core Layout Roles

### Widths
- `content-max-width`: primary outer shell width
- `setup-max-width`: narrower authored width for setup-focused shells

Use explicit max widths so pages do not sprawl into generic full-bleed app layouts.

### Page Gutters
- desktop page gutter: `24px`
- mobile page gutter: `16px`

Outer breathing room should feel deliberate, not incidental.

### Vertical Rhythm
- `stack-xs`: `6px`
- `stack-sm`: `12px`
- `stack-md`: `18px`
- `stack-lg`: `24px`
- `stack-xl`: `32px`

Use these for:
- title-to-copy spacing
- banner-to-panel spacing
- panel group spacing
- internal section spacing

### Panel Padding
- `panel-md`: `18px`
- `panel-xl`: `40px`

Use larger padding only for authored shells such as setup cards.
Use medium padding for operational panels and secondary shell surfaces.

## Screen-Level Rules

### Setup
- setup should feel like a compact station counter console, not a landing page
- main gateway is the exception: it may use a cinematic masthead composition with a wide Fraunces title top-left, open atmospheric center, and equal-size departure-board choices anchored low-left on the screen
- gateway departure-board choices should sit as one table cluster, equal-sized, with the six-cell code doing the identity work; avoid spreading them into a generic three-column website grid
- setup shells use narrower width and tighter counter/preflight clustering
- status should appear early, near the title block
- setup/lobby refresh uses three desktop zones:
  - guide zone: about `160px` to `200px`, compact placard identity only unless orientation becomes a tested problem
  - step panel: primary interactive object, maxing around a compact counter width rather than sprawling full-screen
  - preflight tray: about `220px` to `250px`, sticky on desktop and visually close to the step panel
- gateway can widen beyond the setup console width when showing three entry artifacts, but the cards should remain table choices rather than marketing tiles
- setup console surfaces use station plates plus a close preflight tray; the tray should feel attached to the active counter, not like a separate third column
- mobile setup stacks as title/context, current step panel, then preflight tray
- do not keep a large persistent step rail if it reads as a separate component competing with the setup panel
- preflight is progressive: show established table facts only, not a repeated pending checklist
- board setup separates map selection from timer selection so the launch action has a clean final check
- local setup follows the same Seats → Map → Timer rhythm, with local-only copy avoiding server-room language

### Lobby
- lobby should read as a staged table, not a raw form stack
- section headers and panel groupings should establish rhythm before color does
- repeated seat and metadata surfaces should align to one card family
- lobby should reuse the setup shell, summary rows, and map thumbnail so room readiness feels like the continuation of setup

### Active Game Shell
- board stays visually dominant
- side panels act as instruments
- banner, timer, and action rails should feel related without enclosing the board

## Rhythm Rules

### Preferred
- stronger differences between major regions than between minor rows
- fewer spacing values used repeatedly
- rhythm created by grouping, not by random whitespace

### Avoid
- one-off margins per page
- every region having its own max width or padding
- stacking too many panels without hierarchy breaks
- using color to compensate for weak spacing structure

## Implementation Direction

Stable layout rhythm should live in:
- [tokens.ts](/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/tokens.ts)
- [theme.css](/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/theme.css)

Page components should rely on semantic variables such as:
- `--layout-content-max-width`
- `--layout-setup-max-width`
- `--space-page-x`
- `--space-page-y`
- `--space-stack-*`
- `--space-panel-*`

Do not treat these as a complete future-proof spacing scale. They are the current stable shell rhythm for `v2.1`.
