# Codebase Structure Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `components/` and `styles/` into a clean, navigable structure that mirrors the CSS and Pencil file layout, with zero behavior changes.

**Architecture:** Pure move/rename refactor. Each task moves one folder or file group, updates all import paths, verifies the build passes, then commits. No logic changes anywhere. The build (`tsc && vite build`) is the test after every task.

**Tech Stack:** React + TypeScript, Vite, Storybook. No path aliases — all imports are relative.

**Spec:** `docs/superpowers/specs/2026-05-11-codebase-structure-design.md`

---

## Task order

```
1. Create STRUCTURE.md files (no moves, just docs)
2. styles/ — rename system.css → ui.css, move theme.css
3. tokens.ts — delete, co-locate types
4. ui/primitives/ — move system/ contents
5. ui/game/ — move system/game/ + gameplay/ + root orphans
6. screens/ — move root screen files
7. online/ — rename multiplayer/
8. shared/ — move ErrorBoundary + OnboardingTour
9. Update App.tsx imports
10. Final: update hudsonhustle.pen column references
```

Each task ends with `tsc -p tsconfig.json --noEmit` passing before committing.

---

## Task 1: Add STRUCTURE.md files

**Files:**
- Create: `apps/web/src/components/STRUCTURE.md`
- Create: `apps/web/src/styles/STRUCTURE.md`

No moves. No import changes. Safe starting point.

- [ ] **Step 1: Create components/STRUCTURE.md**

Create `apps/web/src/components/STRUCTURE.md` with this content:

```markdown
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
```

- [ ] **Step 2: Create styles/STRUCTURE.md**

Create `apps/web/src/styles/STRUCTURE.md` with this content:

```markdown
# styles/ — Structure Guide

## File map

| File | What it styles | Component folder |
|---|---|---|
| `theme.css` | CSS custom properties — single source of truth for all design tokens | — (tokens only) |
| `ui.css` | Game-agnostic UI primitives | `components/ui/primitives/` |
| `game.css` | Game-domain primitives + live game board (HUD) | `components/ui/game/` + `components/screens/gameplay/` |
| `layout.css` | Structural grid rules: app shell, game layout, board column | `components/screens/` |
| `setup.css` | Setup and lobby flow styles | `components/setup/` + `components/screens/` setup flows |
| `onboarding.css` | Onboarding overlay | `components/shared/OnboardingTour` |

## Import order (styles.css)

```css
@import './styles/theme.css';   /* tokens first — everything else inherits */
@import './styles/ui.css';
@import './styles/game.css';
@import './styles/layout.css';
@import './styles/setup.css';
@import './styles/onboarding.css';
```

## Rules

- All design values live in `theme.css` as CSS custom properties. Never hardcode a color, spacing, font-size, or radius value in any other file.
- `ui.css` and `game.css` together are the design system. `ui.css` = game-agnostic. `game.css` = Hudson Hustle domain.
- `game.css` covers both `ui/game/` primitives and `screens/gameplay/` HUD assembly. If it grows unwieldy, the natural split is `game-primitives.css` + `game-hud.css`.

## Pencil cross-reference

Open `design/hudsonhustle.pen`:
- Column 1: Tokens (maps to `theme.css`)
- Column 2: Components (maps to `ui.css` + `game.css`)
- Column 3: Layout (maps to `layout.css` + `setup.css`)
```

- [ ] **Step 3: Verify build still passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors (no code changed).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/STRUCTURE.md apps/web/src/styles/STRUCTURE.md
git commit -m "docs: add STRUCTURE.md to components/ and styles/"
```

---

## Task 2: styles/ — rename system.css → ui.css, move theme.css

**Files:**
- Rename: `styles/system.css` → `styles/ui.css`
- Move: `design/theme.css` → `styles/theme.css`
- Modify: `apps/web/src/styles.css` (the @import barrel)
- Modify: `apps/web/src/main.tsx` (imports theme.css directly)

- [ ] **Step 1: Rename system.css to ui.css**

```bash
mv apps/web/src/styles/system.css apps/web/src/styles/ui.css
```

- [ ] **Step 2: Move theme.css into styles/**

```bash
mv apps/web/src/design/theme.css apps/web/src/styles/theme.css
```

- [ ] **Step 3: Update styles.css @import barrel**

Open `apps/web/src/styles.css`. Replace its contents with:

```css
@import './styles/theme.css';
@import './styles/ui.css';
@import './styles/game.css';
@import './styles/layout.css';
@import './styles/setup.css';
@import './styles/onboarding.css';
```

- [ ] **Step 4: Update main.tsx**

Open `apps/web/src/main.tsx`. Change:

```ts
import "./design/theme.css";
```

to:

```ts
import "./styles.css";
```

If `./styles.css` is already imported, just remove the `./design/theme.css` line.

- [ ] **Step 5: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/styles/ui.css apps/web/src/styles/theme.css apps/web/src/styles.css apps/web/src/main.tsx apps/web/src/design/theme.css
git commit -m "refactor(styles): rename system.css→ui.css, move theme.css into styles/"
```

