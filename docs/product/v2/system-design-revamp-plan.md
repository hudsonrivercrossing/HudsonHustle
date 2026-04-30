# System Design Revamp Plan

## Purpose

This plan reorganizes Hudson Hustle's web UI into a clearer design system before more board and setup work accumulates. The goal is not to make every component generic. The goal is to make shared visual language easy to tune without touching gameplay rules or page orchestration.

The system should support two product contexts:

- **Setup and lobby**: calm, guided, form-heavy, low-pressure.
- **Gameplay board**: immersive, tactile, map-first, tabletop-like.

These contexts should share tokens and foundational primitives, but they should not be forced into one flat component set.

## Naming Principles

- Use readable names over clever names.
- Prefer nouns that describe the UI object: `CardSlot`, `TicketSlip`, `SeatTile`, `SideTabRail`.
- Avoid overly broad names like `Thing`, `Item`, `Box`, `Panel2`, or `GameCard`.
- Keep domain-specific names only when the component truly belongs to the game board.
- Use `system` for generic primitives, `system/game` for reusable game UI objects, and feature folders for screens and orchestration.
- Do not use implementation names as public component names. Example: prefer `SideTabRail` over `RotatedTabList`.

## System Boundary

Game and setup should not be mixed into one undifferentiated system folder.

Recommended structure:

```text
apps/web/src/components/
  system/
    Button.tsx
    Badge.tsx
    FormField.tsx
    ModalShell.tsx
    Panel.tsx
    SectionHeader.tsx
    SurfaceCard.tsx
    StateSurface.tsx
    index.ts
  system/game/
    CardSlot.tsx
    TicketSlip.tsx
    SeatTile.tsx
    SideTabRail.tsx
    NotificationStack.tsx
    GameOverPanel.tsx
    index.ts
  setup/
    SetupPrimitives.tsx
  game/
    GameplayHud.tsx
    BoardMap.tsx
```

The exact folders can be adjusted during implementation, but the separation should remain:

- `system`: app-wide primitives.
- `system/game`: reusable tabletop/gameplay objects.
- `setup`: setup-only compositions.
- `game`: feature composition and gameplay orchestration.

## Phase 0: Checkpoint And Guardrails

### Objective

Protect the current board revamp before refactoring UI structure.

### Tasks

- Confirm branch and working tree state.
- Commit any already completed bug fixes separately from the system design refactor.
- Confirm no gameplay rules are being changed.
- Keep future commits small enough to review:
  - bug fixes
  - inventory/docs
  - primitives
  - migrations
  - showcase/storybook

### Done When

- The branch has a clean checkpoint commit.
- The next diff contains only system design planning or implementation work.

## Phase 1: Inventory And Usage Map

### Objective

Know what exists, what is used, and what should be consolidated.

### Files To Inspect

- `apps/web/src/components/system/*`
- `apps/web/src/components/system/*.stories.tsx`
- `apps/web/src/components/setup/SetupPrimitives.tsx`
- `apps/web/src/components/GameplayHud.tsx`
- `apps/web/src/components/SetupScreen.tsx`
- `apps/web/src/components/MultiplayerSetupScreen.tsx`
- `apps/web/src/components/LobbyScreen.tsx`
- `apps/web/src/components/GuidebookScreen.tsx`
- `apps/web/src/styles.css`
- `docs/product/showcase/system-showcase.html`

### Inventory Categories

For each component, classify as:

- **Keep**: used and still conceptually correct.
- **Migrate**: used, but should move into a better component or folder.
- **Merge**: similar to another component and should share an API.
- **Mark unused**: not used in app flow but worth keeping briefly.
- **Delete**: no usage and no clear future role.

### Expected Output

Add a table to this doc or a companion audit file:

```text
Component | Current path | Used by | Decision | Target path | Notes
```

### Done When

- Every component in `components/system` has a decision.
- Every major board HUD subcomponent has a migration target.
- No deletions happen yet.

### Phase 1 Inventory Result

