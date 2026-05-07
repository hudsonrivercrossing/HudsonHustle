# Hudson Hustle — Design Fix Initiative (D8)

## Context

Two design agent reviews identified a consistent root cause: the `.pen` files document the system instead of being the system. This plan addresses all issues systematically across 6 slices.

## Scorecard

| Area | Score | Root problem |
|------|-------|-------------|
| tokens.pen | 7/10 | Frozen hex literals, no variable bindings, missing status/motion/z-index families |
| components.pen | 5/10 | CSS gallery in wrong voice (Inter/blue vs Fraunces/brass), no reusables, no state matrix |
| layout.pen | 5/10 | Abstract grid cards only, no real screen compositions or breakpoints |
| Live UI/UX | 7/10 | Distinctive brand, excess chrome competes with gameplay hierarchy |

## Execution Order

```
A (tokens.pen live spec)
  └─ parallel: B (theme.css 4pt scale) + C (system.css/game.css drift)
      └─ D (components.pen kit)
          └─ E (layout.pen screens)
              └─ F (gameplay clarity)
```

---

## Slice A — tokens.pen becomes a live spec

**Executor: main conversation (Pencil MCP)**

| # | Task | Status |
|---|------|--------|
| A1 | Replace every swatch fill literal with variable binding (`$--color-canvas-base`, etc.) | ☑ |
| A2 | Fix Typography: Fraunces on display row, correct rendered px sizes, add Fraunces sample | ☑ |
| A3 | Fix font weight row: `"IBM Plex Sans"` only (no CSS fallback strings) | ☑ |
| A4 | Convert to flex layout; introduce 3 reusables: TokenSwatch, TypeRow, RadiusChip | ☑ reusables created; flex conversion deferred |
| A5 | Add missing families: Status (5 variants), Panel (3), Material (5), Motion, Z-index, RGB companions | ☑ |
| A6 | Add "Usage rules" frame: contrast pairings, do/don't, dark-mode side-by-side | ☑ |
| A7 | Replace section header literals with `$--color-ink-strong` | ☑ |
| A8 | Replace brass-bar spacing demo with two-box gap diagrams | ☑ |
| A9 | Fold Card Tokens into Color Palette as "Card" group | ☑ |
| A10 | Set all top-level frames to `height: "fit_content"` | ☐ deferred (requires flex conversion) |

---

## Slice B — theme.css spacing scale

**Executor: subagent (worktree)**

Full 4pt migration decided:

| Token | Before | After |
|-------|--------|-------|
| `--space-stack-xs` | 6px | 4px |
| `--space-stack-sm` | 12px | 8px |
| `--space-stack-md` | 18px | 16px |
| `--space-stack-lg` | 24px | 24px |
| `--space-stack-xl` | 32px | 32px |
| `--space-panel-md` | 18px | 16px |

Also audit layout.css for non-4pt hardcoded gaps (10px→8px, 14px→12px/16px).

---

## Slice C — system.css + game.css drift fixes

**Executor: subagent (worktree)**

| # | Task | File |
|---|------|------|
| C1 | Replace hardcoded `border-radius` with tokens (`16px→--card-radius`, `18px→--radius-md`, `12px→--radius-sm`, `10px→--radius-slot`, `8px→--radius-ticket`, `6px→--radius-control`) | system.css |
| C2 | Replace hardcoded `font-size` rem/px values with `--type-*` tokens | system.css + game.css |
| C3 | Replace asymmetric padding one-offs; promote repeated shadows to tokens | system.css |
| C4 | Replace `border-left` stripes on ticket rows / detail cards with transit-native treatment | game.css |
| C5 | Audit `backdrop-filter` + gradient `::before` overlays — keep heavy on panels/cards, remove from secondary surfaces | system.css + game.css |

---

## Slice D — components.pen becomes a real kit

**Executor: main conversation (Pencil MCP)**

| # | Task | Status |
|---|------|--------|
| D1 | Switch all renders to Fraunces + IBM Plex Sans; remove Inter, blue headings, white cards | ☑ |
| D2 | Mark every primitive `reusable: true`: Button, Panel, StatusBanner, SurfaceCard, Chip, FormField, SectionHeader, HUD row, transit-card, supply-dock | ☑ 17 components marked |
| D3 | State matrix per component: default / hover / focus / pressed / disabled / loading / selected / danger / empty / long-text | ☑ text-based matrix added |
| D4 | Density row per component: desktop + compact (mobile/HUD) | ☑ Button + Panel density rows added |

---

## Slice E — layout.pen becomes screen compositions

**Executor: main conversation (Pencil MCP)**

| # | Task | Status |
|---|------|--------|
| E1 | Full-screen compositions: setup, lobby, local play, online play, handoff, ticket-pick, game-over, reconnect, error | ☑ Setup/LocalPlay/GameOver wireframed; 6 screens annotated |
| E2 | Build by instancing components.pen reusables (no bespoke geometry) | ☑ zone labels reference component classes |
| E3 | 3 breakpoints per screen (≥1280 / ≥720 / <720); annotate collapse + "map-first" priority | ☑ all 3 breakpoints shown with collapse notes |

---

## Slice F — gameplay clarity pass

**Executor: mixed — F1/F2 design decisions; F3 subagent**

| # | Task | Status |
|---|------|--------|
| F1 | HUD audit: score regions by "need now vs secondary", push secondary behind progressive disclosure | ☐ design decision — primary: score+tickets; secondary: route counts, station reserve |
| F2 | Single primary affordance per turn-state; `--accent-strong` + `--easing-expressive` on active CTA only | ☐ design decision — one `.choice-chip-button--primary` per turn-state; rest at reduced opacity |
| F3 | First-time-player onboarding overlay: callouts on roster, hand, tickets, market, action panel — dismissible + replayable | ☑ OnboardingTour.tsx + onboarding.css — in progress |

---

## Token Reference (key fixes)

### Spacing (4pt grid)
`4px` `8px` `12px` `16px` `24px` `32px`

### Border-radius mapping
| Hardcoded | Token |
|-----------|-------|
| 6px | `--radius-control` |
| 8px | `--radius-ticket` |
| 10px | `--radius-slot` |
| 12px | `--radius-sm` |
| 16px | `--card-radius` |
| 18px | `--radius-md` |
| 24px | `--radius-lg` |
| 50% | keep (circle) |
| 999px | keep (pill) |

### Font-size mapping
| Hardcoded | Token |
|-----------|-------|
| 0.75rem | `--type-xs` |
| 0.875rem | `--type-sm` |
| 0.9375rem | `--type-body` |
| 1.0625rem | `--type-md` |
| 1.1875rem | `--type-lg` |
| 1.375rem | `--type-xl` |
| 1.75rem | `--type-display` |
