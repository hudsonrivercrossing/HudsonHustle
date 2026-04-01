# v0.4 Next Wave Balance Review

## Scope
- Snapshot reviewed:
  - `configs/hudson-hustle/drafts/v0.4-next-wave`
- Goal:
  - evaluate the draft from playability, fun, strategy, fairness, and pacing
  - identify the biggest balance risks before another large map expansion

## Current Snapshot Facts
- Stations: `20`
- Routes: `32`
- Tickets:
  - `5` long
  - `28` regular
  - `33` total
- Rules:
  - `24` trains per player
  - `3` stations per player
  - unused station value: `4`
  - longest route bonus: `10`

## Route Mix
- Lengths:
  - `20` routes of length `2`
  - `10` routes of length `3`
  - `1` route of length `4`
  - `1` route of length `6`
- Types:
  - `25` normal
  - `7` tunnel
  - `1` ferry
- Double routes:
  - `Exchange Pl. <-> World Trade`

## Ticket Mix
- Long ticket points:
  - `13, 14, 14, 14, 15`
- Regular ticket points:
  - `4 x 4`
  - `5 x 7`
  - `6 x 4`
  - `7 x 2`
  - `8 x 8`
  - `9 x 2`
  - `10 x 1`
- Regular ticket average:
  - about `6.46`

## Highest-Degree Nodes
- `Penn District`: `5`
- `World Trade`: `4`
- `Grand Central`: `5`
- `Long Island City`: `4`
- `Battery Park`: `4`

## Findings

### 1. Midtown / Battery Park are now the dominant decision zone
- `Penn District`, `World Trade`, `Grand Central`, `Long Island City`, and `Battery Park` carry a large share of route choice.
- This is not automatically bad, but it means too many strong tickets may collapse toward the same central plan.
- Main risk:
  - different tickets may look different on paper but still reward the same core trunk.

### 2. The west side is readable, but it may now be slightly over-connected
- `Secaucus`, `Hoboken`, `Exchange Pl.`, `Grove St`, `Newark Penn`, and `World Trade` now form a coherent local graph.
- That is an improvement over the earlier spoke-like shape.
- Main risk:
  - the added internal flexibility may reduce the punishment for west-side mistakes too much compared with east-side routing.

### 3. `Battery Park` is very powerful
- It now connects to:
  - `World Trade`
  - `Downtown Brooklyn`
  - `Red Hook`
  - `Union Square`
- This makes it one of the strongest pivot nodes in the draft.
- Main risk:
  - it can become the easiest rescue point for too many south-core tickets.

### 4. `Union Square` is promising, but currently feels like support rather than a true contested choke point
- Its current links are:
  - `Chelsea`
  - `Battery Park`
  - `Williamsburg`
- This gives it Manhattan identity without letting it shortcut directly into the same `World Trade` hub.
- Main risk:
  - even with the `Williamsburg` link, it may still feel like a connector players are happy to use but not especially eager to contest.

### 5. `Red Hook` and `Newark Airport` use board space well, but their payoff still needs validation
- Spatially, both are good additions.
- They help fill underused areas of the board.
- Main risk:
  - even after the deck expansion, they may still feel like side goals rather than serious alternatives to the core Manhattan economy.

### 6. `Flushing` is the best of the recent east-side additions
- It extends the board cleanly without overcrowding LIC.
- `Grand Central -> Flushing` plus `Flushing -> Jamaica` gives Queens a clearer outer layer.
- Main risk:
  - if the direct `Grand Central -> Jamaica` route remains too efficient, `Flushing` may become optional flavor rather than a meaningful branch.

### 7. The route-length mix is still a little too short-heavy
- `20` of `32` routes are length `2`.
- Only `1` route is length `4`, while the helicopter-style airport link is now a single length `6` outlier.
- Effect:
  - turns may feel tactically active, but network-building can become too incremental and forgiving.
- Main risk:
  - longest-route tension may be weaker than desired
  - ticket completion may skew too easy in the midgame

### 8. `24` trains per player is still plausible, but should be re-evaluated now that the draft is `20` stations / `32` routes
- `24` was reasonable at smaller prototype size.
- With the map now expanded, this value may make endgame arrive a little too early for `4` players or slightly too late for `2` players depending on how many short routes dominate.
- This is not a data bug; it is a pacing question for playtest.

### 9. `3` stations per player is probably still correct
- The map now has enough choke points and rescue cases to justify stations.
- Current concern is not station count.
- The bigger question is whether `stationValue = 4` is too generous relative to how often players are forced to use them.

### 10. The ticket deck is wide enough, but slightly under-shaped
- `33` total tickets is a healthy count for this draft size.
- The main weakness is not deck size.
- The main weakness is role clarity:
  - too many tickets still live in the same broad Manhattan / cross-river core economy.

## Recommendations

### A. Do not add more stations before a focused playtest pass
- The draft is already at a good review threshold.
- More stations now will make it harder to tell whether current issues come from topology or just from too much growth at once.

### B. Playtest with special attention to these nodes
- `Battery Park`
- `World Trade`
- `Penn District`
- `Grand Central`
- `Flushing`
- `Union Square`

### C. Candidate data changes after playtest
- If `Battery Park` proves too central:
  - consider dropping one of its outer connections
  - or raising the strategic cost of that branch
- If west side feels too forgiving:
  - consider whether `Hoboken -> Grove St` should remain
- If `Flushing` is underused:
  - adjust ticket support before adding more Queens nodes
- If longest-route play feels weak:
  - convert one or two short routes into length `3-4` trunks rather than adding more edges

### D. Do not change station count first
- First tune:
  - ticket values
  - which tickets exist
  - one or two route lengths
  - maybe one route type
- Only remove or add stations if the graph still feels wrong after that.

## Focused Playtest Scenarios

### Scenario 1: 2-player central choke test
- Watch whether both players are forced into:
  - `Penn District`
  - `World Trade`
  - `Battery Park`
- Goal:
  - see whether multiple long tickets collapse into the same central plan

### Scenario 2: 3-player west-side flexibility test
- Watch whether west-side mistakes are too easy to recover because of:
  - `Hoboken`
  - `Grove St`
  - `Exchange Pl.`
  - `World Trade`
- Goal:
  - see whether the Jersey side is too forgiving compared with Queens/Brooklyn

### Scenario 3: 4-player outer-node value test
- Watch whether anyone meaningfully uses:
  - `Newark Airport`
  - `Red Hook`
  - `Flushing`
- Goal:
  - verify that these nodes create strategy, not just board decoration

## Provisional Conclusion
- The draft is now large enough and coherent enough to stop expanding for a moment.
- Biggest strengths:
  - much better board-space usage
  - clearer outer caps
  - more interesting Manhattan/Jersey/Brooklyn layering
- Biggest current risks:
  - central-node overconcentration
  - too many short routes
  - some new outer nodes may still be under-supported by tickets