| Component | Current path | Used by | Decision | Target path | Notes |
| --- | --- | --- | --- | --- | --- |
| `Button` | `components/system/Button.tsx` | Setup, lobby, guidebook, game HUD, modals | Keep | `components/system/Button.tsx` | Foundation action primitive. |
| `Badge` | `components/system/Badge.tsx` | New compatibility base for `Chip` | Keep | `components/system/Badge.tsx` | Compact status mark. |
| `Chip` | `components/system/Chip.tsx` | Stories/showcase comparison only | Mark unused/deprecated alias | `components/system/Badge.tsx` | App imports now use `Badge`; keep wrapper temporarily. |
| `ChoiceChipButton` | `components/system/ChoiceChipButton.tsx` | Route/station payment choices | Keep | `components/system/ChoiceChipButton.tsx` | Foundation choice control for compact action sets. |
| `FormField` | `components/system/FormField.tsx` | Local setup, multiplayer setup | Keep | `components/system/FormField.tsx` | Setup-heavy but generic enough for system. |
| `ModalShell` | `components/system/ModalShell.tsx` | Ticket picker legacy, local handoff, leave confirm | Keep | `components/system/ModalShell.tsx` | Needs consistent z-index tokens. |
| `Panel` | `components/system/Panel.tsx` | Game HUD, privacy shield, showcase | Keep | `components/system/Panel.tsx` | Keep variants but reduce overuse in feature code. |
| `SectionHeader` | `components/system/SectionHeader.tsx` | Most surfaces | Keep | `components/system/SectionHeader.tsx` | Foundation hierarchy primitive. |
| `StateSurface` | `components/system/StateSurface.tsx` | Lobby and multiplayer setup | Keep | `components/system/StateSurface.tsx` | Empty/error/success state surface. |
| `StatusBanner` | `components/system/StatusBanner.tsx` | Showcase/stories only | Mark unused/deprecated | `components/system/StatusBanner.tsx` | Gameplay no longer uses it. Keep for comparison until showcase refresh. |
| `SurfaceCard` | `components/system/SurfaceCard.tsx` | Build detail cards, endgame cards | Keep | `components/system/SurfaceCard.tsx` | Content/object container. |
| `UtilityPill` | `components/system/UtilityPill.tsx` | Showcase/stories only | Mark unused/deprecated | `components/system/UtilityPill.tsx` | Use `Badge` or feature-specific session chrome instead. |
| `CardSlot` | Extracted from `GameplayHud.tsx` | Hand, Market | Keep | `components/system/game/CardSlot.tsx` | Stable train-card slot language. |
| `TicketSlip` | Extracted from `GameplayHud.tsx` | Ticket dock, ticket choice sheet | Keep | `components/system/game/TicketSlip.tsx` | Game ticket object. Setup uses `SetupTicketSlip`. |
| `SeatTile` | Extracted from `GameplayHud.tsx` | Player roster | Keep | `components/system/game/SeatTile.tsx` | Compact player/seat tile. |
| `SideTabRail` | Extracted from `GameplayHud.tsx` | Right rail tabs | Keep | `components/system/game/SideTabRail.tsx` | Physical side tab spine. |
| `NotificationStack` | Extracted from `GameplayHud.tsx` | Floating notifications | Keep | `components/system/game/NotificationStack.tsx` | Gameplay notification pipe. |
| `GameOverPanel` | Extracted from `GameplayHud.tsx` | Game over overlay | Keep | `components/system/game/GameOverPanel.tsx` | End state shell. |

## Phase 2: Token And Material Language

### Objective

Create a shared language for color, typography, spacing, radii, elevation, and z-index before extracting components.

### Token Groups

- **Surface tokens**
  - `--surface-paper`
  - `--surface-ink`
  - `--surface-rail`
  - `--surface-table`
  - `--surface-overlay`

- **Material tokens**
  - `--material-paper-grain`
  - `--material-brass`
  - `--material-ink-border`
  - `--material-enamel`
  - `--material-shadow-soft`

- **Radius tokens**
  - `--radius-ticket`
  - `--radius-slot`
  - `--radius-panel`
  - `--radius-modal`
  - Avoid one universal rounded rectangle radius.

- **Type tokens**
  - `--font-display`
  - `--font-body`
  - `--font-label`
  - `--type-caption`
  - `--type-body`
  - `--type-title`
  - `--type-display`

- **Layer tokens**
  - `--z-dropdown`
  - `--z-sticky`
  - `--z-overlay`
  - `--z-modal`
  - `--z-toast`
  - `--z-tooltip`

### Rules

