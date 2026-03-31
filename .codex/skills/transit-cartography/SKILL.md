---
name: transit-cartography
description: Use when refining the Hudson Hustle board toward board-game-first transit cartography, including station placement, map bounds, route waypoints, label layout, and official-map research.
---

# Board-Game Cartography

Use this skill when the board needs more than cosmetic polish.
It is intentionally reusable for other region maps, not just Hudson Hustle.

## Goal
Turn Hudson Hustle into a readable board-game map that feels geographically grounded without letting real geography overrun gameplay readability.
The route graph should remain understandable even if the base art is temporarily muted.
For Hudson-specific map reviews, apply `docs/hudson-map-rubric.md`.

## Workflow
1. Lock the game graph first:
   cities, adjacencies, route lengths, parallel routes, chokepoints, ferries, tunnels, and ticket economy.
2. Build a coarse geographic scaffold from official references:
   keep broad north/south/east/west order, major water separations, and corridor families.
3. Bind each game node to a concrete official station, complex, or clearly documented proxy.
4. Store real `lat` / `lon`, but place the board using explicit `boardX` / `boardY` once gameplay layout begins.
5. Lay out corridor skeletons first:
   establish major trunks, branch points, and cross-river connectors before distributing every station.
6. Space stations for playability first:
   reserve room for labels, route pieces, parallel tracks, and high-density junctions.
7. Route edges as a first-class design artifact:
   use explicit `waypoints` to avoid intersections, preserve readable parallel corridors, and create shore-touch crossings only where they help orientation.
   Do not minimize waypoint count for its own sake; use waypoint controls freely when they make the board more harmonic, legible, or better balanced.
   If a dense corridor still fails the readability rubric, simplify the graph before adding more geometry:
   remove redundant edges or merge low-value stations rather than accepting route crossings.
8. Distort deliberately:
   expand dense cores, compress sparse outskirts, and straighten noisy diagonals.
9. Reserve label slots before the art layer:
   each station should already have a likely label side and clearance zone.
   If a label sits on track, move the label into nearby empty space before accepting extra route geometry.
10. Draw geography after the graph is stable:
   rivers, islands, coastlines, and decorative landforms should support the final board, not dictate it.
11. Tune labels and ornaments last.
12. When the workflow is improved, update this skill so future region maps reuse the better method instead of rediscovering it.

## Incremental Map Design
When starting from zero or changing an existing board, do not try to place every station at once.
Use an anchor-first wave model.

### Wave 1: Anchor Set
Identify the smallest set of hubs that define:
- the regional mental model
- the trunk corridors
- the main chokepoints
- the likely ticket skeleton

These anchors should be readable on an empty board with muted or no background.

### Wave 2: First-Ring Additions
Add the nearest high-value neighbors around anchors.
When a new node is added:
- rebalance the local cluster
- rebalance nearby route geometry
- reserve label space again
- avoid reopening unrelated zones unless the corridor structure actually changed
- when a node can be pulled into open board space to make several attached routes straighter and less crowded, prefer that move over staying close to literal geography

Think of local nodes as repelling magnets:
- dense neighbors push apart
- anchors should move only slightly
- new nodes must earn their place by improving gameplay or corridor clarity

### Later Waves
Add outer or flavor nodes only after anchors and first-ring clusters are stable.
If many candidate stations arrive at once:
- force an anchor review first
- group candidates into waves
- add them batch by batch

## Incremental Change Rules
When editing an existing map:
- find the nearest anchor corridor first
- apply station spacing changes locally first
- apply route geometry changes locally next
- propagate farther only if the local cluster cannot satisfy the rubric

Do not use full-board retuning as the default response to one new station.

## Track-Crowding Heuristics
Track density is a first-class signal, not just visual cleanup.

Watch for:
- route families competing for the same narrow channel
- repeated bends introduced just to keep too many routes alive
- short low-value routes consuming prime core space
- direct routes that add clutter but little strategic identity

