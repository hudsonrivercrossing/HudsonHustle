# Hudson Hustle Design

Start here if you need the shortest possible entry into Hudson Hustle design decisions.

This file is an orientation contract, not the full design system. The canonical sources live under [docs/product/](/Users/djfan/Workspace/HudsonHustle/docs/product/).

## Visual Stance

- Hudson Hustle should feel map-first, shell-first, tactile, warm, and legible.
- Keep the transit nostalgia original. Do not copy Ticket to Ride art, copy, or branding.
- Favor clear hierarchy over dense decoration.

## Typography Contract

- `IBM Plex Sans = work`
- `Fraunces = ceremony`

Use `IBM Plex Sans` for:
- controls
- labels
- row metadata
- stats
- form inputs

Use `Fraunces` for:
- approved hero titles
- ceremony moments
- summary and reveal emphasis

## Core Boundaries

Keep these families distinct:

- `StatusBanner` for horizontal shell status
- `StateSurface` for larger state blocks
- `Panel` for structural shell containers
- `SurfaceCard` for nested object/detail surfaces
- `UtilityPill` for shell chrome metadata
- `Chip` for compact object-level state marks

## Working Rules

- Start with the smallest slice that proves the change.
- Keep gameplay rules in shared code, not React components.
- UI changes must not silently change gameplay behavior.
- Update player-facing docs when gameplay behavior changes.
- Use showcases and Storybook as review tools, not source of truth.
- Stay shell-first and map-conservative unless a task explicitly expands map work.

## Canonical Docs

- [Design System](/Users/djfan/Workspace/HudsonHustle/docs/product/design-system.md)
- [Design Principles](/Users/djfan/Workspace/HudsonHustle/docs/product/design-principles.md)
- [Typography And Layout](/Users/djfan/Workspace/HudsonHustle/docs/product/typography-and-layout.md)
- [Layout Rhythm](/Users/djfan/Workspace/HudsonHustle/docs/product/layout-rhythm.md)
- [Component System](/Users/djfan/Workspace/HudsonHustle/docs/product/component-system.md)
- [Design Implementation Backlog](/Users/djfan/Workspace/HudsonHustle/docs/product/design-implementation-backlog.md)
- [Design Showcases](/Users/djfan/Workspace/HudsonHustle/docs/product/showcase/README.md)
- [V2 Docs Index](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/README.md)

## Current Phase

Hudson Hustle is in late `v2.1` shell/system hardening and freeze.

That means:
- refine existing shell and system components
- keep the map conservative
- avoid broad component-library growth unless a slice proves it
- use design critiques to remove drift, not to reopen architecture
