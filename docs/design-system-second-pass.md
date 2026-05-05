# Hudson Hustle — Design System Second Pass
**Branch:** `feat/design-system-audit` | **Date:** 2026-05-05

**Goal:** Harden the design system so changes are controllable, components are predictable, and Pencil is the primary design source of truth — with MCP integration keeping design and code in sync automatically.

---

## Tool stack & roles

| Tool | Role | Why |
|------|------|-----|
| **Pencil** | Design source of truth — tokens, component specs, screen designs | MCP integration means I (Claude Code) can read/write designs directly. Variables sync to `theme.css` via `get_variables` / `set_variables`. No manual copy-paste between design and code. |
| **Storybook** | Interactive component validation — states, props, edge cases | Renders actual React components. Catches regressions. Documents component API for developers. Pencil shows what it *should* look like; Storybook proves the code *actually* does it. |
| **Code** | Implementation layer | Implements what Pencil specifies. Tokens come from `theme.css` which stays in sync with Pencil variables. |

**Tool key used in todos below:**
- `[Pencil]` — Do in Pencil first (I can drive this via MCP when Pencil is open in VS Code)
- `[Pencil → Code]` — Design in Pencil, MCP syncs variables to `theme.css`, implement components
- `[Storybook]` — Interactive states / regression guard / developer API docs
- `[Code]` — Pure code change, no design tool needed

---

## Workflow

```
Pencil (design + token variables)
  ↕  MCP: get_variables / set_variables  (I drive this — no manual handoff)
theme.css (CSS custom properties)
  ↓
React components (implementation)
  ↓
Storybook (validate: does running code match Pencil design?)
```

**Rule: never implement without a Pencil spec. Never spec without tokens locked.**
Sequence: token decisions in Pencil → sync to theme.css → implement → Storybook story validates.

**Storybook's narrowed scope with Pencil in the stack:**
- ✅ Keep: interactive states (hover, focus, disabled, loading) — Pencil is static
- ✅ Keep: visual regression guard in CI (screenshot testing)
- ✅ Keep: developer prop/API reference
- ❌ Drop: design documentation — Pencil owns this now
- ❌ Drop: token reference page — Pencil variables ARE the reference

---

## P0 — Blocking: Fix before anything else

These block the design system from being trustworthy. Do before opening Pencil for component work.

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 1 | [x] | **Standardize `variant` vs `tone` vocabulary** — Rule: `variant` = visual structure (layout/shape), `tone` = semantic color (status/meaning). Update Button, Panel, SurfaceCard, StateSurface, StatusBanner, Badge, SectionHeader consistently. SectionHeader's `density` → `variant`. | `[Code]` | Pure rename. Most impactful single change — every future Pencil component design and code component follows this contract. Do this before Pencil component specs are created. |
| 2 | [x] | **Unify status color vocabulary** — `StatusBanner` uses `failure`, `Badge` uses `danger`, `Panel` uses `alert`. Pick one set. Proposed: `neutral · info · success · warning · danger`. | `[Pencil → Code]` | Design the unified status palette as Pencil variables (5 swatches in context). Sync to theme.css. Then rename in code. Pencil becomes the reference for status color decisions. |
| 3 | [x] | **Move gameplay overrides out of `system.css`** — 80+ `.app-shell--gameplay-hud` rules in system.css. Move all to game.css. system.css should contain zero game-context selectors. | `[Code]` | Grep for `.app-shell--gameplay-hud` in system.css, relocate to game.css. Makes system.css a clean layer Pencil components map to without game noise. |

---

