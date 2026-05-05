# Hudson Hustle Design System

## Purpose

This is the stable design-system home for Hudson Hustle.

If you need the shortest entrypoint first, start with [DESIGN.md](/Users/djfan/Workspace/HudsonHustle/DESIGN.md).

Use it for:
- design principles that should stay true across `v2.x`
- active typography, layout, and component guidance
- the boundary between shell language and map language
- the validated implementation backlog

Do not use this file for exploratory notes or version-specific rationale. Those belong in:
- [V2 Docs Index](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/README.md)
- [.research/](/Users/djfan/Workspace/HudsonHustle/.research)

## Current Phase

Hudson Hustle is in late `v2.1` shell/system hardening and freeze.

Locked decisions:
- active font pair:
  - display: `Fraunces`
  - body / operational UI: `IBM Plex Sans`
  - setup/lobby operational UI: `IBM Plex Sans`
- typography rule:
  - `IBM Plex Sans` handles work and setup/lobby station-counter controls
  - `Fraunces` handles ceremony
- current freeze target:
  - near-complete shell/system consistency across setup, lobby, active play, and overlays
- current setup/lobby slice:
  - station-counter and game-table preflight refresh using shared setup primitives
  - current hardening pass moves setup/gateway/lobby from skinned generic web panels toward Hudson-specific board-game objects: departure boards, station plates, ticket slips, and table tokens
  - setup and lobby should use station-enamel panels, muted ticket fields, token accents, progressive summary rows, and map thumbnails
  - SetupShell identity should stay a compact placard, not a large hero column
  - Local setup should use the same setup/lobby primitives and Seats → Map → Timer rhythm as Online so the first table choice does not split into two visual systems
  - Gateway `GUIDE_` opens the active guidebook branch: a compact step-by-step rulebook, not the old auto-opening tutorial
  - Guidebook access also belongs in active local and online board topbar controls
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
- [Design Showcases](/Users/djfan/Workspace/HudsonHustle/docs/product/showcase/README.md)
- [System Design Revamp Plan](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/system-design-revamp-plan.md)

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
- `apps/web/src/components/system/game/`
- `apps/web/src/components/setup/`

Only extract primitives proven necessary by the current slice:
- `Badge`
- `StateSurface`
- `Panel`
- `SectionHeader`
- `Button`
- `FormField`
- `SurfaceCard`
- `ChoiceChipButton`
- `ModalShell`
- deprecated compatibility primitives:
  - `Chip`
  - `StatusBanner`
  - `UtilityPill`
- gameplay primitives proven by the board layout revamp:
  - `CardSlot`
  - `TicketSlip`
  - `SeatTile`
  - `SideTabRail`
  - `NotificationStack`
  - `GameOverPanel`
- setup/lobby primitives proven by the current slice:
  - `SetupShell`
  - `SetupStepper`
  - `SetupStepPanel`
  - `ModeSwitch`
  - `SetupSummaryRow`
  - `MapThumbnail`
  - `DepartureBoardTile`
  - `StationPlate`
  - `SetupTicketSlip`
  - `TokenButton`

Do not build a broad component library ahead of proof.
