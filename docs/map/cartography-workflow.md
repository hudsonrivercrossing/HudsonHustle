# Hudson Hustle Cartography Workflow

## Goal
Build Hudson Hustle like a board-game map, not a strict transit diagram.
The board should feel recognizably NYC/NJ, but the real priority is route readability, clean spacing, and non-intersecting track geometry.
Use `docs/map/hudson-map-rubric.md` when judging whether a candidate layout is actually ready.

## Core Principle
- `stations and tracks define the board`
- `geography explains the board`
- `the graph must still read if the base art is muted`

That means:
- real geography sets the broad scaffold
- the final board layout is an intentional game layout
- rivers, shorelines, and islands support orientation, but do not get veto power over playability
- the background should reinforce the network, not compete with it

## Data Layers
Keep these layers separate:
- `lat/lon`: authority-backed reference truth for each node
- `boardX/boardY`: final board coordinates used by the shipped game board
- `waypoints`: explicit route geometry for dense corridors and crossings
- `water/coastline features`: supporting base-art geometry
- `landforms`: recognizability anchors like Manhattan or harbor shapes
- `labels`: final readability tuning

## Standard Workflow
1. Lock the game graph first.
   Define cities, route adjacencies, route lengths, double routes, ferries, tunnels, chokepoints, and ticket economy before drawing the final board.
2. Build a coarse geographic scaffold.
   Preserve broad truths only:
   west/east ordering, north/south ordering, major water separation, and corridor families.
3. Bind each game node to an official station, complex, or documented proxy.
4. Record authority-backed `lat/lon`.
5. Lay out corridor skeletons in `boardX/boardY`.
   Place the major trunks, branch points, and cross-river connectors before distributing every station.
6. Place cities in `boardX/boardY` for board readability.
   Dense cores should be expanded.
   Sparse outer anchors can be compressed.
   Station spacing should feel even along a corridor, not geographically exact.
7. Route the network as its own design pass.
   Use explicit `waypoints` to avoid unwanted intersections, protect whitespace, and keep parallel corridors readable.
   Parallel corridors should keep a stable gap through shared runs and split only at clear junctions.
   Do not optimize for a low waypoint count by itself; use as many waypoint controls as needed to make the board feel harmonic and legible.
   If a corridor family still cannot satisfy the readability rules, simplify the graph before adding more decorative routing:
   remove redundant dense-core edges or merge weak stations before accepting crossings.
8. Reserve labels while the graph is still open.
   Every station should have a planned label side and clearance zone before the art layer begins.
   If a label overlaps a route, first move the label into the nearest clean space before bending the route.
9. Add supporting geography after the graph is stable.
   Draw rivers, coastlines, islands, harbor water, and region labels to reinforce the final board.
10. Tune labels last.
   Move labels before reopening the graph unless the underlying station placement is clearly wrong.

## Label-Only Polish Pass
After station placement and route geometry are stable, run a dedicated label-only pass.

Rules:
- do not move stations
- do not change routes
- review only the active station labels
- move labels into nearby empty space until route, station-dot, and neighbor conflicts are clean
- prefer a small set of near-icon label presets before adding bespoke offsets

Default fix order:
1. move the label
2. if still impossible, rebalance the local label preset or offset
3. only then reconsider local route geometry
4. only last reconsider station placement

## Incremental Layout Protocol
Do not try to place the whole board at once and then “fix” it afterward.
Use an anchor-first incremental process.

### Wave 1: Anchor Points
Start with the irreplaceable anchors first.
These are the stations or hubs that define the board’s mental model and corridor structure.

For Hudson-style maps, anchors are things like:
- `World Trade`
- `Penn District`
- `Grand Central`
- `Union Square`
- `Long Island City`
- `Jamaica`
- `Newark Penn`
- `Secaucus`
- `Downtown Brooklyn`

Anchor rules:
- anchors set the first stable skeleton of the board
- anchors should be readable even with no background art
- anchors should establish the main corridor families before nearby detail is added
- anchor placement should already reserve space for likely future neighbors

### Wave 2: First-Ring Neighbors
Add only the nearest, most structurally important neighbors next.
Examples:
- after `World Trade`, add `Exchange Place`, `Battery Park`, or a nearby Brooklyn connection
- after `Penn District`, add `Chelsea` and the main east-river connector
- after `Long Island City`, add `Queens Plaza`, `Court Square`, or `Williamsburg`

Rules for each added station:
- check whether the new node deserves to exist as a gameplay node, not just a geographic fact
- rebalance only the local cluster and its connected corridors first
- allow nearby anchors to shift slightly, like repelling magnets finding a new equilibrium
- do not destabilize distant zones unless the corridor family truly changed
- if moving a local node into open board space makes multiple connected routes straighter, cleaner, and less crowded, prefer that graph outcome over literal geography