## P1 — High Impact: Do after P0

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 4 | [x] | **Build token palette in Pencil** — Full visual token map: color palette, type scale (Fraunces + IBM Plex Sans), spacing scale, radius, shadow levels. Set as Pencil variables. Sync to theme.css via MCP. | `[Pencil → Code]` | This is the foundation everything else builds on. I can drive `set_variables` to push existing theme.css values into Pencil, then you refine from there. Output: Pencil file IS the token reference. |
| 5 | [x] | **Add motion tokens** — Add `--duration-fast: 120ms`, `--duration-base: 160ms`, `--duration-slow: 240ms`, `--easing-standard: ease`, `--easing-expressive: cubic-bezier(0.34, 1.56, 0.64, 1)` to theme.css. Replace all hardcoded `140ms`, `160ms`, `ease` in system.css, game.css, setup.css. | `[Pencil → Code]` | Define motion scale as Pencil variables alongside color/spacing. Then implement in theme.css and do a global find-replace of magic transition values. Needed before dark mode or animation work. |
| 6 | [x] | **Design core component specs in Pencil** — Button (all variants+states), Panel (all variants), SurfaceCard, FormField, Badge, SectionHeader. Each component as a Pencil frame using token variables. | `[Pencil]` | Do after token palette (#4) is locked. Component designs reference Pencil variables, not raw values. These frames become the spec Storybook stories are measured against. I can generate these via `batch_design`. |
| 7 | [x] | **Add Button variants: ghost + link** — The UI needs a text-style button (SetupGateway guide link, in-game secondary actions). Currently raw `<button>` elements or className hacks. | `[Pencil → Code]` | Design ghost and link in Pencil alongside primary/secondary. Implement in Button.tsx. Add Storybook stories. |
| 8 | [x] | **Tokenize hardcoded sizing in game.css** — `min-height: 38px`, `min-width: 112px`, `padding: 8px 14px 12px` are magic numbers. Add `--input-height-compact`, `--button-min-width-sm` as Pencil variables → theme.css. | `[Pencil → Code]` | Add sizing tokens to Pencil variable set. Sync to theme.css. Replace hardcoded values in game.css. |

---

## P2 — Medium Impact: After P1

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 9 | [x] | **Complete ModalShell Storybook coverage** — 2 of 8 width × align × tone combinations shown. Add md+center, md+left, lg+center, lg+left, tutorial tone. | `[Storybook]` | No code changes — just stories. Pencil frame for each combination provides the visual spec to validate against. |
| 10 | [x] | **Complete SurfaceCard Storybook coverage** — 2 of 4 variants shown. Add title-only, eyebrow+title+meta, winner variant (`endgame-card--winner`). | `[Storybook]` | `endgame-card--winner` from last PR has no story. Pencil should have a design frame for the winner state before adding the story. |
| 11 | [x] | **Complete StateSurface Storybook coverage** — 3 of 5 tones shown. Add `active` and `warning`. Add with/without `rightSlot` and `copy`. | `[Storybook]` | After vocabulary is unified in P0, tone names may change — update stories to match. |
| 12 | [x] | **Add Button Storybook: loading + icon states** | `[Storybook]` | Requires Button.tsx to support `loading` prop first. Design the loading state in Pencil before implementing. |
| 13 | [x] | **Extract `SeatPlan` as a system component** — `<div className="seat-plan">` duplicated in SetupScreen and MultiplayerSetupScreen. Extract to shared component. | `[Pencil → Code]` | Design the seat plan component frame in Pencil first (it has meaningful visual structure). Then implement and unify both setup screens. |
| 14 | [x] | **Remove deprecated components** — `UtilityPill` and `Chip` marked `@deprecated`. Remove TSX, stories, CSS, exports. Replace usages: `Chip` → `Badge`, `UtilityPill` case-by-case. | `[Code]` | Grep for usages first. Pure cleanup — no design tool needed. |
| 15 | [x] | **Add border-width tokens** — `--border-thin: 1px`, `--border-medium: 2px` missing. `border: 1px solid` hardcoded everywhere. | `[Pencil → Code]` | Add to Pencil variables, sync to theme.css, replace hardcoded values. |

---

## P3 — Polish: When system is stable

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 16 | [ ] | **Design dark/dim mode token layer in Pencil** — Dark theme as a Pencil variable set override. Lower canvas brightness, reduce light emission. Not a brand change — a comfort layer. | `[Pencil → Code]` | Pencil supports multiple themes/variable sets. Design the dark overrides in Pencil, sync to a `@media (prefers-color-scheme: dark)` block in theme.css via MCP. Do not start until P0+P1 light mode tokens are locked. |
| 17 | [ ] | **Tablet viewport layout (768–1024px)** — Game layout breaks between 720px and 1024px. Design the intermediate board + inspector layout in Pencil at 900px width. | `[Pencil → Code]` | Design first in Pencil (I can generate a 900px frame via `batch_design`). Then add a breakpoint in game.css matching the design. |
| 18 | [x] | **Audit and remove dead CSS** — `.artifact-card`, `.detail-card`, `.ticket-card`, `.market-card` in system.css have no React components. Verify and remove. | `[Code]` | Grep each class in TSX. If unused, delete CSS block. Reduces system.css from ~4,600 lines. |
| 19 | [x] | **FormField: validation + error states** — No story for error helper, disabled input, checkbox/radio child. | `[Pencil → Storybook]` | Design error state in Pencil. May need `error` prop added to FormField.tsx. Then add Storybook stories. |

---

## What NOT to do on this pass

Deferred to a later branch (`/hudson-hustle-design-lead`):

- Extract `App.tsx` socket + session logic into hooks
- Break `GameplayHud.tsx` into `BoardStage` / `PlayerHandPanel` / `InspectorPanel`
- Merge `SetupScreen` + `MultiplayerSetupScreen` step components
- Extract route geometry math to pure functions in `game-data`
- Notification queue management
- Setup state persisted to `sessionStorage`
- Zod validation for setup forms

---

*Source: design system audit on `feat/design-system-audit` branch, 2026-05-05*
