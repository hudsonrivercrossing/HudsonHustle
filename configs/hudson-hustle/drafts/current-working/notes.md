# Current Working Draft

## Snapshot Summary
- This draft captures the current `13`-station working map.
- Active first-ring additions on top of the anchor set are:
  - `Hoboken`
  - `Chelsea`
  - `Williamsburg`
  - `Atlantic Terminal`

## Why This Version Exists
- It is the first working snapshot after the map moved from a strict anchor prototype into controlled local expansion.
- It records the current board before the next wave adds more Manhattan or Queens decision points.

## Current Review Focus
- West-side readability:
  - `Secaucus / Hoboken / Exchange Place / Chelsea / Penn District / World Trade`
- Brooklyn/Jamaica local structure:
  - `Downtown Brooklyn / Atlantic Terminal / Jamaica / Williamsburg`
- Whether the graph still uses board space well without introducing dense local ambiguity.

## Known Gaps
- This snapshot is still manually synchronized from source code.
- Runtime currently still reads map data from `packages/game-data/src/index.ts`, not from this config directory.
- Export automation should follow after the schema and snapshot workflow feel stable.

## Promotion Rule
- When this draft becomes coherent enough for replay or review, copy it into `releases/` with a named version folder and freeze it there.
