# components/ — Structure Guide

## The one rule

> If a component takes props and renders — no external state, no socket, no store — it lives in `ui/`.
> If it is a full screen or assembles a screen, it lives in `screens/`.
> Everything else lives in a named feature folder.

Ask when adding a new file: **does it render from props alone?** → `ui/`. Otherwise pick the right feature folder.

## Folder map

| Folder | What lives here | CSS counterpart | Pencil column |
|---|---|---|---|
| `ui/primitives/` | Game-agnostic primitives: Button, Panel, Badge, FormField, ModalShell, SectionHeader, StateSurface, StatusBanner, SurfaceCard, ChoiceChipButton, TimerPicker | `styles/ui.css` | Column 2 (top) |
| `ui/game/` | Game-domain primitives: CardSlot, SeatTile, TicketSlip, TransitCard, BoardMap, BoardStage, InspectorDock, PlayerRosterPanel, SupplyDock… | `styles/game.css` | Column 2 (bottom) |
| `screens/` | Full screens. `screens/gameplay/` has its own subfolder — it's the most complex screen. | `styles/layout.css` | Column 3 |
| `local/` | Local-play feature panels and utilities | `styles/game.css` | — |
| `online/` | Online feature flows (create/join room) | `styles/setup.css` | — |
| `setup/` | Setup-flow shared pieces used by multiple screens | `styles/setup.css` | Column 3 (Setup) |
| `shared/` | Cross-cutting: ErrorBoundary, OnboardingTour | `styles/onboarding.css` | — |

## Barrel rule

Each folder has one `index.ts`. No folder's index re-exports from a sibling or parent folder.

## Session-start checklist

Before any feature work: open `design/hudsonhustle.pen` and confirm the token, component, or layout zone you need exists. Add it to Pencil first, then write the CSS/TSX.
