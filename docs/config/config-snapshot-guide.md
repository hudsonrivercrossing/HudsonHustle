# Hudson Hustle Config Snapshot Guide

## Purpose
This guide is for designers, playtesters, and collaborators who need to understand how Hudson Hustle versions its map and rules snapshots without reading the runtime code first.

The short version:
- `configs/hudson-hustle/` stores named game snapshots
- `drafts/` are working versions
- `releases/` are frozen versions
- `current.json` is the one moving pointer that decides what the app runs

## Why This Exists
Git history alone is not enough for map design work.

We also need a human-readable record of:
- which stations were active
- which routes existed
- which tickets were in the deck
- what rules values were in force
- what visual treatment the board used
- why a given version existed

That is what the snapshot system is for.

## Folder Model
Use [configs/hudson-hustle](/Users/djfan/Workspace/HudsonHustle/configs/hudson-hustle) as the home for all Hudson Hustle snapshots.

Main parts:
- [current.json](/Users/djfan/Workspace/HudsonHustle/configs/hudson-hustle/current.json)
  - the active runtime pointer
- `drafts/`
  - active experiments and work-in-progress versions
- `releases/`
  - frozen named versions for review, playtest, or rollback

## What Lives In One Snapshot
Each snapshot folder contains:
- `meta.json`
  - identity, version, status, summary, design goals, playtest focus
- `map.json`
  - stations, board coordinates, labels, routes, waypoints
- `tickets.json`
  - long and regular ticket definitions
- `rules.json`
  - trains, stations, longest-route bonus, route score table
- `visuals.json`
  - theme, backdrop mode, board label mode, palettes, backdrop art
- `notes.md`
  - the human explanation of why this version exists

## Runtime Mental Model
The app does not free-load arbitrary files at runtime.

Instead:
1. `current.json` points at one config id
2. the generated config registry knows which draft and release snapshots exist
3. runtime code reads the active bundle from that registry

That means:
- switching is explicit
- releases are reviewable
- rollback is safe
- map iteration is not trapped inside one giant source file

## Standard Commands
List available configs:

```bash
pnpm config:switch --list
```

Preview one config without switching:

```bash
pnpm config:preview v0.4-next-wave
```

Switch the active runtime config:

```bash
pnpm config:switch v0.4-next-wave
pnpm build
```

Export the current runtime state back into the working draft:

```bash
pnpm config:export
```

Freeze a draft into a release:

```bash
pnpm config:release v0.4-next-wave v0.4-flushing-newark-airport v0.4
```

## Working Rules
- Treat `current.json` as the only moving pointer.
- Do not silently mutate `releases/`.
- Use `drafts/` for experimentation.
- Promote into `releases/` only when the version is coherent enough to discuss or playtest as a named build.
- If you add or rename snapshot folders, refresh the registry before switching.

## How This Supports Map Design
The snapshot system is built to match the cartography workflow:
- build from a small anchor wave
- add stations in controlled local waves
- rebalance locally
- record why the change happened

That means a map discussion can point at:
- one concrete draft
- one concrete release
- one explicit set of tickets, routes, and visuals

instead of debating a moving target.