---

## Task 3: Delete tokens.ts, co-locate union types

**Files:**
- Delete: `apps/web/src/design/tokens.ts`
- Modify: `apps/web/src/components/system/Panel.tsx` — add `PanelVariant` type
- Modify: `apps/web/src/components/system/StatusBanner.tsx` — add `StatusBannerTone` type
- Modify: any file importing from `tokens.ts` — update imports

- [ ] **Step 1: Find all consumers of tokens.ts**

```bash
grep -r "from.*design/tokens\|from.*tokens" apps/web/src --include="*.tsx" --include="*.ts" | grep -v ".stories." | grep -v node_modules
```

Expected output will show Panel.tsx and StatusBanner.tsx as the only real consumers.

- [ ] **Step 2: Check what PanelVariant looks like in tokens.ts**

```bash
grep -A10 "PanelVariant\|StatusBannerTone" apps/web/src/design/tokens.ts
```

Note the exact type definitions shown — you'll copy them in the next steps.

- [ ] **Step 3: Add PanelVariant to Panel.tsx**

Open `apps/web/src/components/system/Panel.tsx`. Find the existing import of `PanelVariant` from tokens.ts. Remove that import line and add the type definition directly in the file above where it's used:

```ts
export type PanelVariant = "default" | "info" | "warning" | "danger";
```

(Use the exact union values you saw in Step 2 — copy them verbatim.)

- [ ] **Step 4: Add StatusBannerTone to StatusBanner.tsx**

Open `apps/web/src/components/system/StatusBanner.tsx`. Remove the import of `StatusBannerTone` from tokens.ts and add it directly:

```ts
export type StatusBannerTone = "info" | "success" | "warning" | "danger";
```

(Use the exact union values from Step 2.)

- [ ] **Step 5: Update any other consumers**

For each file the Step 1 grep found (other than Panel.tsx and StatusBanner.tsx), update its import to point to the component that now owns the type:

```ts
// Before
import { PanelVariant } from "../design/tokens";
// After
import type { PanelVariant } from "./Panel";  // adjust relative path as needed
```

- [ ] **Step 6: Delete tokens.ts**

```bash
rm apps/web/src/design/tokens.ts
```

- [ ] **Step 7: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: delete tokens.ts, co-locate PanelVariant and StatusBannerTone"
```

---

## Task 4: Create ui/primitives/ — move system/ contents

**Files:**
- Create dir: `apps/web/src/components/ui/primitives/`
- Move: all `.tsx` and `.stories.tsx` from `components/system/` (not `system/game/`)
- Modify: `components/system/index.ts` → becomes `components/ui/primitives/index.ts`
- Modify: all files that import from `../system/` or `./system/`

The files moving: `Badge`, `Button`, `ChoiceChipButton`, `FormField`, `ModalShell`, `Panel`, `SectionHeader`, `StateSurface`, `StatusBanner`, `SurfaceCard`, `TimerPicker` (+ their `.stories.tsx`).

- [ ] **Step 1: Create the directory and move files**

```bash
mkdir -p apps/web/src/components/ui/primitives
# Move all tsx files except the game/ subfolder
mv apps/web/src/components/system/Badge.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/Badge.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/Button.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/Button.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/ChoiceChipButton.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/ChoiceChipButton.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/FormField.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/FormField.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/ModalShell.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/ModalShell.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/Panel.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/Panel.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/SectionHeader.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/SectionHeader.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/StateSurface.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/StateSurface.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/StatusBanner.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/StatusBanner.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/SurfaceCard.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/SurfaceCard.stories.tsx apps/web/src/components/ui/primitives/
mv apps/web/src/components/system/TimerPicker.tsx apps/web/src/components/ui/primitives/
```

- [ ] **Step 2: Move index.ts**

```bash
mv apps/web/src/components/system/index.ts apps/web/src/components/ui/primitives/index.ts
```

- [ ] **Step 3: Update internal imports inside the moved files**

The moved files import each other with `./SomeName` — those relative paths are unchanged since they're in the same folder. No edits needed there.

- [ ] **Step 4: Update all cross-folder imports pointing to system/**

Run this to find every file that still imports from `../system/` or `./system/`:

```bash
grep -r "from.*[\"']\.\./system\|from.*[\"']\.\/system\|from.*components\/system" \
  apps/web/src --include="*.tsx" --include="*.ts" | grep -v node_modules
