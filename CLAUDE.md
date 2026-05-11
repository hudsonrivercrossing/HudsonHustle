# HudsonHustle — Agent Instructions

## Stack at a glance

- **App:** `apps/web/` — React + Vite + TypeScript
- **Styles:** `apps/web/src/styles/` — CSS custom properties, no CSS-in-JS
- **Design tokens:** `apps/web/src/styles/theme.css` — single source of truth for all tokens
- **Design files:** `apps/web/src/design/*.pen` — Pencil files, sync via `/pencil-push` or `/pencil-pull`
- **Components:** `apps/web/src/components/` — see folder map below
- **Storybook:** `pnpm --filter web storybook`

---

## CSS file map

| File | What it styles | Component folder |
|---|---|---|
| `theme.css` | All design tokens — colors, space, type, radius, motion, z-index | — (tokens only) |
| `ui.css` | Game-agnostic UI primitives | `components/ui/primitives/` |
| `game.css` | Game-domain primitives + live HUD | `components/ui/game/` + `components/screens/gameplay/` |
| `layout.css` | App shell, game grid, board column | `components/screens/` |
| `setup.css` | Setup and lobby flow styles | `components/setup/` + `components/online/` |
| `onboarding.css` | Onboarding overlay | `components/shared/OnboardingTour` |

Import order in `styles.css`: `theme.css` → `ui.css` → `game.css` → `layout.css` → `setup.css` → `onboarding.css`

---

## Component folder map

| Folder | What lives here | CSS counterpart |
|---|---|---|
| `ui/primitives/` | Game-agnostic primitives: Button, Panel, Badge, FormField, ModalShell, SectionHeader, StateSurface, StatusBanner, SurfaceCard, ChoiceChipButton, TimerPicker | `ui.css` |
| `ui/game/` | Game-domain primitives: CardSlot, SeatTile, TicketSlip, TransitCard, BoardMap, BoardStage, InspectorDock, PlayerRosterPanel, SupplyDock… | `game.css` |
| `screens/` | Full screens — `screens/gameplay/` is the most complex | `layout.css` |
| `local/` | Local-play feature panels and utilities | `game.css` |
| `online/` | Online feature flows (create/join room) | `setup.css` |
| `setup/` | Setup-flow shared pieces used by multiple screens | `setup.css` |
| `shared/` | Cross-cutting: ErrorBoundary, OnboardingTour | `onboarding.css` |

**The one rule:** if a component takes props and renders with no external state, socket, or store — it lives in `ui/`. If it assembles a full screen, it lives in `screens/`. Otherwise pick the right feature folder.

Each folder has one `index.ts`. No folder's index re-exports from a sibling or parent folder.

---

## UI/UX change workflow

Use this order for any visual or interaction change — from a small tweak to a new screen.

### 1. Understand before touching code

- Check `theme.css` first — does a token already exist for what you need?
- Check the CSS file that owns the component (see CSS file map above)
- If the idea is bigger than a 1-line tweak, use `/brainstorm` before writing anything
- Before any feature work: open `hudsonhustle.pen` and confirm the token, component, or layout zone you need exists — add to Pencil first, then write CSS/TSX

### 2. Token-first

All visual values must trace back to a token in `theme.css`:

| What you're changing | Token family |
|---|---|
| Colors, surfaces, shadows | `--color-*`, `--surface-*`, `--shadow-*` |
| Spacing, padding, gap | `--space-*` |
| Typography | `--type-*`, `--weight-*`, `--font-*` |
| Border radius | `--radius-*` |
| Motion | `--duration-*`, `--easing-*` |

Never hardcode `px`, hex, or `rem` values in component CSS — use `var(--token-name)`.

### 3. Implement

- Add/change token values in `theme.css`
- Edit component styles in the correct CSS file (see map above)
- New `ui/primitives/` or `ui/game/` component → add a `.stories.tsx` alongside it
- Story title format: `"System/Primitives/ComponentName"` or `"System/Game/ComponentName"`

### 4. Visual verification (do all three)

1. **Storybook** — `pnpm --filter web storybook` — component in isolation, all variants
2. **Dev server** — `pnpm --filter web dev` — golden path: Setup → Lobby → Local game → draw a ticket → end turn
3. **Regression check** — glance at unchanged screens for side-effects (buttons, form fields, badges)

### 5. Sync design files

After any token or visual change, sync back to Pencil:

```
/pencil-push
```

This keeps `tokens.pen` and `components.pen` aligned with the live CSS.

### 6. PR checklist

- [ ] No hardcoded values — all CSS uses tokens
- [ ] Storybook passes (new/changed component has a story)
- [ ] Golden path tested in dev server
- [ ] `tokens.pen` / `components.pen` updated via `/pencil-push`
- [ ] Screenshot in PR description showing before/after

---

## CSS authoring rules

- Token usage is mandatory — `var(--radius-md)` not `12px`
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32px` → `--space-stack-xs/sm/md/lg/xl`
- `backdrop-filter: blur()` capped at 2 layers per viewport — avoid on secondary surfaces
- No `border-left` stripes for visual hierarchy — use token-backed fills or perforation edges

---

## Pen file map

| File | CSS source | Pencil column | Content |
|---|---|---|---|
| `design/tokens.pen` | `theme.css` | Column 1 | Color, space, type, motion, radius tokens |
| `design/components.pen` | `ui.css` + `game.css` | Column 2 | Component specs and state matrices |
| `design/layout.pen` | `layout.css` + `setup.css` | Column 3 | Screen compositions at 3 breakpoints |
| `design/hudsonhustle.pen` | all of the above | all columns | Unified canvas — use this for cross-cutting review |

`.pen` files are encrypted — only access via `pencil` MCP tools, never `Read` or `grep`.

---

## Running the project

```bash
pnpm --filter web dev          # dev server
pnpm --filter web storybook    # component explorer
pnpm --filter web tsc --noEmit # type check
```