- Setup and gameplay share tokens.
- Gameplay may use more tactile material combinations.
- Setup may use quieter combinations.
- Do not introduce new visual values inside components unless they are one-off layout measurements.

### Done When

- Core tokens exist in `styles.css` or a clearly named CSS section.
- New game components use semantic tokens instead of repeated hard-coded colors.
- The board remains map-first and legible.

## Phase 3: Foundation Components

### Objective

Stabilize the app-wide primitives before adding game-specific primitives.

### Candidate Components

- `Button`
  - Keep.
  - Confirm variants: default, primary, quiet, danger, disabled.
  - Confirm fixed button sizing behavior for top utility buttons.

- `Panel`
  - Keep, but reduce overuse.
  - Clarify variants by role: neutral, status, private, alert.

- `ModalShell`
  - Keep.
  - Ensure leave confirmation and game over overlays use correct colors and z-index.

- `SectionHeader`
  - Keep.
  - Clarify density names and when to use display typography.

- `FormField`
  - Keep.
  - Setup-owned but generic enough for system.

- `Chip` and `UtilityPill`
  - Review for merge into `Badge`.
  - If both remain, define difference:
    - `Badge`: compact status mark.
    - `UtilityPill`: chrome/session metadata.

- `SurfaceCard` and `StateSurface`
  - Review for overlap.
  - Keep separate only if there is a clear difference:
    - `SurfaceCard`: content/object container.
    - `StateSurface`: empty/error/success state message.

- `StatusBanner`
  - Likely mark unused if board no longer uses it.
  - Keep temporarily if setup/lobby still needs it.

### Done When

- Foundation components have documented intent.
- Similar components are either merged or explicitly distinguished.
- Stories reflect current variants.

## Phase 4: Game System Components

### Objective

Extract reusable tabletop components from `GameplayHud.tsx` without turning game logic into system code.

### Candidate Components

- `CardSlot`
  - Replaces duplicated hand and market card tile markup.
  - Props:
    - `face`
    - `count`
    - `mode`: `hand | market`
    - `empty`
    - `disabled`
    - `spendDelta`
    - `onClick`
  - Must keep stable dimensions.

- `TicketSlip`
  - Replaces ticket rows in ticket dock and ticket choice sheet.
  - Props:
    - `fromLabel`
    - `toLabel`
    - `points`
    - `status`: `open | connected | keep | review`
    - `selected`
    - `focused`
    - `onFocus`
    - `onClick`
  - Should avoid huge pending labels.

- `SeatTile`
  - Replaces player roster row/card markup.
  - Props:
    - `name`
    - `color`
    - `ticketCount`
    - `trainsLeft`
    - `stationsLeft`
    - `active`
    - `timerLabel`
    - `placeholder`

- `SideTabRail`
  - Replaces hard-coded Market/Build/Chat tab spine.
  - Props:
    - `tabs`
    - `activeTab`
    - `onChange`
    - `orientation`

- `NotificationStack`
  - Replaces notification pipe markup.
  - Props:
    - `notifications`
    - `position`
    - `ariaLive`

- `GameOverPanel`
  - Replaces game over layer structure.
  - Keeps scoring content passed as children.

### Rules

- These components may know visual game language.
- They must not import rules reducers or mutate game state.
- They should accept labels and state from feature components.
- They should be Storybook-visible.

### Done When

- `GameplayHud.tsx` becomes mostly composition.
- Hand and Market use the same `CardSlot`.
- Ticket dock and draw-ticket sheet use the same `TicketSlip`.
- Right rail tabs come from `SideTabRail`.

## Phase 5: Setup Pattern Review

### Objective

Bring setup and multiplayer setup into the system without forcing gameplay styling onto setup forms.

### Tasks

- Review `SetupPrimitives.tsx`.
- Decide whether primitives belong in:
  - `system`
  - `setup`
  - feature screens
- Normalize naming:
  - `SetupStepPanel`
  - `SetupTicketSlip`
  - `DepartureBoardTile`
  - `TokenButton`
  - `MapThumbnail`
- Reuse `Button`, `FormField`, `SectionHeader`, and `Badge` where appropriate.

### Rules

- Setup can share typography and material tokens.
- Setup should stay calmer than gameplay.
- Do not import gameplay components into setup.

### Done When

- Setup primitives have clear names and boundaries.
- Setup screens use foundation components consistently.
- Setup does not depend on `system/game`.

