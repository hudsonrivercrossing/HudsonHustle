# v0.4 Tuning Candidate List

## Purpose
- Turn the high-level balance review into concrete tuning candidates.
- Keep these as candidate changes, not committed balance decisions.
- Prefer small data changes before adding or removing more stations.

## First Applied Test
- Current first applied tuning test on `v0.4-next-wave`:
  - increase `union-square -> battery-park` from `2` to `3`
  - remove `t-world-trade-grand-central`
- Reason:
  - slightly raise the cost of the central Manhattan rescue ladder
  - remove one ticket that directly reinforces central-trunk overlap

## Second Applied Test
- Current second applied tuning test on `v0.4-next-wave`:
  - remove `t-exchange-grand-central`
  - increase `t-grand-central-flushing` from `6` to `8`
  - remove direct `newark-penn -> world-trade`
  - remove direct `newark-airport -> battery-park`
  - move `Union Square` upward so it sits above `World Trade` and below `Chelsea`
  - recolor several formerly gray routes to spread route color identity more evenly
- Reason:
  - further reduce ticket overlap on the same central trunk
  - strengthen one outer-Queens objective instead of continuing to reinforce Midtown/WTC play
  - cut two direct edges that felt too invented relative to the rest of the board's real-world transit logic
  - make the route palette feel less over-weighted toward gray filler edges

## Third Applied Test
- Current third applied tuning test on `v0.4-next-wave`:
  - increase `secaucus -> newark-penn` from `2` to `3`
- Reason:
  - make the Jersey-side north-south trunk slightly more committal
  - reduce the feeling that west-side recovery is too cheap compared with other board regions

## Fourth Applied Test
- Current fourth applied tuning test on `v0.4-next-wave`:
  - remove `union-square -> world-trade`
  - remove `t-union-square-world-trade`
- Reason:
  - reduce one more central-Manhattan support shortcut into the same World Trade trunk
  - make Union Square more distinct as a Chelsea/Battery Park connector instead of a second direct path into the lower Manhattan hub

## Fifth Applied Test
- Current fifth applied tuning test on `v0.4-next-wave`:
  - increase `grove-st -> exchange-place` from `2` to `3`
- Reason:
  - make the Jersey waterfront recovery chain slightly less cheap
  - preserve the route while asking for more commitment on the west-side ladder

## Sixth Applied Test
- Current sixth applied tuning test on `v0.4-next-wave`:
  - recolor `secaucus -> newark-penn` from `gray` to `crimson`
  - recolor `battery-park -> downtown-brooklyn` from `gray` to `crimson`
- Reason:
  - spread the route-card palette more evenly so `crimson` is actually represented on the board
  - reduce over-reliance on `gray` filler edges while giving one Jersey trunk and one south-harbor trunk a clearer color identity

## Seventh Applied Test
- Current seventh applied tuning test on `v0.4-next-wave`:
  - collapse `secaucus -> midtown-west` from a double route to a single tunnel route
  - remove `long-island-city -> downtown-brooklyn`
  - add `union-square -> williamsburg`
- Reason:
  - simplify one premium corridor that did not need to stay doubled at the current map scale
  - remove a low-identity LIC-to-Brooklyn ferry edge
  - give Union Square a clearer, more authentic Manhattan/Brooklyn connector identity through the Williamsburg/L-train axis

## Priority 1: Central-Core Pressure

### Candidate A1: Reduce `Battery Park` flexibility
- Problem:
  - `Battery Park` currently connects to too many important branches.
- First options to test:
  - remove `newark-airport -> battery-park`
  - or remove `battery-park -> red-hook`
  - or change one of those branches from a strong trunk feel to a weaker flavor branch
- Expected effect:
  - makes `Battery Park` less of an all-purpose rescue hub
  - increases commitment cost for south-core tickets

### Candidate A2: Make one central route longer
- Problem:
  - too many strong central routes are still length `2`
- First options to test:
  - increase `world-trade -> battery-park` from `2` to `3`
  - or increase `union-square -> battery-park` from `2` to `3`
- Expected effect:
  - slows central cleanup
  - increases opportunity cost of using the central Manhattan ladder

### Candidate A3: Lower support for redundant central tickets
- Problem:
  - too many tickets may reward the same Manhattan trunk
