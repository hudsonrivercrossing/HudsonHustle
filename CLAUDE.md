# HudsonHustle — Agent Instructions

## Stack at a glance

- **App:** `apps/web/` — React + Vite + TypeScript
- **Styles:** `apps/web/src/styles/` — CSS custom properties, no CSS-in-JS
- **Design tokens:** `apps/web/src/design/theme.css` — single source of truth for all tokens
- **Design files:** `apps/web/src/design/*.pen` — Pencil files, sync via `/pencil-push` or `/pencil-pull`
- **Components:** `apps/web/src/components/ui/primitives/` + `ui/game/`
- **Storybook:** `pnpm --filter web storybook`

---

## UI/UX change workflow

Use this order for any visual or interaction change — from a small tweak to a new screen.

### 1. Understand before touching code

- Check `theme.css` first — does a token already exist for what you need?
- Check `system.css` and `game.css` for the component's current styles
- If the idea is bigger than a 1-line tweak, use `/brainstorm` before writing anything

### 2. Token-first changes

All visual values must trace back to a token in `theme.css`:

| What you're changing | Where it lives |
|---|---|
| Colors, surfaces, shadows | `theme.css` → `--color-*`, `--surface-*`, `--shadow-*` |
| Spacing, padding, gap | `theme.css` → `--space-*` |
| Typography | `theme.css` → `--type-*`, `--weight-*`, `--font-*` |
| Border radius | `theme.css` → `--radius-*` |
| Motion | `theme.css` → `--duration-*`, `--easing-*` |
| Primitive components | `system.css` |
| Game UI components | `game.css` |
| Page layout / grid | `layout.css` |

Never hardcode `px`, hex, or `rem` values in component CSS — use tokens.

### 3. Implement

- Edit CSS tokens in `theme.css` if adding/changing a token value
- Edit component styles in `system.css` or `game.css`
- If adding a new component, create it in `ui/primitives/` or `ui/game/` with a `.stories.tsx` alongside it
- New story title format: `"System/Primitives/ComponentName"` or `"System/Game/ComponentName"`

### 4. Visual verification (do all three)

1. **Storybook** — `pnpm --filter web storybook` — check the component in isolation, all variants
2. **Dev server** — `pnpm --filter web dev` — open the game, run through the golden path: Setup → Lobby → Local game → draw a ticket → end turn
3. **Regression check** — glance at unchanged screens for unintended side-effects (button styles, form fields, badges)

### 5. Sync the design file

After any token or visual change, sync back to Pencil:

```
/pencil-push
```

This keeps `tokens.pen` and `components.pen` aligned with the live CSS.

### 6. PR checklist

Before opening a PR for a UI change:
- [ ] No hardcoded values — all CSS uses tokens
- [ ] Storybook passes (new/changed component has a story)
- [ ] Golden path tested in dev server
- [ ] `tokens.pen` / `components.pen` updated via `/pencil-push`
- [ ] Screenshot in PR description showing before/after (or just after for new features)

---

## Component structure rules

- Primitives (Button, Panel, Badge, etc.) → `ui/primitives/` — no game logic, no state
- Game UI (BoardStage, PlayerRoster, etc.) → `ui/game/` — may import primitives, owns game-specific layout
- Shared utilities (ErrorBoundary, hooks) → `components/shared/`
- Never import game components into primitives

---

## CSS authoring rules

- Token usage is mandatory — `var(--radius-md)` not `12px`
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32px` (mapped to `--space-stack-xs/sm/md/lg/xl`)
- `backdrop-filter: blur()` capped at 2 layers per viewport — avoid on secondary surfaces
- No `border-left` stripes for visual hierarchy — use token-backed fills or perforation edges

---

## Pen file map

| File | CSS source | Content |
|---|---|---|
| `design/tokens.pen` | `theme.css` | Color, space, type, motion, radius tokens |
| `design/components.pen` | `system.css` + `game.css` | Component specs and state matrices |
| `design/layout.pen` | `layout.css` | Screen compositions at 3 breakpoints |

`.pen` files are encrypted — only access via `pencil` MCP tools, never `Read` or `grep`.

---

## Running the project

```bash
# Dev server
pnpm --filter web dev

# Storybook
pnpm --filter web storybook

# Type check
pnpm --filter web tsc --noEmit

# Tests (if any)
pnpm --filter web test
```