## Phase 6: Documentation And Showcase

### Objective

Make the system visible and reviewable.

### Storybook Tasks

- Add or update stories for:
  - `Badge`
  - `Button`
  - `Panel`
  - `ModalShell`
  - `SectionHeader`
  - `StateSurface`
  - `SurfaceCard`
  - `CardSlot`
  - `TicketSlip`
  - `SeatTile`
  - `SideTabRail`
  - `NotificationStack`
  - `GameOverPanel`

### Showcase Tasks

- Update `docs/product/showcase/system-showcase.html`.
- Include sections:
  - Foundation
  - Setup patterns
  - Gameplay objects
  - Overlays and notifications
  - Typography and labels
  - Color/material samples

### Rules

- Showcase should reflect current production components, not fantasy components.
- If the static HTML cannot import React components, keep it as a visual reference and make Storybook the source of interactive truth.

### Done When

- The user can inspect all key system pieces visually.
- Storybook and showcase agree on naming.
- Deprecated or unused components are visible in the audit table.

## Phase 7: Migration Cleanup

### Objective

Remove or mark old components after migration is proven.

### Tasks

- Run `rg` for old component imports.
- Delete unused components only when there are zero imports and no story dependency.
- If keeping temporarily, add:

```ts
/**
 * @deprecated Unused after system design revamp. Keep temporarily for comparison.
 */
```

- Remove dead CSS selectors only after confirming they are not used by:
  - app screens
  - stories
  - showcase HTML
  - tests

### Done When

- No orphaned stories.
- No unused component files unless intentionally marked.
- No large obsolete CSS blocks remain without a note.

## Phase 8: Verification

### Build Checks

- `pnpm build`
- Storybook build command if available.

### UI Checks

- Setup screen renders.
- Multiplayer setup renders.
- Local game board renders.
- Online game board renders.
- Right rail tabs still switch.
- Draw tickets sheet still works.
- Leave confirmation still appears above board.
- Score guide hover appears above board.

### Regression Boundaries

Run e2e only if migration touches tested flows. If only stories/showcase change, build is enough.

## Proposed Execution Order

1. Phase 0: checkpoint.
2. Phase 1: inventory and usage map.
3. Phase 2: token cleanup.
4. Phase 3: foundation components.
5. Phase 4: game components.
6. Phase 6: stories/showcase for migrated pieces.
7. Phase 5: setup review.
8. Phase 7: cleanup.
9. Phase 8: verification.

Phase 5 can happen before Phase 4 if setup becomes the more urgent target, but the current board revamp makes game components the higher leverage first migration.

## Open Decisions

- Whether to create a physical `components/system/game/` folder or keep game primitives in `components/game/`.
- Decided: create `components/system/game/` for reusable gameplay objects.
- Decided: `Chip` becomes a deprecated alias for `Badge`.
- Decided: `UtilityPill` and `StatusBanner` stay deprecated for temporary showcase comparison.
- Decided: static showcase remains a visual review artifact; Storybook is the interactive source of truth.

## Execution Status

Updated: April 30, 2026

| Phase | Status | Result |
| --- | --- | --- |
| Phase 0: Checkpoint And Guardrails | Done | Committed prior HUD timer/test-hook fixes as `57937b3 Fix gameplay HUD timer regressions`. No gameplay rule changes in the system-design migration. |
| Phase 1: Inventory And Usage Map | Done | Added inventory table and decisions for current system primitives plus extracted gameplay HUD objects. |
| Phase 2: Token And Material Language | Done | Added semantic surface, material, radius, type, and z-index tokens in `theme.css` and exported material tokens from `tokens.ts`. |
| Phase 3: Foundation Components | Done | Added `Badge`, converted `Chip` to a deprecated compatibility alias, and marked `StatusBanner`/`UtilityPill` as deprecated comparison primitives. |
| Phase 4: Game System Components | Done | Extracted `CardSlot`, `TicketSlip`, `SeatTile`, `SideTabRail`, `NotificationStack`, and `GameOverPanel` under `components/system/game`. |
| Phase 5: Setup Pattern Review | Done | Kept setup primitives separate, renamed setup ticket component to `SetupTicketSlip`, and added setup exports without importing `system/game`. |
| Phase 6: Documentation And Showcase | Done | Added stories for new foundation/game components and updated design-system docs, component docs, and static showcase. |
| Phase 7: Migration Cleanup | Done | Updated active app imports away from deprecated `Chip`; retained deprecated compatibility files only where useful for stories/showcase comparison. |
| Phase 8: Verification | Done | `pnpm build`, `pnpm --filter @hudson-hustle/web build-storybook`, and `pnpm --filter @hudson-hustle/web test:e2e` pass. |

