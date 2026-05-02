# Hudson Hustle — Design Critique
**Branch:** `claude-design-critic` | **Date:** 2026-05-02 | **Version:** v2.1

---

## How to read this

Each of the three areas is reviewed from two angles:

- **Product (UX/PM)** — experience, flow, player emotion, and product decisions
- **Engineering (Lead)** — code structure that produces (or impedes) good design

---

## Area 1: Overall System Design

### Product — UX Designer & PM

**What's working**

The transit-nostalgia identity is confident and consistent. The Fraunces/IBM Plex Sans contract is the smartest single design decision in the system — ceremony vs. work is immediately readable and it filters naturally across every surface. The tactile shadow/inset/gradient system gives the UI physical weight without being skeuomorphic. The design is at a quality level most indie games never reach.

**Issues**

**P1 — No intermediate viewport story (768–1024px)**
The game layout grid `minmax(252px, 272px) 1fr` was designed for desktop-first with a 720px collapse fallback. There is nothing between them. On a 900px tablet in landscape, the board and inspector dock collide awkwardly. For a game that players pick up casually on a laptop or iPad, this is a hole in the product.

**P1 — No dark mode or session comfort mode**
`color-scheme: light` is hardcoded. Warm beige + brass is beautiful in a well-lit room. At 11pm on a turn 3 hour game, the same palette causes eye strain. A dark variant doesn't need to replace the palette — it needs to lower the light emission of the canvas. This is also an accessibility gap.

**P2 — Avatar collision with no handling**
The avatar pool has 10 names. Four players at the same table, all with seeded names, will eventually repeat. The game doesn't appear to detect or prevent it. Two "Conductor"s at the same table is a UX and social bug.

**P2 — Global z-index ladder has no visual communication**
The stacking order (dropdown 20 → sticky 40 → overlay 80 → modal 100 → toast 120 → tooltip 140) is correct in isolation, but there's no indication in the UI about what is "above" what at runtime. When the ticket picker, a notification, and a tooltip all appear during a single turn, the player has no spatial anchor for which layer is active.

**P3 — No skeleton states for async data**
The reconnect flow attempts to restore a session before showing the gateway. If it times out, it falls back. But between init and fallback, there is no skeleton, no shimmer, no visible loading affordance. The screen simply pauses and then transitions. This creates uncertainty — did it freeze, or is it loading?

---

### Engineering — Lead

**What's working**

The design tokens system (`tokens.ts` + `theme.css`) is solid. CSS custom properties with semantic naming (`--color-accent-core`, `--space-stack-md`) means the token layer can be refactored without touching components. This is the right foundation.

**Issues**

**P0 — `styles.css` at 183KB is unsustainable**
This is a single flat CSS file containing setup styles, game board styles, lobby styles, system components, and layout utilities — all mixed. There are no module boundaries. The consequences:
- Every page parses 183KB of CSS regardless of what's actually rendered
- Debugging a board map visual issue means grepping through a file that contains button styles
- A PR that changes one component's hover state touches the same file as a lobby layout fix — collision-prone diffs
- New contributors have no navigational landmarks

**Fix:** Split into at minimum five files loaded via `@import` in a root `styles.css`:
```
styles/
  tokens.css       ← already mostly done via theme.css
  system.css       ← Button, Panel, StateSurface, ModalShell, etc.
  setup.css        ← SetupGateway, SetupScreen, MultiplayerSetupScreen, Lobby
  game.css         ← GameplayHud, BoardMap, HUD panels
  layout.css       ← page shells, grid, responsive breakpoints
```

**P0 — `App.tsx` at 43KB is a testing and maintainability trap**
A single root component managing socket.io lifecycle, reconnect logic, local game state, multiplayer state, screen routing, and UI rendering is a violation of single responsibility at scale. It cannot be unit tested meaningfully. A bug in multiplayer socket handling can silently affect local game rendering.

**Fix:** Extract three layers:
1. `useMultiplayerSocket()` hook — owns socket.io connection, event handlers, reconnect
2. `useGameSession()` hook — owns game state, local/remote sync, session persistence
3. `AppRouter` component — renders the correct screen based on session state, no business logic

**P1 — Z-index values are magic numbers in CSS**
Z-index values (20, 40, 80, 100, 120, 140) are hardcoded in `styles.css`. There are no corresponding CSS custom properties or tokens.