```

For each hit, update the import path:
- `from "../system/Button"` → `from "../ui/primitives/Button"`
- `from "../system/Panel"` → `from "../ui/primitives/Panel"`
- `from "../system"` → `from "../ui/primitives"`
- `from "./system/Button"` (in App.tsx) → `from "./components/ui/primitives/Button"`

Files expected to change: `gameplay/BoardStage.tsx`, `gameplay/InspectorDock.tsx`, `gameplay/PlayerHandPanel.tsx`, `gameplay/PlayerRosterPanel.tsx`, `gameplay/SupplyDock.tsx`, `gameplay/notifications.tsx`, `gameplay/index.ts`, `local/EndgameGrid.tsx`, `local/HandoffModal.tsx`, `local/RouteBuildPanel.tsx`, `local/StationBuildPanel.tsx`, `multiplayer/CreateRoomFlow.tsx`, `multiplayer/JoinRoomFlow.tsx`, `multiplayer/OnlineGateway.tsx`, `setup/SetupPrimitives.tsx`, `App.tsx`.

- [ ] **Step 5: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move system/ primitives to ui/primitives/"
```

---

## Task 5: Create ui/game/ — merge system/game/ + gameplay/ + root orphans

**Files:**
- Create dir: `apps/web/src/components/ui/game/`
- Move from `system/game/`: `CardSlot`, `GameOverPanel`, `NotificationStack`, `SeatTile`, `SideTabRail`, `TicketSlip`, `TurnIndicator` (+ stories)
- Move from `gameplay/`: `BoardStage`, `InspectorDock`, `PlayerHandPanel`, `PlayerRosterPanel`, `SupplyDock`, `notifications` (+ stories)
- Move from root: `BoardMap.tsx`, `TransitCard.tsx`, `TicketPicker.tsx`, `EndgameBreakdown.tsx`, `ScoreGuide.tsx`
- Create: `apps/web/src/components/ui/game/index.ts`
- Delete: `apps/web/src/components/system/game/` (now empty)
- Delete: `apps/web/src/components/gameplay/` (now empty)

- [ ] **Step 1: Create directory and move system/game/ files**

```bash
mkdir -p apps/web/src/components/ui/game
mv apps/web/src/components/system/game/CardSlot.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/CardSlot.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/GameOverPanel.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/GameOverPanel.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/NotificationStack.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/NotificationStack.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/SeatTile.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/SeatTile.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/SideTabRail.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/SideTabRail.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/TicketSlip.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/TicketSlip.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/system/game/TurnIndicator.tsx apps/web/src/components/ui/game/
```

- [ ] **Step 2: Move gameplay/ files**

```bash
mv apps/web/src/components/gameplay/BoardStage.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/BoardStage.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/InspectorDock.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/InspectorDock.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/PlayerHandPanel.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/PlayerRosterPanel.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/PlayerRosterPanel.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/SupplyDock.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/SupplyDock.stories.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/gameplay/notifications.tsx apps/web/src/components/ui/game/
```

- [ ] **Step 3: Move root orphans**

```bash
mv apps/web/src/components/BoardMap.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/TransitCard.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/TicketPicker.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/EndgameBreakdown.tsx apps/web/src/components/ui/game/
mv apps/web/src/components/ScoreGuide.tsx apps/web/src/components/ui/game/
```

- [ ] **Step 4: Create ui/game/index.ts**

Create `apps/web/src/components/ui/game/index.ts`:

