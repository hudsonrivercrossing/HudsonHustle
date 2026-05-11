# Codebase Structure — Design Spec
_Hudson Hustle · 2026-05-11_

## Goal

Reorganize `components/` and `styles/` into a structure that is easy to navigate solo, easy to explain to a new teammate, and mirrors the CSS and Pencil file organization.

---

## components/

### Final structure

```
components/
  ui/
    primitives/       ← game-agnostic UI building blocks
    game/             ← game-domain building blocks
  screens/
    gameplay/         ← game board screen (most complex screen, has its own subfolder)
    SetupGateway
    SetupScreen
    OnlineSetupScreen  ← renamed from MultiplayerSetupScreen
    LobbyScreen
    LocalPlayScreen
    GuidebookScreen
  local/              ← local-play feature panels and utilities
  online/             ← online feature flows (renamed from multiplayer/)
  setup/              ← setup flow shared pieces used across screens
  shared/             ← cross-cutting: ErrorBoundary, OnboardingTour
  STRUCTURE.md
```

### The verdict rule (goes in STRUCTURE.md)

> If a component takes props and renders — no external state, no socket, no store — it lives in `ui/`.
> If it is a full screen or assembles a screen, it lives in `screens/`.
> Everything else lives in a named feature folder.

This is the single question to ask when adding a new file: _does it render from props alone?_

### ui/ — two subfolders, one rule

| Subfolder | What lives here | Examples |
|---|---|---|
| `ui/primitives/` | Could exist in any app. No game knowledge. | Button, Panel, Badge, FormField, ModalShell, SectionHeader, StateSurface, StatusBanner, SurfaceCard, ChoiceChipButton, TimerPicker |
| `ui/game/` | Hudson Hustle domain. Still props-driven and reusable. | CardSlot, SeatTile, TicketSlip, SideTabRail, TurnIndicator, GameOverPanel, NotificationStack, TransitCard, BoardMap, BoardStage, InspectorDock, PlayerRosterPanel, PlayerHandPanel, SupplyDock, TicketPicker, EndgameBreakdown, ScoreGuide |

Stories (`.stories.tsx`) live next to their component file in the same subfolder.

### screens/ — one file per screen, one subfolder for the complex one

`screens/gameplay/` gets a subfolder because the game board screen is the most complex screen and contains multiple panel files. All other screens are single files.

`MultiplayerSetupScreen` is renamed `OnlineSetupScreen` — "online" is the player-facing word, "multiplayer" is an implementation detail.

### Feature folders — named by what the player does

| Folder | What lives here |
|---|---|
| `local/` | Local-play panels: HandoffModal, RouteBuildPanel, StationBuildPanel, EndgameGrid, localGame.utils |
| `online/` | Online flow components: CreateRoomFlow, JoinRoomFlow, CreateRoomPreflight, JoinRoomPreflight, OnlineGateway |
| `setup/` | Shared setup primitives used by both SetupScreen and LobbyScreen: SetupPrimitives, SeatPlan |
| `shared/` | Cross-cutting utilities not tied to any feature: ErrorBoundary, OnboardingTour |

### What moves where (migration map)

| From | To |
|---|---|
| `system/Button`, `Panel`, `Badge`, `FormField`, `ModalShell`, `SectionHeader`, `StateSurface`, `StatusBanner`, `SurfaceCard`, `ChoiceChipButton`, `TimerPicker` | `ui/primitives/` |
| `system/game/CardSlot`, `SeatTile`, `TicketSlip`, `SideTabRail`, `TurnIndicator`, `GameOverPanel`, `NotificationStack` | `ui/game/` |
| `gameplay/BoardStage`, `InspectorDock`, `PlayerRosterPanel`, `PlayerHandPanel`, `SupplyDock`, `notifications` | `ui/game/` |
| `BoardMap`, `TransitCard`, `TicketPicker`, `EndgameBreakdown`, `ScoreGuide` (root) | `ui/game/` |
| `GameplayHud.tsx` (root re-export shim) | delete — App.tsx imports directly from `ui/game/` |
| `ErrorBoundary`, `OnboardingTour` (root) | `shared/` |
| `LocalPlayScreen`, `SetupScreen`, `MultiplayerSetupScreen`→`OnlineSetupScreen`, `LobbyScreen`, `GuidebookScreen`, `SetupGateway` (root) | `screens/` |
| `gameplay/BoardStage` + panel assembly | `screens/gameplay/` |
| `multiplayer/` | `online/` (rename folder) |
| `tokens.ts` | delete — `PanelVariant` co-located in Panel.tsx, `StatusBannerTone` co-located in StatusBanner.tsx |

### Barrel index rule

Each folder has one `index.ts`. No folder's index re-exports from a sibling or parent folder. Cross-folder imports use the explicit path.

---

## styles/

### Final structure

```
styles/
  theme.css        ← CSS custom properties (single source of truth for all design tokens)
  ui.css           ← renamed from system.css (primitives styles, mirrors ui/primitives/)
  game.css         ← game-domain + HUD styles (mirrors ui/game/ + screens/gameplay/)
  layout.css       ← structural grid rules (mirrors screens/ layout)
  setup.css        ← setup and lobby flow styles
  onboarding.css   ← onboarding overlay styles
  STRUCTURE.md
```

`theme.css` moves from `design/` into `styles/` — it is a stylesheet, not a design artifact.

`system.css` is renamed `ui.css` to match the `ui/` component folder.

`styles.css` (the root `@import` barrel) is unchanged — it imports all six files in order.

### design/ folder after the move

```
design/
  hudsonhustle.pen   ← Pencil design file (not a stylesheet, stays here)
```

`design/` becomes a single-purpose folder: just the Pencil file. If preferred, rename to `pencil/`.

### CSS ↔ component ↔ Pencil cross-reference

| CSS file | Component folder | Pencil column |
|---|---|---|
| `theme.css` | — (tokens only) | Column 1: Tokens |
| `ui.css` | `ui/primitives/` | Column 2: Components (top) |
| `game.css` | `ui/game/` + `screens/gameplay/` | Column 2: Components (bottom) + Column 3: Game screen |
| `layout.css` | `screens/` | Column 3: Layout wireframes |
| `setup.css` | `setup/` + `screens/` setup flows | Column 3: Setup/Lobby screens |
| `onboarding.css` | `shared/OnboardingTour` | — |

---

## Session-start checklist (hudsonhustle.pen)

Before starting any feature work:

1. Open `design/hudsonhustle.pen` in Pencil
2. Confirm the token, component, or layout zone you need exists in the relevant column
3. If it doesn't exist — add it to the Pencil file first, then write the CSS/TSX
4. Never introduce a hardcoded value in CSS without a token in `theme.css`

This prevents the token drift and alias accumulation that the D8 initiative had to clean up.

---

## Out of scope for this refactor

- Splitting `game.css` into `game-primitives.css` + `game-hud.css` — valid future step, not needed now
- Moving to per-component CSS files — high effort, global cascade is intentional
- Any logic changes to components — this is a move/rename only, zero behavior changes
