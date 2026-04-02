# Hudson Hustle Design System

## Purpose

This is the stable design-system home for Hudson Hustle.

Use it for:
- design principles that should stay true across `v2.x`
- active typography, layout, and component guidance
- the boundary between shell language and map language
- the validated implementation backlog

Do not use this file for exploratory notes or version-specific rationale. Those belong in:
- [V2 Docs Index](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/README.md)
- [.research/](/Users/djfan/Workspace/HudsonHustle/.research)

## Current Phase

Hudson Hustle is in `v2.1` design-system definition and first-slice implementation.

Locked decisions:
- active font pair:
  - display: `Fraunces`
  - body / operational UI: `Inter`
- first implementation slice:
  - `status/banner system`
- map remains conservative and map-first during this phase

## Structure

Stable design-system docs:
- [Design Principles](/Users/djfan/Workspace/HudsonHustle/docs/product/design-principles.md)
- [Color System](/Users/djfan/Workspace/HudsonHustle/docs/product/color-system.md)
- [Typography And Layout](/Users/djfan/Workspace/HudsonHustle/docs/product/typography-and-layout.md)
- [Layout Rhythm](/Users/djfan/Workspace/HudsonHustle/docs/product/layout-rhythm.md)
- [Component System](/Users/djfan/Workspace/HudsonHustle/docs/product/component-system.md)
- [Map Language Boundary](/Users/djfan/Workspace/HudsonHustle/docs/product/map-language-boundary.md)
- [Design Implementation Backlog](/Users/djfan/Workspace/HudsonHustle/docs/product/design-implementation-backlog.md)

Versioned rationale and decision trail:
- [V2.1 Design Lock](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-lock.md)
- [V2.1 Design Critique And Reference](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-critique-and-reference.md)
- [V2.1 Shell Design Direction](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-shell-design-direction.md)
- [V2.2 System Agent Architecture](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-agent-architecture.md)

Exploratory research:
- [.research/design-system-in-the-ai-agent-era.md](/Users/djfan/Workspace/HudsonHustle/.research/design-system-in-the-ai-agent-era.md)
- [.research/hudson-hustle-design-system-recommendation-and-todo.md](/Users/djfan/Workspace/HudsonHustle/.research/hudson-hustle-design-system-recommendation-and-todo.md)

## Governance

Working rules:
- top-level `docs/product/` holds stable design-system truth
- `docs/product/v2/` holds versioned experiments, rationale, and transitions
- `.research/` holds raw thinking and reference analysis
- UI implementation should validate one slice before broad component-library expansion

Implementation rules:
- shell-first before map restyling
- tokens and system components should stay semantic, not page-specific
- color and layout decisions should be expressed as reusable system roles before they spread through new pages
- gameplay clarity outranks mood improvements
- map readability outranks shell styling

## Code Direction

When design implementation is in progress, code should organize around:
- `apps/web/src/design/tokens.ts`
- `apps/web/src/design/theme.css`
- `apps/web/src/components/system/`

Only extract primitives proven necessary by the current slice:
- `StatusBanner`
- `Panel`
- optional `Chip/Badge`
- optional `SectionHeader`

Do not build a broad component library ahead of proof.