```ts
export { BoardMap } from "./BoardMap";
export { BoardStage } from "./BoardStage";
export { CardSlot } from "./CardSlot";
export type { CardSlotProps } from "./CardSlot";
export { EndgameBreakdown } from "./EndgameBreakdown";
export { GameOverPanel } from "./GameOverPanel";
export { InspectorDock } from "./InspectorDock";
export { NotificationStack } from "./NotificationStack";
export type { GameplayNotification } from "./NotificationStack";
export { GameOverLayer, NotificationPipe } from "./notifications";
export { PlayerHandPanel, PrivateHandRail, TicketChoiceSheet, TicketDock } from "./PlayerHandPanel";
export { FloatingPlayerRoster, PlayerRoster } from "./PlayerRosterPanel";
export type { PlayerRosterEntry, PlayerRosterTimer } from "./PlayerRosterPanel";
export { ScoreGuide } from "./ScoreGuide";
export { SeatTile } from "./SeatTile";
export type { SeatTileProps } from "./SeatTile";
export { SideTabRail } from "./SideTabRail";
export type { SideTab } from "./SideTabRail";
export { SupplyDock } from "./SupplyDock";
export { TicketPicker } from "./TicketPicker";
export { TicketSlip } from "./TicketSlip";
export type { TicketSlipStatus } from "./TicketSlip";
export { TransitCard } from "./TransitCard";
export type { TransitCardColor } from "./TransitCard";
export { TurnIndicator } from "./TurnIndicator";
export { formatCardLabel } from "./CardSlot";
```

- [ ] **Step 5: Update internal imports inside moved files**

Files moved from `gameplay/` imported from `../ui/primitives/` (updated in Task 4) and from `../system/game/` (now siblings). Update those sibling imports:

For every moved file that had `from "../system/game/..."` or `from "../system/game"`:
- Change `from "../system/game/CardSlot"` → `from "./CardSlot"`
- Change `from "../system/game"` → `from "./SeatTile"` (use direct relative for each)

Run to find them:
```bash
grep -r "system/game" apps/web/src/components/ui/game/ --include="*.tsx"
```

Fix each hit to use direct `./FileName` relative import.

- [ ] **Step 6: Update all external imports pointing to old paths**

```bash
grep -r "from.*system/game\|from.*components/gameplay\|from.*GameplayHud\|from.*components/BoardMap\|from.*components/TransitCard\|from.*components/TicketPicker\|from.*components/EndgameBreakdown\|from.*components/ScoreGuide" \
  apps/web/src --include="*.tsx" --include="*.ts" | grep -v node_modules
```

Update each hit:
- `from "../system/game"` → `from "../ui/game"`
- `from "../system/game/CardSlot"` → `from "../ui/game/CardSlot"`
- `from "./GameplayHud"` (App.tsx) → `from "./components/ui/game"`
- `from "./components/BoardMap"` (App.tsx) → `from "./components/ui/game/BoardMap"`
- Same pattern for TransitCard, TicketPicker, EndgameBreakdown, ScoreGuide

- [ ] **Step 7: Delete empty old directories**

```bash
rm -rf apps/web/src/components/system/game
rm -rf apps/web/src/components/gameplay
rm apps/web/src/components/GameplayHud.tsx
```

