# styles/ — Structure Guide

## File map

| File | What it styles | Component folder |
|---|---|---|
| `theme.css` | CSS custom properties — single source of truth for all design tokens | — (tokens only) |
| `ui.css` | Game-agnostic UI primitives | `components/ui/primitives/` |
| `game.css` | Game-domain primitives + live game board (HUD) | `components/ui/game/` + `components/screens/gameplay/` |
| `layout.css` | Structural grid rules: app shell, game layout, board column | `components/screens/` |
| `setup.css` | Setup and lobby flow styles | `components/setup/` + `components/screens/` setup flows |
| `onboarding.css` | Onboarding overlay | `components/shared/OnboardingTour` |

## Import order (styles.css)

```css
@import './styles/theme.css';   /* tokens first — everything else inherits */
@import './styles/ui.css';
@import './styles/game.css';
@import './styles/layout.css';
@import './styles/setup.css';
@import './styles/onboarding.css';
```

## Rules

- All design values live in `theme.css` as CSS custom properties. Never hardcode a color, spacing, font-size, or radius value in any other file.
- `ui.css` and `game.css` together are the design system. `ui.css` = game-agnostic. `game.css` = Hudson Hustle domain.
- `game.css` covers both `ui/game/` primitives and `screens/gameplay/` HUD assembly. If it grows unwieldy, the natural split is `game-primitives.css` + `game-hud.css`.

## Pencil cross-reference

Open `design/hudsonhustle.pen`:
- Column 1: Tokens (maps to `theme.css`)
- Column 2: Components (maps to `ui.css` + `game.css`)
- Column 3: Layout (maps to `layout.css` + `setup.css`)