**Fix:** Add to `theme.css`:
```css
--z-dropdown: 20;
--z-sticky: 40;
--z-overlay: 80;
--z-modal: 100;
--z-toast: 120;
--z-tooltip: 140;
```

**P2 — No CSS scoping or dead-code detection**
Pure CSS with no modules means no tree-shaking and no linting for unused rules. Selectors accumulate. Historical styles for removed components may still be in the file.

**Fix:** Introduce `eslint-plugin-css-modules` or `purgecss` in the build pipeline to surface orphaned rules. Does not require switching CSS architecture.

---

## Area 2: Game Setup Flow

### Product — UX Designer & PM

**What's working**

The departure board tile aesthetic for mode selection (LOCAL / ONLINE / GUIDE) is the most memorable UI moment in the pre-game flow. The preflight card on the right during local setup — showing map thumbnail and readiness state — is excellent: it gives the player something to look at while making decisions without cluttering the form area.

**Issues**

**P0 — GUIDE is equal weight to LOCAL and ONLINE**
On the SetupGateway, three departure tiles are visually identical. The GUIDE is for first-time players who don't know the rules. Returning players will never click it. But for a first-timer, it should be the recommended entry point — with a visual nudge, not buried as a third-equal option. Currently, it has the same visual weight as the main game modes.

**P1 — No "quick start" path for returning players**
Every session walks through the full multi-step setup: gateway → mode → seats → map → timer. This is four meaningful screens before the board appears. For a returning group who plays every week with the same settings, this is friction. There is no "play again with same settings" shortcut or quick-launch path.

**P1 — Map selection has almost no decision support**
The map picker shows a thumbnail. That's all. Players choosing between maps have no way to know: How many cities? How many routes? Estimated play time? Difficulty? Complexity? A thumbnail is not enough for a decision that determines a 45-minute game session.

**P2 — Timer picker speaks in seconds, players think in minutes**
The custom timer field accepts seconds. Most board game players talk about turn timers in terms of "30 seconds" or "1 minute." The input label and placeholder don't make the unit obvious until you start typing. This creates a common input error (entering "2" when you mean "2 minutes").

**P2 — Room code join has no real-time validation**
In `MultiplayerSetupScreen`, joining a room requires entering a code. There's no indication of code validity until submission. A simple length check or format hint (e.g., "codes are 6 characters") reduces wrong-code submissions. The join CTA is active even with an empty field.

**P3 — Preflight card transitions abruptly**
The preflight card alternates between showing the map thumbnail and a status state as the user moves between steps. The swap is instantaneous. A cross-fade or slide-in would reduce visual discontinuity and reinforce that the card is live and responsive.

---

### Engineering — Lead

**What's working**

`SetupPrimitives.tsx` (SetupShell, StationPlate, SetupStepper) shows the right instinct — extracting repeated setup patterns into a shared layer. The stepper abstraction is clean.

**Issues**

**P1 — `SetupScreen` and `MultiplayerSetupScreen` are diverged siblings**
Both screens share: seat configuration, map selection, timer picker. These are duplicated implementations with separate state management. When a change is needed in map selection UX (e.g., adding route counts to the thumbnail), it must be applied in two places.

**Fix:** Extract a `MapPickerStep`, `SeatPlanStep`, and `TimerStep` component family. Both setup screens compose from these shared steps.

**P1 — Multi-step setup state is component-local and ephemeral**
Setup step (`step 0 / 1 / 2`) lives in local component state. A browser refresh during setup loses all progress. For local setup this is minor friction. For multiplayer setup where a host is configuring a room, losing the configuration on a refresh is a genuine UX bug.

**Fix:** Persist setup state to `sessionStorage` during the setup flow, clear on game start or abandon.

**P2 — No input validation library**
Setup forms validate with ad-hoc conditions inline. The timer picker, seat name fields, room code input — each has its own validation logic. This is difficult to test and drifts over time as new inputs are added.

**Fix:** Use Zod schemas for setup form validation. Validate at form schema level, not scattered across render logic.

**P2 — Reconnect logic belongs in a hook, not the root component**
The reconnect flow in `App.tsx` runs before the gateway renders. It uses `localStorage`, attempts an async reconnect, and falls back. This is testable behavior that is currently unextractable because it lives in the root render function.

**Fix:** Extract to `useReconnectSession()` returning `{ status: 'checking' | 'found' | 'failed', session }`.

---

## Area 3: Game Board & Map

### Product — UX Designer & PM

