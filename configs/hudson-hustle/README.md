# Hudson Hustle Config Snapshots

This directory holds versioned game-design snapshots for Hudson Hustle.

## Usage
- `drafts/` for active experimentation
- `releases/` for frozen, named snapshots
- `current.json` as the only moving pointer to the active config
- `pnpm config:switch <config-id>` to update `current.json` to an existing draft or release
- `pnpm config:switch --list` to inspect available config ids and the active pointer
- `pnpm config:preview <config-id>` to inspect one snapshot without switching
- `pnpm config:release <draft-id> <release-id> <version>` to freeze a draft into a named release
- `pnpm config:registry` to refresh the generated runtime registry
- `pnpm config:export` to export the current runtime snapshot into `drafts/current-working` and refresh the registry

## Current Pointer
- `current.json` currently points to:
  - `configs/hudson-hustle/releases/v0.4-flushing-newark-airport`

## Drafts
- `drafts/current-working/`
  - active working snapshot
  - safe place for ongoing map, route, ticket, and rules iteration

## Releases
- `releases/v0.3-atlantic-hoboken/`
  - first frozen release after the anchor prototype expanded to `13` stations
  - captures the version with `Chelsea`, `Williamsburg`, `Atlantic Terminal`, and `Hoboken`
- `releases/v0.4-flushing-newark-airport/`
  - the first tuned small-map playtest candidate
  - captures the expanded `v0.4` station set with the stronger Flushing and Newark Airport outer-node identity

## Snapshot Files
- Each snapshot folder should contain:
- `meta.json`
- `map.json`
- `tickets.json`
- `rules.json`
- `visuals.json`
  - theme, backdrop mode, board label mode, palettes, and config-backed vector basemap data
  - long-term board rendering uses three visible layers:
    1. board surface
    2. config-backed backdrop geometry
    3. gameplay routes, stations, labels, claims, hit targets, and highlights
- `notes.md`

## Naming
- drafts may use flexible working names
- releases should use stable versioned names such as:
  - `v0.3-atlantic-hoboken`
  - `v0.4-flushing-newark-airport`

## Notes
- release folders are frozen snapshots and should not be silently mutated
- new work should continue in `drafts/`, then be promoted into `releases/` when coherent
- runtime board rendering responds to each snapshot's:
  - `theme`
  - `backdropMode`
  - `boardLabelMode`
Do not treat this directory as a code cache. It is a human-reviewable record of gameplay configuration.
