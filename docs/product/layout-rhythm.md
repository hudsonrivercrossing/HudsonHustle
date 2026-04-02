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
- setup should feel editorial and centered
- setup shells use narrower width and larger internal padding
- status should appear early, near the title block

### Lobby
- lobby should read as a staged table, not a raw form stack
- section headers and panel groupings should establish rhythm before color does
- repeated seat and metadata surfaces should align to one card family

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
