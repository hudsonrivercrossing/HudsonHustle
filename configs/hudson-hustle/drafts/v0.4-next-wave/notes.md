# v0.4 Next Wave

## Snapshot Summary
- This draft starts from the frozen `v0.3-atlantic-hoboken` release.
- The active `13`-station baseline is still:
  - `Hoboken`
  - `Chelsea`
  - `Williamsburg`
  - `Atlantic Terminal`

## Why This Version Exists
- It creates a clean draft branch for the next wave of station additions without mutating the `v0.3` release baseline.
- It is the workspace for pushing the map toward the first small-map playable target of roughly `16-17` stations.

## First Addition
- `Battery Park` is now active as the first next-wave station.
- It replaces the old single `World Trade -> Downtown Brooklyn` corridor with:
  - `World Trade -> Battery Park`
  - `Battery Park -> Downtown Brooklyn`

## Second Addition
- `Grove St` is now active as the first Jersey-side next-wave station.
- It replaces the old single `Newark Penn -> Exchange Place` corridor with:
  - `Newark Penn -> Grove St`
  - `Grove St -> Exchange Place`

## Third Addition
- `Hudson Yards` is now active as the first west-Manhattan next-wave station.
- It currently adds:
  - `Hudson Yards -> Grand Central`
- The earlier `Hudson Yards -> Penn District` link has been removed so the node is less redundant with the Penn/Chelsea cluster.

## West-Side Cohesion Adjustment
- `Hoboken -> Grove St` is now active.
- This is a local graph cleanup, not a new cluster:
  - it makes the Jersey side read less like two unrelated spokes
  - it should be reviewed for whether it improves choice without over-connecting the west side

## Fourth Addition
- `Flushing` is now active as the first outer-Queens next-wave station.
- It adds a farther east terminal layer with:
  - `Grand Central -> Flushing`
  - `Flushing -> Jamaica`

## Fifth Addition
- `Newark Airport` is now active as the southwest airport ring node.
- It currently adds:
  - `Newark Penn -> Newark Airport`
- It also now has a difficult helicopter-style tunnel route:
  - `Newark Airport -> Hudson Yards`
- This route is intentionally hard:
  - length `6`
  - gray
  - tunnel risk instead of guaranteed ferry payment
- The earlier direct `Newark Airport -> Battery Park` shortcut has been removed because it felt too invented compared with the rest of the board.

## Sixth Addition
- `Red Hook` is now active as the lower-bay Brooklyn waterfront ring node.
- It adds:
  - `Battery Park -> Red Hook`
  - `Red Hook -> Atlantic Terminal`

## Seventh Addition
- `Union Square` is now active as the central Manhattan next-wave station.
- It adds:
  - `Chelsea -> Union Square`
  - `Union Square -> Battery Park`
  - `Union Square -> Williamsburg`
- The earlier `Union Square -> World Trade` support edge has now been removed so Union Square is less over-connected through the same lower-Manhattan trunk.
- It has also been moved upward so it sits above `World Trade` and below `Chelsea`, which matches the intended Manhattan layering better.

## Realism and Balance Adjustments
- The direct `Newark Penn -> World Trade` route has been removed.
- This draft now avoids those two strongest realism-breaking direct shortcuts:
  - `Newark Penn -> World Trade`
  - `Newark Airport -> Battery Park`
- To reduce central-overlap pressure while strengthening an outer-Queens branch:
  - `t-exchange-grand-central` has been removed
  - `t-grand-central-flushing` has been increased from `6` to `8`
- The regular ticket deck has now been expanded from `23` to `28`.
- The five new regular tickets are aimed at outer nodes and non-central split play:
  - `Newark Airport -> Grove St`
  - `Newark Airport -> Exchange Place`
  - `Hudson Yards -> Flushing`
  - `Red Hook -> Jamaica`
  - `Flushing -> Atlantic Terminal`
- Several routes have also been recolored away from `gray` so the board uses more non-neutral route identities.
- `Secaucus -> Penn District` is now a single tunnel route instead of a double route.
- `Long Island City -> Downtown Brooklyn` has been removed.
- `Union Square -> Williamsburg` has been added as the Manhattan/Brooklyn L-train-style connector.

## Candidate Pool
- `Hudson Yards`
- `Harlem`
- `Yankee Stadium`
- `Red Hook`
- `Union Square`
- `Flushing`
- `JFK`
- `LaGuardia`
- `Newark Airport`

## Working Principle
- Add stations in controlled waves.
- After each addition, rebalance only the affected local cluster first.
- Preserve the board-game-first rubric:
  - readable routes
  - good board-space usage
  - strategy value per added node
  - no unnecessary congestion

## Immediate Goal
- Review whether the current `20`-station draft is already at or beyond the first small-map playable scale.
- Decide whether the next step is:
  - playtest and balance review
  - label and route polish
  - or selective rollback of low-value additions
- Keep `v0.3` as the comparison baseline for whether each added station actually improves the map.

## Known Gaps
- Uptown and airport candidates have not yet been tested for route identity, fairness, or board-space fit.
- Some candidate stations may be dropped if they add congestion without enough strategic value.