**What's working**

Map-first layout is the correct call. The inspector dock on the right pulls all secondary info out of the board's way. The notification stack (aria-live polite) is accessible and unobtrusive. The side tab rail for switching between tickets/market/chat is a clean navigation affordance that doesn't clutter the board.

**Issues**

**P0 — No prominent "your turn" moment on the map**
When it becomes a player's turn, the primary signal is the seat tile in the sidebar changing state. But a player focused on the map — deciding which route to claim — has their eyes on the board, not the panel. There is no map-level overlay, ambient glow, or prominent banner that says "YOUR TURN."

This is the most impactful missing interaction in the game. Turn-based games live or die on the clarity of "is it my turn?" The current design requires the player to look away from the board to confirm their turn status.

**P1 — Supply dock overlay occludes the map**
The supply dock (card draw area) overlays the bottom-left of the board. This is the zone players are actively looking at to study routes. An overlay that covers the map during card-draw actions is the worst possible placement — it hides the context you need to make your decision (which routes can I claim with these cards?).

**P1 — Route state visual contrast is critical and undocumented**
In a route-claiming game, the visual difference between claimable / claimed-by-me / claimed-by-opponent / double-route-available must be instantly readable. The BoardMap renders these as SVG paths with different states, but there's no design specification for the contrast requirements. In the warm beige palette, a claimed route in a muted tone can be confused with an unclaimed route on a glancing read.

**P1 — Game over is a list, not a ceremony**
`EndgameBreakdown` renders the end-of-game score as inline text lists. After a 45-minute game, this is the peak-end moment — the emotional high point. But it reads like a data dump. There's no winner highlight, no Fraunces display moment, no score reveal cadence. The design system has all the ingredients for a proper ceremony (Fraunces display-lg, StatusBanner active tone, SurfaceCard per player) — they're just not assembled for this moment.

**P2 — Inspector dock may be too narrow for players with many tickets**
The dock is locked at approximately 252-272px wide. A player holding 8+ tickets plus a full card hand will see truncated ticket text and cramped slip layouts. The dock doesn't offer a way to expand or focus on tickets exclusively (beyond the side tab).

**P2 — Card hand rail selection state clarity**
The private hand rail (cards) is horizontal. For a player selecting which cards to play for a route claim, it must be immediately clear which cards are "selected" vs. "in hand." If the selected state is only a border change, it's insufficient for a game decision made under time pressure.

**P3 — Score guide tooltip is too small at endgame**
`ScoreGuide` is a small tooltip. At the moment players most want to understand their score breakdown (endgame), the reference UI is a tooltip — the least accessible format for dense information.

---

### Engineering — Lead

**What's working**

The `game-core` / `game-data` / `web` package split is architecturally correct. Game logic lives outside the React layer. `BoardMap.tsx` being a focused rendering component (not an event handler) is the right instinct.

**Issues**

**P0 — `GameplayHud.tsx` is too fat**
A single component that manages tickets, trains, stations, route claiming, card drawing, overlays, supply dock, notifications, game over layer, and board stage is accumulating responsibility at a rate that makes it fragile. It is the `App.tsx` problem repeated one layer down.

**Fix:** Break into three orchestrators:
1. `BoardStage` — owns the map + supply dock + route interaction
2. `PlayerHandPanel` — owns card hand, draw pile, discard interaction
3. `InspectorPanel` — owns the right dock (tickets, market, chat tabs)

`GameplayHud` becomes a thin shell that arranges these three panels in the grid layout.

**P1 — BoardMap route geometry is inline math with no tests**
Path interpolation for routes is computed inside the component. Geometry math (curve handles, midpoints, path offsets for double routes) embedded in JSX render logic cannot be unit tested. A regression in path rendering is only catchable visually.

**Fix:** Extract to `packages/game-data/src/geometry.ts`:
```typescript
export function routePathD(route: RouteVisual, index: number): string
export function routeMidpoint(route: RouteVisual): Point
export function doubleRouteOffset(route: RouteVisual, slot: 0 | 1): RouteVisual
```
Each function is a pure computation testable with `vitest`.

**P1 — Route visual state has no typed contract**
The visual state of a route (claimable, mine, opponent, ghost) is derived from game state inside `BoardMap`. There is no explicit `RouteDisplayState` type. If the logic grows (special routes, blocked routes, highlighted routes for tutorial), it will be derived ad hoc.

