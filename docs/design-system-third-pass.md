# Hudson Hustle — Design System Third Pass
**Date:** 2026-05-05

**Goal:** Elevate the active game shell from generic app panels to physical game objects (table instruments, transit artifacts). Then harden color and typography token adoption across the codebase.

---

## Workflow (same as second pass)

```
Pencil (design + token variables)
  ↕  MCP: get_variables / set_variables
theme.css (CSS custom properties)
  ↓
React components + CSS objects
  ↓
Storybook (validate: does running code match Pencil design?)
```

**Rule: never implement without a Pencil spec. Never spec without tokens locked.**

---

## Items

### D1 — Active Game Shell: Scoreboard & Hand Rail
**Branch:** `feat/design-d1-scoreboard-hand`  
**Files:** `game.css`, `PlayerRosterPanel`, `PlayerHandPanel`  
**Tool:** `[Pencil → Code]`

| [ ] | What |
|-----|------|
| [ ] | Scoreboard row typography — player name + stats feel like a game card printout (denser, stronger number weight for trains/tickets/stations) |
| [ ] | Hand rail card slots — increase visual contrast between 0-count and filled cards; add subtle slot texture |
| [ ] | Timer label — feels like a physical countdown display, not a UI label |
| [ ] | No new components. CSS object changes only. |

---

### D2 — Active Game Shell: Supply Dock & Inspector
**Branch:** `feat/design-d2-supply-inspector`  
**Files:** `game.css`, `SupplyDock`, `InspectorDock`  
**Tool:** `[Pencil → Code]`

| [ ] | What |
|-----|------|
| [ ] | Market card slots — stronger draw pile indicator; deck count label feels like a physical deck label |
| [ ] | Inspector dock tab rail — active tab state more physical/tactile |
| [ ] | Build panel — `detail-card` inside inspector reads as a route artifact, not a generic card |
| [ ] | Chat panel — spacing + input polish only |

---

### D3 — Ticket-Desk Overlay Pass
**Branch:** `feat/design-d3-ticket-desk`  
**Files:** `game.css` (ticket sections), `TicketChoiceSheet`, `TicketDock`  
**Tool:** `[Pencil → Code]`

| [ ] | What |
|-----|------|
| [ ] | Ticket rows — city pair + points layout feels like a printed transit ticket |
| [ ] | Ticket choice sheet — `::before`/`::after` decorative borders refined to feel like a physical deal/envelope |
| [ ] | Ticket status colors (open / connected / keep / review) — audit against semantic tokens, replace hardcoded values |
| [ ] | TicketDock pager ghost buttons — need a visual treatment once ghost variant is styled |

---

### D4 — Semantic Color Audit: `game.css`
**Branch:** `feat/design-d4-color-audit-game`  
**Files:** `game.css` only  
**Tool:** `[Code]`

| [ ] | What |
|-----|------|
| [ ] | `rgba(246, 235, 214, ...)` → `var(--color-ink-primary)` / `var(--color-ink-secondary)` with opacity |
| [ ] | `rgba(222, 199, 158, ...)` borders → `var(--color-border-warm)` or equivalent token |
| [ ] | `#b7e0bc` success green → `var(--color-status-success)` or appropriate semantic token |
| [ ] | Gradient backgrounds — map to canvas tokens where stable |
| [ ] | Do NOT touch `system.css` in this pass |

---

### D5 — Semantic Color Audit: `system.css`
**Branch:** `feat/design-d5-color-audit-system`  
**Files:** `system.css` only (~454 hardcoded values)  
**Tool:** `[Code]`

| [ ] | What |
|-----|------|
| [ ] | Component-level colors first (button, badge, panel borders) — highest reuse, highest token ROI |
| [ ] | Status/state colors (success, warning, danger surfaces) — map to semantic token set |
| [ ] | One-off decorative values — audit last; only tokenize if stable reuse is clear |

---

### D6 — Type Role Enforcement
**Branch:** `feat/design-d6-type-roles`  
**Files:** `system.css`, `game.css`  
**Tool:** `[Code]`

| [ ] | What |
|-----|------|
| [ ] | Audit all 16 `var(--font-display)` usages — confirm each is a ceremony / signage / reveal moment |
| [ ] | Suspect candidates: `.status-banner__headline`, `.state-surface__headline` — check if body font is correct there |
| [ ] | Verify zero `--font-display` on chips, controls, dense facts, timers, compact labels |
| [ ] | Add a short inline comment above each legitimate display use so intent is explicit |

---

### D7 — Motion Token Adoption
**Branch:** `feat/design-d7-motion-tokens`  
**Files:** `system.css`  
**Tool:** `[Code]`

| [ ] | What |
|-----|------|
| [ ] | Tokens exist in `theme.css`: `--duration-fast/base/slow`, `--easing-standard/expressive` |
| [ ] | Replace remaining hardcoded `ms` values in `system.css` transitions with tokens |
| [ ] | `game.css` is already clean — skip |

---

## Suggested order

```
D1 → D2 → D3   (game shell visual lift — highest player-facing impact)
D4 → D5         (color audit — game.css first, system.css second)
D6 → D7         (type + motion hardening)
```

## Not in this pass

- Map-adjacent framing refinements
- Board label rhythm work
- Map visual polish
- v2.2 design evolution
- Zod form validation
- Setup state persistence

---

*Source: design planning session 2026-05-05, following second-pass completion*
