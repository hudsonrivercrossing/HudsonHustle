# HudsonHustle — Agent Instructions

## Stack at a glance

- **App:** `apps/web/` — React + Vite + TypeScript
- **Server:** `apps/server/` — Fastify + Socket.IO, Postgres through Drizzle (migrations in `apps/server/drizzle/`)
- **Rules engine:** `packages/game-core/` — pure, deterministic, no UI imports. `src/rules.ts` holds each rule once (points, payment, open routes, draws, final scoring); the reducer, the bots, the table and the server all call it. A rule copied anywhere else is a bug waiting to happen
- **Map data:** `packages/game-data/` and `configs/hudson-hustle/`. Maps are checked when loaded (`map-validation.ts`), and `board-geometry.ts` is the one place that says where a route runs, how long each space is and what box a station name takes. Layout tests in `packages/game-data/tests/` run on every released map
- **Styles:** `apps/web/src/styles/` — plain CSS with custom properties, one file per component
- **Design tokens:** `apps/web/src/styles/theme.css` — the single source of truth

There is no Storybook and no separate design file. The running app is the reference: change the code, then look at it.

---

## CSS file map

`apps/web/src/styles.css` lists every stylesheet in cascade order. Keep that order: tokens, then base, layout, primitives, then features.

| Folder | What it styles | Component folder |
|---|---|---|
| `theme.css` | All tokens — colour, space, type, radius, motion, stacking | — |
| `base.css` | Element defaults and the reduced-motion rule | — |
| `layout/` | App shell and the table: `tabletop.css` places the board, rails and hand, and holds the phone arrangement | `components/screens/` |
| `primitives/` | Game-agnostic pieces: button, chip, panel, form-field, modal-shell, … | `components/ui/primitives/` |
| `game/` | Board and score track, transit cards, hand, supply, tickets, seats, turn and tunnel moments, game over, replay, … | `components/ui/game/` + `components/screens/gameplay/` + `components/screens/replay/` |
| `screens/` | Setup, lobby, guidebook, onboarding tips | `components/setup/` + `components/online/` + `components/screens/` + `components/shared/` |

A rule lives in the file of the component that is doing the styling. `.supply-dock .system-button` belongs in `game/supply-dock.css`, not in `primitives/button.css`. A new component gets a new file and a new `@import` line.

---

## Component folder map

| Folder | What lives here |
|---|---|
| `ui/primitives/` | Game-agnostic primitives: Button, Panel, Badge, FormField, ModalShell, SectionHeader, StateSurface, StatusBanner, SurfaceCard, ChoiceChipButton, TimerPicker |
| `ui/game/` | Game-domain pieces: BoardMap (with the score track), TableSeats, TableTickets, TableSupply, TableHand, TrainCardFace, TurnAnnouncement, TunnelRevealMoment, TurnPanel… |
| `screens/` | Full screens — `screens/gameplay/` is shared by local and online play |
| `local/` | Local-play panels and storage helpers |
| `online/` | Online flows (create and join a room) and `useOnlineRoom` |
| `setup/` | Setup pieces shared by local and online setup |
| `shared/` | Cross-cutting: ErrorBoundary, CoachHint (tips shown at the moment they apply) |

**The one rule:** if a component takes props and renders with no external state, socket, or store — it lives in `ui/`. If it assembles a full screen, it lives in `screens/`. Otherwise pick the right feature folder.

Each folder has one `index.ts`. No folder's index re-exports from a sibling or parent folder.

---

## UI change workflow

### 1. Understand before touching code

- Check `theme.css` first — does a token already exist for what you need?
- Find the stylesheet that owns the component (see the map above).
- Game rules never go in React components; they belong in `packages/game-core`.

### 2. Token-first

| What you're changing | Token family |
|---|---|
| Colours, surfaces, shadows | `--color-*`, `--surface-*`, `--shadow-*` |
| Spacing, padding, gap | `--space-*` |
| Typography | `--type-*`, `--weight-*`, `--font-*`, `--ls-*` |
| Border radius | `--radius-*` |
| Motion | `--duration-*`, `--easing-*` |
| Stacking | `--z-*` |

### 3. Verify (all three)

1. **Checks** — `pnpm typecheck`, `pnpm test`, `pnpm css:debt`
2. **Dev server** — `pnpm --filter @hudson-hustle/web dev`, golden path: setup → local game → keep tickets → draw → claim a route → end turn
3. **End to end** — `pnpm --filter @hudson-hustle/web test:e2e` when a flow, a label, or a test id changed

### 4. PR checklist

- [ ] `pnpm css:debt` does not report growth
- [ ] New logic has a unit test beside it
- [ ] Golden path walked in the dev server, at desktop and phone width
- [ ] Screenshot in the PR description for a visible change

---

## CSS authoring rules

- Colours are written in **OKLCH**. Hex, `rgb()` and `hsl()` are rejected by `pnpm css:debt`.
- A tint is `color-mix(in oklch, var(--x-solid) 12%, transparent)`, not a second token with the alpha baked in.
- `z-index` always uses a `--z-*` token. The scale is ordered in `theme.css`; add a named layer rather than a number.
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32px` → `--space-stack-xs/sm/md/lg/xl`.
- No `!important`. The ones left are the reduced-motion rule and the build-panel reset; do not add more — raise the question of why the cascade is being fought instead.
- One rule per selector per file. If a selector appears twice, merge the two.
- `backdrop-filter: blur()` capped at 2 layers per viewport.
- No `border-left` stripes for hierarchy — use token-backed fills or perforation edges.
- `transition` names its properties; never `transition: all`.
- Motion animates `transform` and `opacity` only. Anything arriving on screen uses `--easing-enter`; hover and colour changes use `--easing-standard`. A hover lift sits inside `@media (hover: hover) and (pointer: fine)`.
- Decide by frequency: an action taken every turn gets at most ~250ms; a moment that happens a few times a game (a tunnel, the final count) may take longer and must be skippable.
- Every animation has a reduced-motion path. The global rule in `base.css` shortens durations; staged sequences also set `animation: none` so nothing waits on a delay.

`pnpm css:debt` counts literal values that should be tokens and fails when a count grows. When a count shrinks, lock it in with `pnpm css:debt --update`.

---

## Running the project

```bash
pnpm --filter @hudson-hustle/web dev      # web dev server
pnpm --filter @hudson-hustle/server dev   # API and sockets (in-memory unless DATABASE_URL is set)
pnpm typecheck                            # sources and tests, all packages
pnpm test                                 # unit tests, all packages
pnpm css:debt                             # token debt ratchet
pnpm sim -- --duel hard,standard          # bot balance simulator
```

The server tests clear `DATABASE_URL` and `PG*` so they can never reach a real database. The Postgres integration tests run only when `HH_TEST_DATABASE_URL` points at a disposable server.
