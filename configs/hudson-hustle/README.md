# Hudson Hustle Config Snapshots

This directory holds versioned game-design snapshots for Hudson Hustle.

## Usage
- `drafts/` for active experimentation
- `releases/` for frozen, named snapshots
- `current.json` as the only moving pointer to the active config

## Current Pointer
- `current.json` currently points to:
  - `configs/hudson-hustle/drafts/current-working`

## Drafts
- `drafts/current-working/`
  - active working snapshot
  - safe place for ongoing map, route, ticket, and rules iteration

## Releases
- `releases/v0.3-atlantic-hoboken/`
  - first frozen release after the anchor prototype expanded to `13` stations
  - captures the version with `Chelsea`, `Williamsburg`, `Atlantic Terminal`, and `Hoboken`

## Snapshot Files
- Each snapshot folder should contain:
- `meta.json`
- `map.json`
- `tickets.json`
- `rules.json`
- `notes.md`

## Naming
- drafts may use flexible working names
- releases should use stable versioned names such as:
  - `v0.3-atlantic-hoboken`
  - `v0.4-next-wave`

## Notes
- release folders are frozen snapshots and should not be silently mutated
- new work should continue in `drafts/`, then be promoted into `releases/` when coherent
Do not treat this directory as a code cache. It is a human-reviewable record of gameplay configuration.
