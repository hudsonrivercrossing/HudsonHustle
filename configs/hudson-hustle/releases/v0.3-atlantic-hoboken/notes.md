# v0.3 Atlantic Hoboken

## Snapshot Summary
- This release freezes the current `13`-station working map.
- Active first-ring additions on top of the anchor set are:
  - `Hoboken`
  - `Chelsea`
  - `Williamsburg`
  - `Atlantic Terminal`

## Why This Version Exists
- It is the first frozen release after the map moved from a strict anchor prototype into controlled local expansion.
- It preserves the board state before the next wave adds more Manhattan or Queens decision points.

## Review Focus
- West-side readability:
  - `Secaucus / Hoboken / Exchange Place / Chelsea / Penn District / World Trade`
- Brooklyn/Jamaica local structure:
  - `Downtown Brooklyn / Atlantic Terminal / Jamaica / Williamsburg`
- Whether the graph still uses board space well without introducing dense local ambiguity.

## Release Notes
- This snapshot was frozen from the `current-working` draft after `Chelsea`, `Williamsburg`, `Atlantic Terminal`, and `Hoboken` had all been integrated.
- It is intended to be a stable comparison point for future expansion waves.

## Known Gaps
- Runtime currently still reads map data from `packages/game-data/src/index.ts`, not from this release directory.
- Export automation exists, but the runtime has not yet been switched over to config-driven loading.
