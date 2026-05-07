---
name: pencil-sync
description: Use when syncing Hudson Hustle design tokens, layout specs, or component styles between CSS files and Pencil .pen design files — including push (code→Pencil), pull (Pencil→code), or creating/updating the three .pen design files.
---

# Pencil Sync

Bidirectional sync between Hudson Hustle CSS/TS files and Pencil `.pen` design files via the `pencil` MCP server.

## CRITICAL: Active Editor and filePath Behavior

**`batch_design` always writes to the ACTIVE editor — `filePath` is read-only context, not the write target.**

Rules to follow every time:

1. Call `open_document(path)` before any write session to explicitly set the active editor
2. Immediately verify with `get_editor_state` that the correct file is active
3. Never assume the active editor is unchanged after calling `batch_get` or `snapshot_layout` with a `filePath` — these read tools can silently switch the active editor away
4. If the active editor has changed unexpectedly, call `open_document(path)` again and re-verify before any `batch_design` calls

## File Map (the authority)

| Pencil file | CSS/TS source | Content |
|-------------|---------------|---------|
| `apps/web/src/design/tokens.pen` | `apps/web/src/design/theme.css` | CSS vars: colors, space scale, type scale, weights, radius, shadows, motion, z-index |
| `apps/web/src/design/layout.pen` | `apps/web/src/styles/layout.css` | Layout specs: grid columns, shell padding, game-layout grid, breakpoints |
| `apps/web/src/design/components.pen` | `apps/web/src/styles/system.css` + `game.css` | Component specs: Button, Badge, Panel, FormField, SectionHeader, choice-chip-button, ticket-card, supply-dock, surface-card/detail-card, HUD controls |

## Push: Code → Pencil (`/pencil-push`)

### Step 1 — Open document
```
mcp__pencil__open_document({ path: "/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/tokens.pen" })
mcp__pencil__get_editor_state({ include_schema: false })
```

### Step 2 — Read CSS source
Parse `theme.css` with `Read` tool. Extract all `--var-name: value` pairs from `:root {}`.

Group by category:
- **color** vars: `--color-*`, `--map-*`, `--material-*`, `--shadow*`, `--surface-*`
- **space** vars: `--space-*`, `--layout-*`, `--space-page-*`
- **type** vars: `--type-*`, `--weight-*`, `--lh-*`, `--ls-*`, `--font-*`
- **motion** vars: `--duration-*`, `--easing-*`
- **radius** vars: `--radius-*`
- **control** vars: `--control-*`

### Step 3 — Push color/space/type tokens to tokens.pen
Use `set_variables` for any CSS var that maps to a Pencil variable:
```
mcp__pencil__set_variables({ filePath: "...", variables: { "color-canvas-base": { type: "color", value: "#e4d7bf" }, ... } })
```

For values without a Pencil variable (complex shadows, clamped values), update annotation text nodes in the Pencil canvas via `batch_design`.

### Step 4 — Push layout specs to layout.pen
Open `layout.pen` with `open_document`, verify active editor. Read `layout.css`. For each layout class, update the corresponding Pencil frame's width/gap/padding annotations via `batch_design`.

### Step 5 — Push component specs to components.pen
Open `components.pen` with `open_document`, verify active editor. Read `system.css` + `game.css`. Update component frames with current padding, gap, border-radius, and min-height values.

## Pull: Pencil → Code (`/pencil-pull`)

### Step 1 — Read Pencil variables
```
mcp__pencil__get_variables({ filePath: ".../tokens.pen" })
```
Returns all typed variables (color, number, string).

### Step 2 — Diff against CSS
Compare Pencil variable values to CSS vars in `theme.css`. Identify changed values.

### Step 3 — Write back to CSS
Use `Edit` tool to update only changed lines in `theme.css`. Preserve comments and formatting.

### Step 4 — Layout pull
```
mcp__pencil__snapshot_layout({ filePath: ".../layout.pen", maxDepth: 3 })
```
Map frame names to CSS classes. Update gap/padding values in `layout.css`.

### Step 5 — Component pull
```
mcp__pencil__batch_get({ filePath: ".../components.pen", readDepth: 2 })
```
Extract padding, border-radius, font-size from component frames. Update `system.css`.

## Creating / Seeding a New .pen File

When `layout.pen` or `components.pen` doesn't exist yet:

1. **User must create the blank file in VS Code** (Cmd+N → save to target path) — MCP cannot create new .pen files from scratch
2. Call `open_document(absolutePath)` to open and set the new file as active
3. Verify with `get_editor_state` that the target file is now active
4. Seed with content from the CSS source using `batch_design` — layout rules → annotated frames, component styles → spec cards

Frame naming convention: match the CSS class name exactly (`.game-layout` → frame named `game-layout`).

## Pencil Connection

The `pencil` MCP connects via the Pencil desktop app:
- Binary: `/Applications/Pencil.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-arm64`
- Args: `--app desktop`
- **Requires:** Pencil desktop app open (not just the VS Code extension)

If tools return "transport not connected": open the Pencil desktop app, then do `Cmd+Shift+P → Reload Window` in VS Code to reinitialize the MCP connection.

## Key Tools

| Goal | Tool |
|------|------|
| List frames in a .pen file | `batch_get` (no patterns, no nodeIds = top-level list) |
| Read Pencil variables | `get_variables` |
| Write Pencil variables | `set_variables` |
| Read frame layout/sizes | `snapshot_layout` |
| Create/update frames | `batch_design` |
| Verify visually | `get_screenshot` |

## CSS Var Parsing Pattern

```bash
# Extract all CSS custom properties from theme.css
grep -oP '--[a-z][a-z0-9-]+:\s*[^;]+' apps/web/src/design/theme.css
```

Use `Read` + regex mentally or via Bash to extract the var name and value pairs before calling `set_variables`.