**Fix:** Define in `game-data`:
```typescript
export type RouteDisplayState = 'unclaimed' | 'mine' | 'opponent' | 'ghost' | 'blocked'
export function resolveRouteDisplayState(route: Route, playerId: string, gameState: GameState): RouteDisplayState
```

**P2 — NotificationStack has no queue management**
The notification stack accepts events via `aria-live`. Rapid game events (route claimed, card drawn, timer warning) can produce multiple simultaneous notifications. Without queue management (max visible, auto-dismiss with delay staggering, overflow behavior), notifications can stack visually and overflow their z-index container.

**Fix:** Add a queue in the notification hook:
- max 3 visible at once
- each notification auto-dismisses in ~3s
- overflow queued, not dropped

**P2 — SVG optimization not addressed**
As maps grow in city and route count, the SVG DOM grows linearly. No mention of `<use>` element reuse, path deduplication, or lazy rendering for complex maps. On lower-end hardware, a complex map SVG will cause paint jank.

---

## Cross-Cutting Recommendations

### For Product

| Priority | Action |
|---|---|
| P0 | Add a prominent turn indicator at map level (not just in sidebar) |
| P0 | Reframe GUIDE as a secondary entry in SetupGateway, not an equal tile |
| P1 | Add map metadata to the picker (city count, route count, estimated time) |
| P1 | Give endgame a ceremony — winner reveal, score breakdown with hierarchy |
| P1 | Investigate tablet viewport (768–1024px) and add a breakpoint |
| P2 | "Play again" shortcut for returning players |
| P2 | Darken/ease the supply dock so it doesn't occlude the map |

### For Engineering

| Priority | Action |
|---|---|
| P0 | Split `styles.css` into 5 logical modules |
| P0 | Extract socket + session logic out of `App.tsx` into hooks |
| P0 | Break `GameplayHud.tsx` into three focused orchestrators |
| P1 | Extract route geometry math to testable pure functions in `game-data` |
| P1 | Add `RouteDisplayState` type contract |
| P1 | Merge `SetupScreen` + `MultiplayerSetupScreen` step components |
| P2 | Add z-index CSS custom properties |
| P2 | Add notification queue management |

---

## Design Health Score (Nielsen's 10 Heuristics)

| # | Heuristic | Score /4 | Notes |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Good: lobby progress, reconnect feedback. Gap: no map-level turn indicator, no loading skeleton |
| 2 | Match System / Real World | 4 | Transit nostalgia is authentic. Departure board, ticket slips, seat tiles all match the mental model |
| 3 | User Control & Freedom | 2 | No "undo" on route claims (fair for the game, but no escape from mid-turn card selection). Setup has no "start over" affordance |
| 4 | Consistency & Standards | 3 | Design system components are consistent. The gap is setup screen duplication — same patterns with different implementations |
| 5 | Error Prevention | 2 | Timer input in seconds is error-prone. Room code join has no validation. No confirm on route claim |
| 6 | Recognition vs Recall | 3 | Tickets and route names visible throughout. Gap: player must recall which routes they've claimed; no "my routes" highlight |
| 7 | Flexibility & Efficiency | 1 | No keyboard shortcuts documented. No quick-start path. Every session requires full setup flow |
| 8 | Aesthetic & Minimalist Design | 3 | Warm, disciplined palette. Gap: 183KB CSS file suggests style accumulation, not curation |
| 9 | Error Recovery | 2 | Reconnect flow exists. Gap: no in-game recovery for disconnect; error messages are generic |
| 10 | Help & Documentation | 2 | Guidebook screen exists but is equal-weight with PLAY on the gateway. In-game help is absent during play |
| **Total** | | **24/40** | **Functional — clear room to improve** |

---

*Generated on `claude-design-critic` branch. Source files read: App.tsx, BoardMap.tsx, GameplayHud.tsx, SetupScreen.tsx, MultiplayerSetupScreen.tsx, SetupGateway.tsx, LobbyScreen.tsx, GuidebookScreen.tsx, TicketPicker.tsx, TransitCard.tsx, SetupPrimitives.tsx, EndgameBreakdown.tsx, ScoreGuide.tsx, tokens.ts, theme.css, styles.css, Button.tsx, Panel.tsx, StateSurface.tsx, ModalShell.tsx, SurfaceCard.tsx, SeatTile.tsx, TicketSlip.tsx, NotificationStack.tsx, SideTabRail.tsx, DESIGN.md.*