### Wave 3 And Beyond: Outer Fill-In
Only after anchors and first-ring neighbors are stable should outer or flavor nodes be added.
Each new wave should:
- preserve the anchor skeleton
- preserve corridor readability
- preserve the no-unintended-crossing rule
- preserve label clearance

If a user proposes many new stations at once:
- stop and identify the `anchor set` first
- sort the rest into second-wave and later-wave candidates
- add them in batches instead of all at once

## Rebalancing Rule
Each new node or route should trigger a local rebalancing pass.
Think of the nearby nodes and corridors as a constrained equilibrium system:
- dense stations push each other apart
- major trunks want straighter geometry
- labels need reserved air
- crossings should be removed before more content is added
- labels should move to nearby empty space before route geometry becomes more complex

The question is not “can this station fit somewhere.”
The question is “what local rebalance produces the cleanest graph after this station exists.”

## Change Protocol For Existing Maps
When a station, POI, or route is added to an existing board:
1. identify the nearest anchor corridor or anchor cluster
2. insert the new node only into that local cluster first
3. rebalance station spacing in that cluster
4. rebalance route geometry in that cluster
5. re-check label fit in that cluster
6. only then check whether the change should propagate farther

Do not immediately retune the whole map unless:
- the new node changes a trunk corridor
- the new node creates an unavoidable topological conflict
- the new node changes the map bounds or major anchor ordering

## Track Density And Length Heuristics
Track layout should also be reviewed as capacity, not just shape.

Use these signals:
- if a corridor family cannot stay straight enough without repeated bends, it is too dense
- if several routes want the same narrow visual channel, station spacing or route count should change
- if a short route consumes too much precious core space, it may be a bad gameplay node
- if a long route can be represented more clearly by going through an anchor chain, prefer the cleaner chain over an extra direct edge

Route-length guidance:
- dense-core routes should usually be short and visually crisp
- long routes deserve clearer, less crowded channels
- direct routes should justify themselves by gameplay value, not just geographic realism
- if a route creates clutter but adds little strategic identity, simplify it out
- if a route can be a straight line without harming readability or causing crossings, prefer the straight line
- for double routes, prefer two mirrored lines that split shortly after the station and merge shortly before the destination; use full parallel offsets only when the corridor is too crowded for that pattern

## Constraint Levels
- Hard constraints:
  broad regional orientation
  Example: Hudson west of Manhattan, East River east of Manhattan, Brooklyn/Queens east-southeast of Manhattan.
- Soft constraints:
  shoreline feel, river width, island silhouette, terminal flavor.
- Art-layer inputs:
  decorative coast texture, harbor shape detail, terrain hints, landmarks, and ornament.

## Hudson Hustle Interpretation
- Manhattan should read as a narrow north-south island, but can be wider than reality if needed for play.
- Jersey waterfront should read as a shoreline corridor facing Manhattan, not a geographically literal shoreline trace.
- LIC, Court Square, Queens Plaza, and Williamsburg need more board-space than real geography would normally allow.
- Downtown Brooklyn and lower Manhattan should be treated as dense-core expansion zones, not literal-distance zones.
- Coney Island, Flushing, Edison, and Newark can be somewhat compressed toward the core as long as their direction remains recognizable.
- Cross-river routes should touch shore intentionally, but shoreline precision should not force bad edge geometry.

## Anti-Patterns
- Starting from an exact projected map and trying to “fix” congestion afterward.
- Letting coastline accuracy force ugly route intersections.
- Treating route waypoints as cleanup instead of first-class layout design.
- Painting the geography first and forcing the network to fit inside it.
- Using giant diagram nudges as a substitute for a real board layout.
- Deferring label placement until after dense corridors are already locked.
- Letting scenic background detail reduce contrast around routes, station symbols, or labels.

## Acceptance Checks
Apply the full Hudson-specific review in `docs/map/hudson-map-rubric.md`.
- The graph stays readable if the background art is muted or hidden.
- No unintended route intersections remain.
- Parallel/shared corridors keep a stable visual gap through the shared run.
- Dense-core stations have visibly more board area per station than sparse outer stations.
- Every station has at least one clear label position that does not collide with routes, neighbors, or heavy background detail.
- A player can identify hubs, trace major trunks, and read core labels in a five-second scan at real play size.

## Reuse For Other Regions
For a new region map:
- gather official node references and corridor relationships
- store real `lat/lon`
- design the graph layout in `boardX/boardY`
- route edges for board readability
- then draw the supporting geography

If the board ever changes stations or bounds, update the graph layout first and redraw the art layer from that stabilized graph instead of trying to preserve old shoreline art.
