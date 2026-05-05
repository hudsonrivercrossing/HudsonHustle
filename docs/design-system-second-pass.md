# Hudson Hustle — Design System Second Pass
**Branch:** `feat/design-system-audit` | **Date:** 2026-05-05

**Goal:** Harden the design system so changes are controllable, components are predictable, and claude.ai/design can be used as the primary design source of truth.

**Tool key:**
- `[claude.ai/design]` — Do this in claude.ai/design first, bring output back to code
- `[Storybook]` — Document/validate in Storybook
- `[Code]` — Pure code change, no design tool needed
- `[claude.ai/design → Code]` — Design in claude.ai/design, implement in code

---

## P0 — Blocking: Fix before anything else

These block the design system from being trustworthy. Do them before adding new components or going to claude.ai/design.

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 1 | [ ] | **Standardize `variant` vs `tone` vocabulary** — Pick one prop name per purpose across all components. Rule: `variant` = visual structure (layout/shape), `tone` = semantic color (status/meaning). Update Button, Panel, SurfaceCard, StateSurface, StatusBanner, Badge, SectionHeader to follow the rule consistently. | `[Code]` | This is a pure rename. Most impactful single change — every future component will follow this contract. StatusBanner uses `tone` correctly; SectionHeader's `density` should become `variant`. |
| 2 | [ ] | **Unify status color vocabulary** — `StatusBanner` uses `failure`, `Badge` uses `danger`, `Panel` uses `alert`. Pick one word per semantic state and apply everywhere. Proposed: `neutral · info · success · warning · danger`. | `[claude.ai/design]` | Design the unified status palette visually first. One swatch per tone, show in context. Then rename in code to match. |
| 3 | [ ] | **Move gameplay overrides out of `system.css`** — 80+ `.app-shell--gameplay-hud` rules live in system.css. Move them to game.css. system.css should contain zero game-context selectors. | `[Code]` | Grep for `.app-shell--gameplay-hud` in system.css and relocate. system.css becomes a clean, trustworthy layer. |

---

## P1 — High Impact: Do after P0

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 4 | [ ] | **Add motion tokens to theme.css** — Add `--duration-fast: 120ms`, `--duration-base: 160ms`, `--duration-slow: 240ms`, `--easing-standard: ease`, `--easing-expressive: cubic-bezier(0.34, 1.56, 0.64, 1)`. Replace all hardcoded `140ms`, `160ms`, `ease` in system.css, game.css, setup.css. | `[claude.ai/design → Code]` | Design the motion scale in claude.ai/design (fast/base/slow feel). Implement tokens in theme.css. Then do a global find-replace of magic transition values. |
| 5 | [ ] | **Complete ModalShell Storybook coverage** — Currently 2 stories. Need all width × align combinations: md+center, md+left, lg+center, lg+left. Add tone=tutorial variant. | `[Storybook]` | No code changes needed — just stories. claude.ai/design can generate the story variations layout spec if helpful. |
| 6 | [ ] | **Complete SurfaceCard Storybook coverage** — Currently 2 stories (detail, summary). Add: title-only, eyebrow+title+meta, with/without children, winner variant (endgame-card--winner). | `[Storybook]` | The `endgame-card--winner` modifier from the last PR has no story. Add it here. |
| 7 | [ ] | **Complete StateSurface Storybook coverage** — 3 of 5 tones shown. Add `active` and `warning` stories. Add with/without `rightSlot` and `copy` combinations. | `[Storybook]` | |
| 8 | [ ] | **Add Button variants: ghost + link** — The UI needs a text-style button (e.g. SetupGateway guide link, in-game secondary actions). Currently these are either raw `<button>` elements or styled with className hacks. | `[claude.ai/design → Code]` | Design ghost and link variants in claude.ai/design against the existing primary/secondary. Then implement in Button.tsx and add stories. |
| 9 | [ ] | **Tokenize hardcoded sizing in game.css** — `min-height: 38px`, `min-width: 112px`, `padding: 8px 14px 12px` are magic numbers. Add `--input-height-compact`, `--button-min-width-sm` tokens. | `[Code]` | Audit game.css for non-standard padding values (8px, 9px, 13px, 14px). Map to nearest spacing token or create explicit compact-context tokens. |