- First options to test:
  - remove or downgrade one of:
    - `t-world-trade-grand-central`
    - `t-exchange-grand-central`
    - `t-world-trade-downtown-brooklyn`
- Expected effect:
  - reduces ticket overlap around the same central path

## Priority 2: West-Side Flexibility

### Candidate B1: Re-evaluate `Hoboken -> Grove St`
- Problem:
  - west side may now be too forgiving
- First options to test:
  - keep it and observe
  - or remove `hoboken -> grove-st` if west-side recovery feels too easy
- Expected effect:
  - sharper distinction between waterfront and inland Jersey decisions

### Candidate B2: Increase cost on one Jersey recovery line
- Problem:
  - west side has several short recovery paths
- First options to test:
  - increase `grove-st -> exchange-place` from `2` to `3`
  - or convert `hoboken -> chelsea` to a more conditional route type if needed
- Expected effect:
  - makes west-side reroutes less trivial

## Priority 3: Outer-Node Value

### Candidate C1: Strengthen `Flushing` ticket support
- Problem:
  - `Flushing` may be readable on the board but still strategically optional
- First options to test:
  - add one more `Flushing`-involving regular ticket
  - or slightly raise `t-grand-central-flushing`
  - or slightly raise `t-flushing-jamaica`
- Expected effect:
  - makes outer Queens worth contesting

### Candidate C2: Strengthen `Newark Airport` ticket support
- Problem:
  - `Newark Airport` may still feel like a decorative leaf
- First options to test:
  - add one regular ticket involving `newark-airport`
  - or raise a future `t-newark-airport-battery-park` if that corridor ever returns
- Expected effect:
  - makes the southwest extension feel intentional

### Candidate C2b: Validate the helicopter tunnel rather than treating it like a normal airport edge
- Problem:
  - `newark-airport -> hudson-yards` is intentionally flavorful and intentionally hard
- First options to test:
  - keep it as a gray length-`6` tunnel
  - cut it if players either ignore it completely or use it as a surprisingly easy shortcut
- Expected effect:
  - keeps the route as a premium stunt line rather than a routine airport connector

### Candidate C3: Strengthen `Red Hook` ticket support
- Problem:
  - `Red Hook` currently has strong spatial value but lighter strategic proof
- First options to test:
  - add one ticket involving `red-hook`
  - or raise `t-red-hook-atlantic-terminal`
  - or raise `t-battery-park-red-hook`
- Expected effect:
  - makes lower-bay routes worth considering instead of ornamental

## Priority 4: Route-Length Mix

### Candidate D1: Convert 1-2 short routes into medium routes
- Problem:
  - route mix is too heavy on length `2`
- First options to test:
  - pick one or two of these and increase to `3`:
    - `chelsea -> union-square`
    - `flushing -> jamaica`
    - `downtown-brooklyn -> atlantic-terminal`
    - `newark-penn -> newark-airport`
- Expected effect:
  - increases planning commitment
  - improves longest-route tension

### Candidate D2: Preserve short routes but cut one redundant edge
- Problem:
  - small-map readability and balance can worsen if every short option stays
- First options to test:
  - if a cluster still feels too easy, remove one low-identity route before adding cost elsewhere
- Expected effect:
  - cleaner strategic identity per cluster

## Priority 5: Economy Rules

### Candidate E1: Re-test `24` trains per player
- Problem:
  - map is larger now than the original small prototype
- First options to test:
  - keep `24` for first pass
  - compare with `26` in one controlled playtest
- Expected effect:
  - helps determine whether endgame comes too soon on the expanded draft

### Candidate E2: Re-test `stationValue = 4`
- Problem:
  - unused stations may be worth too much if stations become genuinely necessary
- First options to test:
  - compare `4` vs `3`
- Expected effect:
  - helps reveal whether the current station economy is too conservative

## Recommended Order
1. Do not change station count first.
2. Playtest the current draft once.
3. Apply one change from Priority 1 and one from Priority 3 only.
4. Re-test before touching more than two levers at once.

## Best First Batch
- `A1`: reduce one `Battery Park` branch if it dominates play
- `C1`: strengthen `Flushing` support if it goes underused
- `E2`: compare station value `4` vs `3` if players never build stations
