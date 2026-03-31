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