---

## P2 — Medium Impact: After P1

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 10 | [ ] | **Build token palette in claude.ai/design** — Create the full visual token map: color palette, type scale (Fraunces + IBM Plex Sans sizes), spacing scale, radius, shadow levels, motion scale. This becomes the source of truth reference doc. | `[claude.ai/design]` | Start here for the "structural design system" the user wants. Output: a shareable design file that maps 1:1 to theme.css tokens. Use for all future design decisions. |
| 11 | [ ] | **Design core component specs in claude.ai/design** — Button (all variants+states), Panel (all variants), SurfaceCard, FormField, Badge, SectionHeader. | `[claude.ai/design]` | Do this after token palette is locked (#10). Component designs reference tokens, not raw values. Output becomes the spec Storybook stories are measured against. |
| 12 | [ ] | **Extract `SeatPlan` as a system component** — `<div className="seat-plan">` pattern duplicated in SetupScreen and MultiplayerSetupScreen. Extract to a shared component accepting seats array + bot toggle callback. | `[Code]` | Medium refactor. Unifies the seat configuration UI across local and multiplayer setup. |
| 13 | [ ] | **Add Button Storybook: loading + icon states** — No story for a loading/spinner state or a button with an icon. Add both. | `[Storybook]` | Requires Button.tsx to support an `icon` slot or `loading` prop first if not already there. |
| 14 | [ ] | **Remove deprecated components** — `UtilityPill` and `Chip` are marked `@deprecated`. Remove their story files, TSX files, CSS rules, and exports. Replace any remaining usages. | `[Code]` | Grep for usages first. `Chip` is an alias for `Badge` — replace all with `Badge`. `UtilityPill` usages need case-by-case review. |
| 15 | [ ] | **Add border-width tokens** — No `--border-thin`, `--border-medium` tokens. `border: 1px solid` and `border: 0` hardcoded throughout. | `[Code]` | Small addition to theme.css. Then replace hardcoded border widths in system.css. |

---

## P3 — Polish: When the system is stable

| # | [ ] | What | Tool | Notes |
|---|-----|------|------|-------|
| 16 | [ ] | **Add a token reference page to Storybook** — A page that visually shows all color tokens (swatches), type scale, spacing scale, radius values, and shadow levels. Not a component — a design system documentation page. | `[Storybook]` | Use Storybook MDX format. This is the internal "design system doc" that replaces needing Figma for token reference. |
| 17 | [ ] | **Design dark/dim mode token layer in claude.ai/design** — Define a `@media (prefers-color-scheme: dark)` overrides block for theme.css. Lower canvas brightness, reduce light emission. Not a brand change — a comfort layer. | `[claude.ai/design → Code]` | Do not implement until the light mode token layer is fully locked (P0+P1 complete). Design first, then add overrides to theme.css as a new block. |
| 18 | [ ] | **Tablet viewport design (768–1024px)** — The game layout breaks between 720px and 1024px. Design the intermediate layout in claude.ai/design first, then add a breakpoint. | `[claude.ai/design → Code]` | claude.ai/design is the right tool — design what the board + inspector layout looks like at 900px before writing a single media query. |
| 19 | [ ] | **Audit and remove dead CSS rules** — `.artifact-card`, `.detail-card`, `.ticket-card`, `.market-card` class selectors exist in system.css with no corresponding React components. Verify and remove. | `[Code]` | Grep for each class in TSX files. If unused, delete the CSS block. Reduces system.css from ~4,600 lines. |
| 20 | [ ] | **FormField Storybook: validation + error states** — No story for an input with an error helper, disabled input, or checkbox/radio child. Add these. | `[Storybook]` | May require FormField.tsx to support an `error` prop variant. |

---

## Tool usage philosophy

```
claude.ai/design  →  design decisions (what it looks like, what the spec is)
Storybook         →  component documentation and validation (does the code match the spec?)
Code              →  implementation (make the code match the design)
```

**Never implement without a spec. Never spec without tokens.**
The sequence is always: token decisions → component design → code → Storybook story.

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
