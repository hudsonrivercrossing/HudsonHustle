# Pencil Sync — Design ↔ Code Architecture

Bidirectional sync between Hudson Hustle CSS/TS files and Pencil `.pen` design files.

## Three-file model

```
CSS/TS source              Pencil design file
─────────────────          ───────────────────────────────────────
theme.css             ↔   tokens.pen       colors, space, type, motion
layout.css            ↔   layout.pen       grid, shell, breakpoint specs
system.css + game.css ↔   components.pen   Button, Badge, Panel, HUD, etc.
```

CSS is the **source of truth** for shipped values.  
Pencil is the **design canvas** — it reflects the system and is where new designs are spec'd.

## Sync directions

### `/pencil-push` — Code → Pencil

Run when CSS was updated and Pencil needs to reflect it.

1. Parse `theme.css` → extract all `--var-name: value` pairs
2. Call `set_variables` on `tokens.pen` for color/number/string vars
3. Parse `layout.css` → update frame annotations in `layout.pen`
4. Parse `system.css` + `game.css` → update component frames in `components.pen`

Use the `pencil-sync` skill for step-by-step MCP tool calls.

### `/pencil-pull` — Pencil → Code

Run when a design decision was made in Pencil that should flow back to CSS.

1. Call `get_variables` on `tokens.pen` → diff against `theme.css` → write changed vars
2. Call `snapshot_layout` on `layout.pen` → extract measurements → update `layout.css`
3. Call `batch_get` on `components.pen` → extract specs → update `system.css`

## File responsibilities

### `tokens.pen` ↔ `theme.css`

Pencil variables correspond 1:1 with CSS custom properties.

| CSS prefix | Content |
|------------|---------|
| `--color-*` | All palette colors |
| `--map-*` | Map water/shore colors |
| `--shadow*`, `--shadow-strong` | Box shadow values |
| `--radius-*` | Border radius scale |
| `--space-*` | Spacing stack scale |
| `--layout-*` | Page-level dimensions |
| `--type-*` | Font size scale |
| `--weight-*` | Font weight scale |
| `--lh-*` | Line height scale |
| `--ls-*` | Letter spacing scale |
| `--font-*` | Font family stacks |
| `--duration-*` | Motion timing |
| `--easing-*` | Easing curves |
| `--control-*` | Control sizing/colors |

Complex values (clamped type, material textures, z-indices) live as text annotations in the Pencil canvas, not as typed variables.

### `layout.pen` ↔ `layout.css`

Each top-level frame in `layout.pen` documents one CSS layout class.  
Frame name = CSS class name (`.game-layout` → frame `game-layout`).

Key layout classes tracked:
- `.app-shell` — page shell padding + min-height
- `.game-layout` — two-column grid (sidebar + board)
- `.side-panel` / `.board-column` — panel stack grids
- `.setup-flow-grid` / `.setup-entry-grid` / `.setup-field-grid` — setup flow grids
- `.field-grid` — auto-fit form field grid
- `.topbar-actions` / `.setup-actions` / `.chip-row` — action row flex specs

### `components.pen` ↔ `system.css` + `game.css`

Each component frame in `components.pen` corresponds to one component class cluster.

Components tracked:
- Button (`.system-button` + variants)
- Badge (`.badge`)
- Panel (`.panel`)
- FormField (`.form-field`)
- SectionHeader (`.section-header`)
- Choice chip (`.choice-chip-button` / `.chip-button`)
- Ticket card (`.ticket-card`)
- Supply dock (`.supply-dock` + `--board` variant)
- Surface card (`.surface-card` — `--detail` / `--summary` variants)
- Transit card (`.transit-card` — `--hand` / `--market` / `--locomotive`)
- System chip (`.system-chip` — 5 color variants)
- Modal (`.modal-shell` / `.modal-card` — `--md` / `--lg` / `--left`)
- Ticket dock (`.ticket-dock` + `.ticket-row`)
- Player roster (`.player-roster` + `.floating-player-panel`)
- Endgame (`.endgame-card` + `.endgame-breakdown`)
- Topbar (`.topbar` + `.topbar--gameplay-actions`)
- HUD controls (player-strip, hand-color-slot, ticket-status)

## Pencil MCP connection

The `pencil` MCP server connects via a Unix socket:
```
~/.pencil/socket/pencil-visual_studio_code.sock
```

**Requirements:**
- Pencil app open in VS Code
- A `.pen` file must be active (open tab or clicked in file explorer)

**If "transport not connected":** Click any `.pen` file in VS Code explorer → retry.

## Adding new design tokens

1. Add the CSS var to `theme.css`
2. Run `/pencil-push` → the var appears in `tokens.pen`
3. The Pencil designer can now bind frames to the variable

## Naming conventions

| Level | Convention |
|-------|------------|
| Pencil variables | `color-canvas-base` (no `--` prefix, kebab-case) |
| CSS custom properties | `--color-canvas-base` (with `--`, in `:root`) |
| Pencil frame names | Match the CSS class name exactly, no dot |
| Pencil file names | Match the CSS file basename (`theme`, `layout`, `components`) |

## Status

| File | Status |
|------|--------|
| `tokens.pen` | Clean — all CSS vars wired as Pencil variables (colors, type, space, lh, ls, motion, radius, z, card, material, setup, layout) |
| `layout.pen` | Created (2026-05-06) — app-shell, game-layout, side-panel, setup flows, field-grid, action rows |
| `components.pen` | Created (2026-05-06) — 17 components: Button, Badge, Panel, FormField, SectionHeader, choice-chip, ticket-card, supply-dock, surface-card/detail-card, transit-card, system-chip, modal-shell, ticket-dock/row, player-roster, floating-player-panel, endgame-card/breakdown, topbar, HUD |
| `theme.css` | Clean source of truth |
| `layout.css` | Clean — layout rules extracted from system.css (2026-05-06) |
| `system.css` | Component styles only, layout rules removed |
