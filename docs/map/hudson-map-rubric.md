# Hudson Hustle Map Rubric

## Purpose
Use this rubric to review any Hudson Hustle board-layout change.
It is a project-specific acceptance check for map revisions, not a replacement for `docs/map/cartography-workflow.md`.

The standard is simple:
- the map is a game board first
- the route graph carries the board
- geography and base art support orientation without weakening readability

## How To Use It
Review each candidate layout in three passes:
1. `graph only`
   Mute or hide most background art and check whether the route network still reads cleanly.
2. `full board`
   Restore geography, labels, and ornament and verify that readability did not get worse.
3. `table distance`
   Review at realistic board size and viewing distance, not only zoomed in on-screen.

After graph and route work are stable, run a dedicated `label-only polish pass`:
- do not move stations
- do not change routes
- review only the active station labels until they are clean
- prefer nearby empty space and near-icon presets before reopening graph geometry

Fail hard criteria before discussing polish.

For net-new map design or large station changes, review in waves:
- `anchor wave`
- `first-ring expansion`
- `outer fill-in`

Do not approve a layout wave just because the full station list exists on the board.
Approve each wave only if the current graph is already readable before the next wave is added.

## Hard Criteria

### 1. Graph Readability
- A player can find the major hubs in a five-second scan.
- A player can trace the main corridor families without hunting.
- The broad regional structure still reads correctly:
  `New Jersey west`, `Manhattan vertical`, `Brooklyn south`, `Queens east`.
- The board remains understandable when the background is muted.

### 2. Station Distribution
- Stations are spaced for playability, not literal geography.
- Dense-core stations have clearly more board area per station than outer stations.
- No station pair in the core feels visually merged or ambiguous.
- Outer anchors can be compressed, but not so much that they lose directional identity.
- New stations should trigger local rebalance of the nearest anchor cluster before global movement is considered.

### 3. Corridor Geometry
- No unintended route intersections remain.
- Shared or parallel corridors keep a stable visual gap through the shared run.
- Splits happen at clear, intentional junctions.
- Route geometry uses as many bends and waypoint controls as needed for a harmonic board, but no more than the layout actually benefits from.
- Cross-river routes touch shore intentionally rather than cutting through crowded inland space.
- If a corridor still fails after spacing and routing work, simplify the graph before accepting a cluttered solution.

### 4. Label Readability
- Every station has at least one clean label position.
- Labels do not collide with routes, station symbols, neighboring labels, or heavy background detail.
- A label should be moved into the nearest clean empty space before accepting a route bend just to protect it.
- Labels must not sit on top of track segments; if a label is sitting on a line, the default fix is to move the label, not to accept the overlap.
- Corridor families use consistent label behavior where practical:
  mostly horizontal, mostly one-line, mostly same-side.
- Abbreviations are used only after spacing, routing, and label shifts fail.

### 5. Background Discipline
- The board is not relying on shoreline art to explain the route graph.
- Background texture is quieter in dense play zones than in scenic outskirts.
- Water, coastlines, and borough shapes help orientation without stealing attention from routes or labels.

## Hudson Hustle Pressure Zones
These zones should be reviewed first because they are the most likely to fail.

### Battery Park And Hudson Crossings
- `Penn District`, `World Trade`, and nearby Hudson approaches should read as contested but not tangled.
- Jersey-to-Manhattan links should feel deliberate and separable, not like a knot.

### Jersey Waterfront
- `Hoboken`, `Newport`, and `Exchange Place` should read as a waterfront corridor facing Manhattan.
- Their north-south order should remain recognizable even after distortion.

### LIC / Court Square / Queens Plaza
- This cluster needs more space than real geography suggests.
- Labels and route exits should remain separable at table distance.

### Downtown Brooklyn
- `Atlantic Terminal` and nearby Brooklyn connectors should behave like a dense-core expansion zone.
- South Brooklyn routes should not force label collisions back into the core.

## Soft Criteria
- Manhattan still feels like a narrow north-south island even if widened for play.
- Shorelines and harbor shapes still feel like NYC/NJ even after distortion.
- Scenic base art improves character without reducing contrast.
- Region labels help orientation without becoming the main visual event.

## Acceptance Gate
Approve a map revision only if:
- all hard criteria pass
- no pressure zone has an unresolved readability failure
- any remaining issues are cosmetic or flavor-level, not gameplay-legibility issues

## Review Output Template
When reviewing a candidate layout, capture:
- what stations or corridors moved
- whether the change affected `boardX/boardY`, `waypoints`, labels, or only base art
- whether the graph passed the muted-background check
- which pressure zone is still riskiest
- whether the next pass should change the graph or only the art layer