- [ ] **Step 8: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: merge system/game/ + gameplay/ + root orphans into ui/game/"
```

---

## Task 6: Create screens/ — move root screen files

**Files:**
- Create dir: `apps/web/src/components/screens/`
- Move from root: `LocalPlayScreen.tsx`, `SetupScreen.tsx`, `LobbyScreen.tsx`, `GuidebookScreen.tsx`, `SetupGateway.tsx`
- Rename + move: `MultiplayerSetupScreen.tsx` → `screens/OnlineSetupScreen.tsx`
- Move: `screens/gameplay/` subfolder contents from current `gameplay/` (already moved in Task 5 — `screens/gameplay/` is the game board screen assembly, which is `LocalPlayScreen` in practice, not a separate folder)

Note: after Task 5, `gameplay/` is deleted. The game board assembly (`BoardStage`, `InspectorDock` etc.) now lives in `ui/game/`. `LocalPlayScreen` is the screen that assembles them — it moves to `screens/`.

- [ ] **Step 1: Create screens/ and move files**

```bash
mkdir -p apps/web/src/components/screens
mv apps/web/src/components/LocalPlayScreen.tsx apps/web/src/components/screens/
mv apps/web/src/components/SetupScreen.tsx apps/web/src/components/screens/
mv apps/web/src/components/LobbyScreen.tsx apps/web/src/components/screens/
mv apps/web/src/components/GuidebookScreen.tsx apps/web/src/components/screens/
mv apps/web/src/components/SetupGateway.tsx apps/web/src/components/screens/
mv apps/web/src/components/MultiplayerSetupScreen.tsx apps/web/src/components/screens/OnlineSetupScreen.tsx
```

- [ ] **Step 2: Update the class/function name inside OnlineSetupScreen.tsx**

Open `apps/web/src/components/screens/OnlineSetupScreen.tsx`. Find the exported function/component named `MultiplayerSetupScreen` and rename it to `OnlineSetupScreen`:

```ts
// Before
export function MultiplayerSetupScreen(...) {
// After
export function OnlineSetupScreen(...) {
```

- [ ] **Step 3: Update imports inside the moved screen files**

Each screen file imported from `./system/`, `./gameplay/`, `./local/`, `./multiplayer/`, `./setup/` using single-dot relative paths. Now they're one level deeper (`screens/`), so paths need `../`:

- `from "./system/Button"` → `from "../ui/primitives/Button"`
- `from "./ui/primitives/Button"` → `from "../ui/primitives/Button"` (if already updated)
- `from "./local"` → `from "../local"`
- `from "./multiplayer"` → `from "../online"` (not renamed yet — use `../multiplayer` for now, Task 7 will fix)
- `from "./setup"` → `from "../setup"`
- `from "./system"` → `from "../ui/primitives"`

Run to find all:
```bash
grep -rn "^import" apps/web/src/components/screens/ --include="*.tsx"
```

Fix each relative path to add the `../` prefix as needed.

- [ ] **Step 4: Update App.tsx imports**

Open `apps/web/src/App.tsx`. Update screen imports:

```ts
// Before
import { LocalPlayScreen } from "./components/LocalPlayScreen";
import { SetupScreen } from "./components/SetupScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { MultiplayerSetupScreen } from "./components/MultiplayerSetupScreen";
import { GuidebookScreen } from "./components/GuidebookScreen";
import { SetupGateway } from "./components/SetupGateway";

// After
import { LocalPlayScreen } from "./components/screens/LocalPlayScreen";
import { SetupScreen } from "./components/screens/SetupScreen";
import { LobbyScreen } from "./components/screens/LobbyScreen";
import { OnlineSetupScreen } from "./components/screens/OnlineSetupScreen";
import { GuidebookScreen } from "./components/screens/GuidebookScreen";
import { SetupGateway } from "./components/screens/SetupGateway";
```

Also rename every usage of `MultiplayerSetupScreen` in App.tsx to `OnlineSetupScreen` (the JSX element and any type references).

- [ ] **Step 5: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move screens to screens/, rename MultiplayerSetupScreen→OnlineSetupScreen"
```

---

## Task 7: Rename multiplayer/ → online/

**Files:**
- Rename dir: `components/multiplayer/` → `components/online/`
- Modify: all imports pointing to `../multiplayer/` or `./multiplayer/`

- [ ] **Step 1: Rename the folder**

```bash
mv apps/web/src/components/multiplayer apps/web/src/components/online
```

- [ ] **Step 2: Find all imports referencing the old path**

```bash
grep -r "from.*multiplayer\|from.*\/multiplayer" apps/web/src --include="*.tsx" --include="*.ts" | grep -v node_modules
```

- [ ] **Step 3: Update each import**

For each hit:
- `from "../multiplayer"` → `from "../online"`
- `from "../multiplayer/CreateRoomFlow"` → `from "../online/CreateRoomFlow"`
- `from "./components/multiplayer"` (App.tsx) → `from "./components/online"`

Also update the `index.ts` inside `online/` — it has no internal references to the folder name so no changes needed there.

- [ ] **Step 4: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename multiplayer/ → online/"
```

---

## Task 8: Create shared/ — move ErrorBoundary and OnboardingTour

**Files:**
- Create dir: `apps/web/src/components/shared/`
- Move from root: `ErrorBoundary.tsx`, `OnboardingTour.tsx`
- Modify: App.tsx imports

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/web/src/components/shared
mv apps/web/src/components/ErrorBoundary.tsx apps/web/src/components/shared/
mv apps/web/src/components/OnboardingTour.tsx apps/web/src/components/shared/
```

- [ ] **Step 2: Update App.tsx and main.tsx imports**

Open `apps/web/src/App.tsx`. Update:

```ts
// Before
import OnboardingTour, { shouldShowTour } from "./components/OnboardingTour";

// After
import OnboardingTour, { shouldShowTour } from "./components/shared/OnboardingTour";
```

Open `apps/web/src/main.tsx`. Update:

```ts
// Before
import { ErrorBoundary } from "./components/ErrorBoundary";

// After
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
```

- [ ] **Step 3: Verify build passes**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Confirm root components/ is now empty of .tsx files**

```bash
ls apps/web/src/components/*.tsx 2>/dev/null && echo "UNEXPECTED FILES REMAIN" || echo "Root is clean"
```

Expected: "Root is clean"

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move ErrorBoundary + OnboardingTour to shared/"
```

---

## Task 9: Final cleanup — barrel hygiene + delete empty dirs

**Files:**
- Delete: `apps/web/src/components/system/` (should be empty by now)
- Update: any remaining barrel `index.ts` files with stale re-exports
- Verify: `apps/web/src/components/` root contains only folders + STRUCTURE.md

- [ ] **Step 1: Check for any remaining stale references**

```bash
grep -r "from.*\/system\b\|from.*\/gameplay\b\|from.*\/multiplayer\b\|MultiplayerSetupScreen" \
  apps/web/src --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v STRUCTURE
```

Expected: 0 results. If any remain, fix them.

- [ ] **Step 2: Delete empty old directories**

```bash
rm -rf apps/web/src/components/system 2>/dev/null || true
ls apps/web/src/components/
```

Expected output:
```
STRUCTURE.md  local/  online/  screens/  setup/  shared/  ui/
```

- [ ] **Step 3: Full build verification**

```bash
cd apps/web && npx tsc -p tsconfig.json --noEmit && echo "TypeScript: OK"
```

Expected: `TypeScript: OK`

- [ ] **Step 4: Storybook smoke test**

```bash
cd apps/web && npx storybook build --quiet 2>&1 | tail -5
```

Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: cleanup empty dirs, verify clean build after structure refactor"
```

---

## Task 10: Update hudsonhustle.pen — sync column references

This task uses the Pencil MCP via the pencil-sync skill. Open `design/hudsonhustle.pen` in Pencil (click it in the VS Code file explorer to activate the socket).

- [ ] **Step 1: Open the Pencil file and get editor state**

In a new session, invoke `/pencil-sync` and run:
```
mcp__pencil__open_document({ path: "/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/hudsonhustle.pen" })
mcp__pencil__get_editor_state({ include_schema: false })
```

- [ ] **Step 2: Update Column 2 header and component labels**

In Column 2 (Components), find any text nodes that reference old folder names:
- `system/` → `ui/primitives/`
- `system/game/` → `ui/game/`
- `gameplay/` → `ui/game/`

Use `batch_design` to update the text content of those annotation nodes.

- [ ] **Step 3: Update Column 3 screen labels**

In Column 3 (Layout), find the screen label for `MultiplayerSetupScreen` and update it to `OnlineSetupScreen`.

- [ ] **Step 4: Screenshot to verify**

```
mcp__pencil__get_screenshot({})
```

Confirm columns look correct, no stale folder names visible.

- [ ] **Step 5: Commit the .pen file**

```bash
git add apps/web/src/design/hudsonhustle.pen
git commit -m "design: update hudsonhustle.pen to reflect new folder structure"
```

---

## Completion checklist

- [ ] `components/` root contains only: `ui/`, `screens/`, `local/`, `online/`, `setup/`, `shared/`, `STRUCTURE.md`
- [ ] `styles/` contains: `theme.css`, `ui.css`, `game.css`, `layout.css`, `setup.css`, `onboarding.css`, `STRUCTURE.md`
- [ ] `design/` contains only: `hudsonhustle.pen`
- [ ] `tsc --noEmit` passes
- [ ] Storybook builds
- [ ] No references to `system/`, `gameplay/`, `multiplayer/`, `MultiplayerSetupScreen` remain in source
- [ ] `tokens.ts` deleted
- [ ] `hudsonhustle.pen` column labels updated
