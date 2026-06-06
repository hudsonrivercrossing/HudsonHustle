# Basemap Generation Pipeline Design

## Status

Approved design for the first NYC basemap pipeline slice.

## Goal

Create a generic basemap-generation pipeline for Hudson Hustle maps, using the current NYC/Hudson board as the first proof of concept.

The pipeline should make each board feel locally recognizable and immersive without weakening gameplay readability. The target is **神似，不追求形似**: preserve the spirit, geographic relationships, and memory triggers of a place without trying to mimic a literal map.

## Current Context

The current board renderer has four visible background/gameplay layers:

1. board surface
2. dotted transit-grid overlay
3. config-backed backdrop geometry from `visuals.json`
4. gameplay routes, stations, labels, claims, hit targets, and highlights

Future basemap work should use only three visible layers:

1. board surface
2. config-backed backdrop geometry
3. gameplay routes, stations, labels, claims, hit targets, and highlights

The dotted overlay should not be part of the long-term board render path for NYC, Berlin, or future map configs.

## Architecture

The NYC pilot should add a basemap generation pipeline, not a one-off art pass.

Inputs:

- `map.json`: board size, active stations, station `lat/lon`, station `boardX/boardY`, labels, route endpoints, route waypoints
- `visuals.json`: board theme, palette, existing backdrop contract
- local recipe: map-specific feature priorities such as rivers, harbor, borough landforms, parks, landmarks, and thematic memory triggers

Pipeline:

1. Read graph and geography from the config snapshot.
2. Classify geographic relationships between stations, routes, boroughs, water, and landmarks.
3. Build protected zones around gameplay-critical elements.
4. Generate candidate backdrop features only where they do not compete with gameplay.
5. Use AI as a creative reference/proposal step for style and feature selection.
6. Store accepted runtime output as config-backed vector data.
7. Render board surface, backdrop geometry, and gameplay graph in that order.

The first implementation can be conservative: generate/report protected zones and hand-author accepted NYC backdrop refinements before fully automating landmark generation.

## Data Model

Keep the first durable model vector-first and config-backed.

The existing `BoardBackdrop` contract supports:

- `landAreas`
- `waterAreas`
- `shorelines`
- `regionLabels`

Add only the fields needed for the NYC pilot:

- `landmarks`: small vector/icon/silhouette features with `id`, `kind`, `point` or `bounds`, optional `label`, `opacity`, and `priority`
- `themeLines`: quiet thematic traces such as ferry corridors, historic borders, or future Berlin Wall traces
- optional `generatedBy` metadata with recipe id, generator version, accepted timestamp, and notes

All runtime basemap points and bounds should use board coordinates. The SVG `viewBox` then scales board surface, backdrop, and gameplay together when the browser window resizes.

Generated basemap data must not alter gameplay. It must not change station positions, route geometry, route lengths, tickets, rules, or scoring.

## Geographic Anchoring

The generator must use both real-world `lat/lon` and final board coordinates.

For NYC:

- `lat/lon` tells the generator geographic facts:
  - World Trade is in Manhattan
  - Exchange Place is in New Jersey
  - the Hudson River lies between them
  - the East River lies between Manhattan and Brooklyn/Queens
- `boardX/boardY` tells the generator where those facts must appear on the playable board:
  - rivers may be distorted
  - routes may cross water
  - background geography must explain crossings without making routes harder to read

The generator should not draw water using simple directional rules like "left of station X." It should infer separation relationships first, then fit them into board-space:

- `Exchange Place -> World Trade` crosses the Hudson River.
- `Grand Central / Union Square -> Long Island City / Williamsburg` crosses the East River.
- `Battery Park / Red Hook / Atlantic Terminal` relates to harbor and Upper Bay context.
- New Jersey stations stay west of Hudson-backed water.
- Manhattan stations stay inside or adjacent to the Manhattan landform.
- Brooklyn and Queens stay east or southeast of Manhattan-backed water.

River width, shoreline shape, and island proportions may be distorted for playability, but the basemap must not invert the meaning of the place.

## AI Role

The preferred first model is vector-first, AI-guided.

AI should help with:

- visual atmosphere
- local feature selection
- landmark vocabulary
- terrain and water treatment ideas
- style references for a richer future SVG/PNG export

The game should own:

- board-space alignment
- protection masks
- final accepted geometry
- contrast and legibility rules
- runtime render order

A later slice can add optional SVG or PNG export from the accepted vector source. That gives the project both AI-rich art potential and deterministic gameplay safety.

## Research And Style Target

Use real map research as reference truth, not as artwork to copy.

NYC reference sources should include:

- NYC borough and shoreline boundary datasets from NYC Department of City Planning via NYU Spatial Data Repository: https://geo.nyu.edu/catalog/nyu-2451-41648
- NYC DEP waterways overview: https://www.nyc.gov/site/dep/water/nyc-waterways.page
- NYC Citywide and East River/Open Waters material: https://www.nyc.gov/site/dep/water/citywide-east-river-open-water.page
- National Park Service Statue of Liberty and Ellis Island map/context pages: https://www.nps.gov/stli/planyourvisit/maps.htm

How to use references:

- Extract relationships, not exact geometry.
- Preserve cross-water relationships like Exchange Place to World Trade.
- Preserve broad orientation: Manhattan north-south, New Jersey west, Brooklyn/Queens east and southeast.
- Simplify shapes heavily so they support gameplay.
- Let AI generate atmosphere from these references, but constrain placement with board-space protection zones.

Good NYC basemap output should:

- feel like NYC harbor and river geography at a glance
- trigger memories through a few quiet landmarks
- avoid asking players to read a real map
- avoid making water, land, landmarks, or theme lines look like playable routes
- stay subordinate to the gameplay graph

## Protected Zones

The generator should reserve protected zones for:

- route stroke corridors, including waypoints
- station rings and station hit targets
- station label bounding boxes
- likely route claim badge positions
- selected and highlighted station rings
- high-contrast route ownership and highlight states

Backdrop features may pass through or sit near these zones only when they are low-contrast enough to stay invisible as gameplay signals. Landmark icons and theme lines should be rejected from protected zones by default.

## NYC Pilot Scope

The first proof of concept should focus on the current NYC/Hudson map.

In scope:

- remove the dotted overlay from the future board render path
- refine Hudson River, East River, Upper Bay, Manhattan, Jersey waterfront, Brooklyn, and Queens backdrop relationships
- add only a small landmark vocabulary where safe:
  - Liberty/Ellis harbor memory trigger
  - Battery/Lower Manhattan harbor edge
  - waterfront park or pier hints where they do not interfere
  - quiet borough/area identity if labels remain legible
- add schema and renderer support only as needed
- validate resize behavior through SVG board-coordinate scaling

Out of scope for the first slice:

- changing stations, routes, tickets, rules, or scoring
- making a literal GIS basemap
- shipping a full raster art board as the runtime source of truth
- solving Berlin-specific Wall/Cold War theming, beyond keeping the model reusable for it

## Validation

Technical checks:

- all generated points and bounds stay inside the board frame
- generated features use board coordinates and scale with the SVG `viewBox`
- dotted overlay is removed from the future board render path
- no gameplay state, route length, station position, ticket, or rule changes are introduced
- `pnpm build` passes
- targeted map/schema tests pass if schema or renderer changes are made

Playability checks:

- routes remain the highest-contrast line system
- station rings and labels remain readable at normal laptop size
- water, terrain, landmarks, and theme lines do not look like playable routes
- landmarks do not sit under route segments, station rings, route claim badges, or station labels
- resized windows preserve layer alignment
- the graph remains understandable if the backdrop is muted or hidden

NYC-specific checks:

- Hudson River visually separates New Jersey and Manhattan where relevant
- Exchange Place to World Trade reads as a Hudson crossing
- Manhattan reads as a north-south island
- Brooklyn and Queens read east or southeast of Manhattan
- harbor and Upper Bay context supports Battery Park, Red Hook, Atlantic Terminal, and Liberty/Ellis-style memory triggers
- landmarks stay low-contrast and secondary

## Open Implementation Notes

- `visuals.json` may remain the first storage location for accepted backdrop data. If the file becomes noisy, introduce a sibling `basemap.json` and import it through the config registry.
- The first generator can be a design/developer tool rather than runtime code.
- The AI step should produce proposals or references, not unreviewed runtime assets.
- A future SVG/PNG export path should be derived from accepted vector data, not replace it as the source of truth.