## Next System Component Improvement Items

Reviewed from the static System Component Showcase and built Storybook on April 30, 2026.

### P1: Make The Showcase Reviewable In The First Viewport

- The current showcase first viewport is too dark and low-contrast; the title and early sections are nearly unreadable before the page reaches the lighter component bands.
- Replace the dark intro treatment with a readable table-surface header, or invert the text system so the first viewport has deliberate contrast.
- Keep the page useful as a review artifact: every visible section title should be readable in screenshots without manual zooming.

### P1: Give Storybook Stories Real Component Frames

- Several stories render tiny components in a huge beige canvas, which makes scale and rhythm impossible to judge.
- Add Storybook decorators or per-story wrappers for:
  - `system`: neutral paper workbench.
  - `system/game`: dark tabletop workbench with constrained tray widths.
  - overlay components: centered modal/overlay frame.
- Stories should show the component at the size it uses in production, not stretched or floating in empty space.

### P1: Lock Intrinsic Size Contracts For Game Objects

- `CardSlot` should own or document its stable slot dimensions so isolated Storybook stories cannot stretch into a full-width bar.
- `TicketSlip` should render inside a realistic fixed-width ticket column in stories so typography, vertical status, and points badge can be reviewed.
- `SideTabRail` should be shown attached to a rail/tray edge, not floating alone.

### P1: Add Composition Stories For Real Game Surfaces

- Single primitive stories are not enough to judge the system language.
- Add composition stories for:
  - `PrivateHandRail` equivalent: 9 `CardSlot`s with empty, filled, and spend preview states.
  - `TicketDock` equivalent: 4 ticket slips, paging controls, connected count.
  - `SupplyDock` equivalent: market slots plus draw buttons.
  - `InspectorDock` equivalent: Market/Build/Chat tab spine with content.
  - `PlayerRoster` equivalent: 4 seats with active/timer/placeholder states.
- These can stay story-only compositions if feature components remain in `GameplayHud.tsx`.

### P2: Separate Deprecated Components In Storybook

- `Chip`, `UtilityPill`, and `StatusBanner` still appear beside active primitives in the Storybook sidebar.
- Move deprecated stories under `System/Deprecated/...` or tag them clearly so future work does not choose them by accident.
- Keep the compatibility files until imports and docs are fully migrated, then delete in a later cleanup.

### P2: Improve Storybook Docs Controls

- Controls currently show raw prop names without enough usage guidance.
- Add `argTypes` descriptions for high-risk props:
  - `CardSlot.mode`, `face`, `count`, `spendDelta`.
  - `TicketSlip.status`, `focused`.
  - `SeatTile.active`, `timerLabel`, `placeholder`.
  - `SideTabRail.tabs`, `activeTab`.
- Include short docs text: what owns gameplay state, what is visual-only, and what must stay feature-owned.

### P2: Align Showcase Examples With Current Components

- Static showcase still includes some older visual examples and should now mirror the new component names more tightly.
- Rename all visible “chip” language to “badge” unless referring to the deprecated alias.
- Add a small “deprecated comparison” row instead of mixing deprecated primitives into the active component narrative.

### P2: Add Accessibility Review Notes To Component Docs

- `TicketSlip`, `CardSlot`, and `SideTabRail` use visually distinctive shapes and vertical labels; document their accessible names and keyboard expectations.
- Add story examples for focus-visible states, disabled market card slots, and active tabs.
- Keep visual compactness, but require readable labels and stable focus outlines.

### P3: Add Screenshot QA Targets

- Store a short checklist of canonical screenshots:
  - System showcase first viewport.
  - Storybook `CardSlot` hand grid.
  - Storybook `TicketSlip` stack.
  - Storybook `SideTabRail` attached to right rail.
  - Storybook `GameOverPanel`.
- Use these as lightweight visual drift checks before future large UI passes.
