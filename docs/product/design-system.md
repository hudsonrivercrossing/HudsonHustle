# Hudson Hustle Design System

## Visual Direction
- Transit nostalgia hybrid.
- Warm materials, map-room atmosphere, and tactile board-game contrast.
- Clear transit cues without copying official MTA or Ticket to Ride branding.
- Geography should read at a glance: New Jersey west, Manhattan vertical, Brooklyn south, Queens east.

## Foundations
- Tokens live as CSS variables.
- Tokens cover color, spacing, radius, shadow, border, motion, and typography hooks.
- Public board colors and private-player colors are separate token groups.
- Base surfaces should feel like printed paper, lacquered cards, and brass transit hardware rather than flat app panels.

## Component Layers
- `Base`: buttons, chips, cards, panels, modals, badges, headings.
- `Game`: route cards, market cards, player rails, score tiles, transition screens, ticket panels.
- `Board`: route strokes, ferry/tunnel markers, hub nodes, labels, claim overlays.

## Card Anatomy
- Train cards and market cards share the same anatomy: kicker, face label, tone band, and subtle patterning.
- Destination tickets should read as printed chits with a route title and a points medallion.
- Visual hierarchy should separate public market cards from private hand cards through context, not by inventing new rules.

## Vintage Rail Ticket Card Tokens
- Transit cards should use a `Vintage Rail Ticket` treatment:
  - warm paper stock
  - dark ink typography
  - muted route-color field
  - subtle watermark or punch-stamp pattern
- Keep `name` and rules semantics separate from card styling; the same token table should work for market cards, hand cards, and preview chips.

### Shared Card Tokens
- Base frame:
  - `--card-radius: 16px`
  - `--card-border: #5a4636`
  - `--card-ink: #3e3128`
  - `--card-paper: #f3ead8`
  - `--card-paper-shadow: #e2d3b9`
  - `--card-brass: #b08a43`
  - `--card-rule: rgba(90, 70, 54, 0.28)`
  - `--card-highlight: rgba(255, 255, 255, 0.35)`
  - `--card-shadow: 0 10px 24px rgba(74, 53, 33, 0.18)`
- Layout assumptions:
  - modest rounded corners
  - outer dark-ink border
  - inset inner frame
  - paper top band
  - colored center field
  - paper bottom band

### Route Card Color Table
Each route-card color should define:
- `--route-color`
- `--route-color-dark`
- `--route-color-light`
- optional `--route-watermark`

Recommended starting tokens:

| Color | `--route-color` | `--route-color-dark` | `--route-color-light` | Watermark Mood |
| --- | --- | --- | --- | --- |
| `crimson` | `#bb5b68` | `#8e3f4d` | `#d78796` | ink stamp / signal seal |
| `amber` | `#d0a13e` | `#9d7424` | `#e3bf72` | brass ticket punch |
| `emerald` | `#368d7f` | `#25665b` | `#67afa3` | harbor grid / terminal tile |
| `cobalt` | `#4d68c8` | `#344792` | `#7b91de` | river crossing diagram |
| `violet` | `#7f63b8` | `#5d4790` | `#a089d2` | express-service medallion |
| `obsidian` | `#4d5664` | `#333b47` | `#788291` | timetable hatch / rail rule |
| `ivory` | `#e9dcc0` | `#cdbd9d` | `#f6eedf` | faded cancellation stamp |
| `rose` | `#ce7ea0` | `#a65c7d` | `#e1a3bc` | destination stamp / floral rosette |

### Wildcard / Locomotive Card Tokens
- Wildcard should not read as a ninth route color.
- Use a premium ticket-pass treatment:
  - `--route-color: #efe7d6`
  - `--route-color-dark: #d9ccb2`
  - `--route-color-light: #faf6ec`
  - `--accent-metal: #b08a43`
  - `--accent-smoke: #5b5752`
- The wildcard face should emphasize:
  - central brass medallion or seal
  - stronger watermark than normal route cards
  - `WILDCARD` kicker
  - `Locomotive` main title
- Do not use rainbow treatment for wildcard.

### Typography Guidance For Cards
- Kicker:
  - use the shared `--font-body` family
  - high tracking
- Main title:
  - use the shared `--font-display` family
  - heavier than the rest of the card
- Bottom utility line:
  - use the shared `--font-body` family
- Cards should feel consistent with the rest of the product typography system, not like a separate imported print font stack.
- Aim for old ticket-office / timetable energy through spacing, framing, and texture, not by switching to an unrelated font family.

### Rendering Guidance
- The center color field should be slightly graded, not flat.
- Watermarks should stay in the `6-12%` opacity range.
- Card texture should suggest paper grain and light letterpress, not dirty grunge.
- Keep the template fixed; only tokens and printed content should change across colors.

### `TransitCard.tsx` Component Spec
- Purpose:
  - one reusable card shell for private hand cards and public market cards
  - same printed-ticket visual language in both contexts
- Core props:
  - `color`
  - `context`: `"hand"` or `"market"`
  - optional `faceLabel`
  - optional `kicker`
  - optional `footer`
  - optional `serial`
  - optional `tag`
  - optional `onClick`
  - optional `disabled`
- Structural layers:
  - outer ticket shell
  - inset frame
  - paper top band
  - colored middle field
  - subtle watermark / route pattern
  - bottom utility band
  - optional chip/tag for market-only callouts
- Defaults:
  - route cards use the route-color token table
  - locomotive uses the wildcard token set
  - market cards remain buttons
  - hand cards remain static informational cards
- Layout rules:
  - title should stay on one line where possible
  - kicker and footer should read as printed utility text, not app chrome
  - market affordance should come from hover and tag treatment, not a different template
- Accessibility:
  - clickable market cards must remain keyboard focusable
  - card text should preserve strong contrast on light and dark route colors

## Board Language
- Routes should feel like placed pieces, not abstract vector lines.
- Visible routes use segmented path slices, not a continuous visible underlay.
- Each route segment is rendered as one aligned stack:
  `backplate stroke + color stroke + optional claim highlight`.
- Claimed routes should use a stitched centerline pattern inside the player-colored segment so ownership is readable without confusing it with the base route color.
- Curved routes should keep curved segments; do not fake them with straight capsules if the route itself bends.
- Station clearance at the start and end of a route is intentional so route pieces do not crowd the hub circle.
- Double routes should default to mirrored split/merge geometry from the station centers.
- Full parallel offsets are a fallback for crowded corridors, not the default twin-route style.
- Label conflicts should be resolved by moving the label into nearby empty space before adding route bends.
- Region labels and shoreline cues should help orientation without becoming the main visual event.

## Board Rendering Rules
- Route geometry is canonical; all visible layers should reuse the same segment geometry.
- Do not mix a smooth visible base path with separately sampled top segments.
- Segment gap, outer padding, and curve sampling should respond to route curvature.
- Claimed-route styling should preserve the same segment silhouette as unclaimed routes.
- Hit targets and selection glows may use the full route path, but the visible route language should stay piece-based.

## Theming Rules
- Visual taste should be editable through tokens first.
- Game-state semantics must not depend on a specific theme color.
- Route colors need pattern or icon support for accessibility.

## Layout Principles
- Board stays central and dominant.
- Private player information sits in a contained side panel.
- Transition screens should feel deliberate and social, not like an error state.

## Collaboration Guidance
- Product designer can iterate on tokens and component styling without rewriting reducers.
- Engineer should expose clear component states for selection, affordability, hover, and ownership.
