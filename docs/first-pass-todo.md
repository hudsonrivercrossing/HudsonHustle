# Hudson Hustle — First Pass Todo
**Branch:** `claude-design-critic` | **Goal:** First-pass polish → sets up for comprehensive design system via `/hudson-hustle-design-lead`

**Legend**
- Area: `System` · `Setup` · `Board`
- Role: `Eng` · `UX` · `PM`
- Effort: `S` = < 30 min · `M` = 30–90 min · `L` = half-day+
- [ ] = todo · [x] = done

---

## First Pass — Do On This Branch

Ordered by impact-to-effort. Foundation items first (they unblock design system), then visible player-experience wins.

### Tier 1 — System Foundations
*These unblock the design system phase. Do them first.*

| # | [ ] | Area | Role | Effort | What |
|---|-----|------|------|--------|------|
| 1 | [ ] | System | Eng | S | **Z-index CSS custom properties** — Add `--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-tooltip` to `theme.css`. Replace magic numbers in `styles.css`. Prerequisite for any design system token work. |
| 2 | [ ] | System | Eng | L | **Split `styles.css` into modules** — Extract into `system.css`, `setup.css`, `game.css`, `layout.css`, import all from root `styles.css`. Hard prerequisite for design system: can't build a component token layer on top of a 183KB monolith. |

### Tier 2 — High-Impact Player Experience
*Most visible player-facing gaps. Highest return on effort.*

| # | [ ] | Area | Role | Effort | What |
|---|-----|------|------|--------|------|
| 3 | [ ] | Board | UX + Eng | M | **Map-level "YOUR TURN" indicator** — Add a prominent visual state to the board when it's the current player's turn. Not just the sidebar seat tile — the map itself needs an ambient signal. Biggest game UX gap. |
| 4 | [ ] | Setup | PM + UX + Eng | S | **GUIDE as secondary CTA in SetupGateway** — Visually demote GUIDE tile. LOCAL and ONLINE should be primary; GUIDE should be a smaller link/button below the main tiles. First-timers need it, returning players ignore it — the current equal-weight layout buries the new-player path. |
| 5 | [ ] | Board | UX + Eng | M | **Supply dock doesn't occlude the map** — Supply dock currently overlays bottom-left of the board. Reposition or use a slide-in panel that doesn't sit over the map. Players are studying routes while drawing cards — covering the map at that moment is a direct UX conflict. |

### Tier 3 — Setup Flow Polish

| # | [ ] | Area | Role | Effort | What |
|---|-----|------|------|--------|------|
| 6 | [ ] | Setup | PM + UX + Eng | M | **Map picker metadata** — Show city count, route count, and estimated play time alongside each map thumbnail. Players are committing to a 45-minute game with only a thumbnail to decide from. Pull data from `game-data`. |
| 7 | [ ] | Setup | PM + UX | S | **Timer picker unit clarity** — Label the input with "seconds" explicitly. Add a helper note ("e.g. 30 = 30 seconds, 60 = 1 minute"). Common error: entering "2" meaning 2 minutes. |
| 8 | [ ] | Setup | UX + Eng | S | **Room code join validation hint** — Show code format/length hint ("6 characters") inline. Disable join CTA until minimum length is met. Add visual feedback when the field is empty vs. ready. |

### Tier 4 — Game Board Refinements

| # | [ ] | Area | Role | Effort | What |
|---|-----|------|------|--------|------|
| 9 | [ ] | Board | Eng | S | **`RouteDisplayState` typed contract** — Add `type RouteDisplayState = 'unclaimed' \| 'mine' \| 'opponent' \| 'ghost' \| 'blocked'` and `resolveRouteDisplayState()` to `game-data`. Decouples rendering from inline logic. Design system prep. |
| 10 | [ ] | Board | UX + Eng | M | **Game over ceremony** — `EndgameBreakdown` should use Fraunces display-lg for the winner, `StatusBanner active` tone for the winner row, `SurfaceCard` per player. This is the peak-end moment of every session — it currently renders as a plain list. |
| 11 | [ ] | System | Eng | S | **Avatar collision guard** — Detect duplicate avatar assignments in the same game. Assign the next available name if a collision occurs. Simple defensive fix; 10-avatar pool + 4+ players is a real collision case. |

---

## Design System Phase — Later (Not This Branch)

These are the right moves but too large or architectural for a first pass. Revisit when running `/hudson-hustle-design-lead`.

| Area | Role | Effort | What |
|------|------|--------|------|
| System | Eng | L | Extract socket + session logic from `App.tsx` into `useMultiplayerSocket()` and `useGameSession()` hooks |
| Board | Eng | L | Break `GameplayHud.tsx` into `BoardStage`, `PlayerHandPanel`, `InspectorPanel` |
| Setup | Eng | M | Merge `SetupScreen` + `MultiplayerSetupScreen` step components into shared `MapPickerStep`, `SeatPlanStep`, `TimerStep` |
| Board | Eng | M | Extract route geometry math to pure tested functions in `packages/game-data/src/geometry.ts` |
| System | UX + Eng | L | Dark mode variant (lower light emission for the canvas palette — not a brand change) |
| System | UX + Eng | L | Tablet viewport story (768–1024px breakpoint) |
| System | Eng | M | Notification queue management (max 3 visible, staggered dismiss, no overflow) |
| Setup | Eng | M | Setup state persisted to `sessionStorage` (survive refresh mid-setup) |
| Setup | Eng | M | Zod validation for setup forms |

---

## Commit Strategy

Each completed tier-1 or tier-2 item = one commit.  
Tier-3 and tier-4 items can bundle 2-3 related items per commit.  
Format: `fix(area): description (#item-num)`

---

*Source: [`docs/design-critique-2026-05-02.md`](design-critique-2026-05-02.md)*