When these appear:
- simplify redundant edges
- merge or drop weak stations
- prefer anchor-chain connectivity over extra direct links
- when a route can remain straight without creating a readability problem, keep it straight instead of preserving an old curved path

## Data Layers
- `lat/lon`: real-world reference truth and source attribution
- `boardX/boardY`: final board-layout coordinates
- `waypoints`: route geometry for pieces and non-intersecting corridors
- `water/coastline features`: supporting base art
- `landforms`: recognizability anchors like islands, peninsulas, or bays
- `labels`: final readability tuning

## Layout Rules
- `stations and tracks define the board`
- `geography explains the board`
- `the graph must still read if the base art is muted`
- Major water bodies are `soft structural guides`, not exact shape constraints.
- Exact shorelines are art-layer inputs, not the main layout engine.
- Prefer explicit `waypoints` over route `offset` once a zone becomes dense.
- Shorten on-board labels with `label` only when needed; keep full names in `name`.
- Treat Manhattan, Hudson crossings, LIC/Court Square, and Downtown Brooklyn as the highest-density conflict zones.
- Preserve game readability over literal accuracy when the two are in tension, but document the tradeoff.
- Keep station spacing even by corridor feel, not literal distance.
- Keep shared or parallel corridors at a stable visual gap until a deliberate split point.
- Treat label slots as part of node placement, not cleanup after routing.
- Prefer moving labels to nearby empty space over bending a route just to dodge text.
- For double routes, prefer a mirrored split/merge shape from the station centers before falling back to full parallel offsets.

## Board Rules
- Unclaimed routes must stay visually distinct from claimed routes.
- Player colors and route-card colors must come from separate palettes.
- Labels should not sit directly on top of route segments if a waypoint or label shift can avoid it.
- Default fix order for text conflicts:
  move the label first, then rebalance the local node cluster, and only then consider adding route geometry.
- Major water bodies should support orientation, not swallow the route network.
- If the city is organized around an island or peninsula, that landform should still be legible after board distortion.
- Avoid unwanted route intersections; if two edges visually cross, there should be a strong game reason and clear visual separation.
- Background texture should reduce visual noise around routes and labels, not add to it.

## Acceptance Checks
- The route graph remains legible if the geography layer is temporarily hidden or muted.
- No unintended route intersections remain after waypoint routing.
- Parallel/shared corridors keep a stable gap through the shared run.
- Dense-core stations have visibly more board area per station than sparse outskirts.
- Every station has at least one clean label position free of route, station, and background-art collisions.
- A player can find hubs, follow main trunks, and read core labels in a five-second scan at real play size.

## Source Priorities
- `mta.info/maps`
- Port Authority / PATH official station and system references
- `njtransit.com` system maps
- `nywaterway.com` official route maps and terminal pages for ferry geometry and Hudson waterfront transfer logic

## West-Side Interpretation Notes
- PATH should anchor the trans-Hudson spine: `Newark Penn -> Journal Square -> Hoboken/Newport/Exchange Place -> World Trade`.
- Hudson-Bergen Light Rail should inform the Jersey waterfront spacing and the relative north-south order of `Hoboken`, `Newport`, and `Exchange Place`.
- Newark Light Rail is useful for the Newark-side context, even if the current board abstracts it into a single `Newark Penn` node.
- NY Waterway is useful for ferry terminal placement and for deciding which crossings should feel like waterfront connectors rather than inland rail links.
- Do not let ferry references flatten the map into a second rail network; use them to improve shoreline/terminal realism and route flavor.

## Required Output
- Summarize which stations or corridors moved and why.
- Note whether the change altered reference `lat/lon`, board coordinates, or only route/base-art geometry.
- List which routes now use `waypoints`.
- State whether the graph still passes the muted-background readability check.
- If the task is a Hudson layout review, evaluate it against `docs/hudson-map-rubric.md`.
- Suggest the next pressure-tested zone for refinement if the board is still dense.
- If the process improved, note what should be copied into future region-map work.
