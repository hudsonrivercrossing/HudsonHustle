# V1 Status

## Status
- `1` is now completed:
  - the first playable small-map station set has been reached and frozen into [v0.4-flushing-newark-airport](/Users/djfan/Workspace/HudsonHustle/configs/hudson-hustle/releases/v0.4-flushing-newark-airport)
- `2` is now completed:
  - playtest and balance work has been recorded through:
    - [balance-review.md](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/balance-review.md)
    - [keep-tune-cut.md](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/keep-tune-cut.md)
    - [tuning-candidates.md](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/tuning-candidates.md)
    - [2p-central-choke-checklist.md](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/2p-central-choke-checklist.md)
    - [agent-vs-agent-playtest.md](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/agent-vs-agent-playtest.md)
- `3` is now completed:
  - the board responds to `backdropMode`
  - the board responds to `boardLabelMode`
  - config tooling now includes `config:switch --list`, `config:preview`, and `config:release`
- `4` is now completed:
  - player-facing docs now explain stations, tunnels, and ferries more clearly
  - the onboarding flow now teaches route types and stations explicitly
  - the config/version system now has a designer-facing guide

## 1. Expand The Station Set To A First Playable Small Map
- Completed:
  - the next-wave station set was expanded, tuned, and then frozen as `v0.4-flushing-newark-airport`
- Outcome:
  - the map is now at a coherent small-map playable scale and no further `v0.4` station additions are planned

## 2. Do A Full Playtest / Balance Pass
- Completed:
  - central choke review
  - tuning candidate review
  - keep/tune/cut triage
  - seeded agent-vs-agent playtests
- Outcome:
  - `v0.4-flushing-newark-airport` now represents the tuned `v0.4` playtest candidate rather than an open-ended draft

## 3. Finish The Config System One Layer Further
- Completed:
  - the UI now responds to `backdropMode`
  - the UI now responds to `boardLabelMode`
  - config tooling now includes:
    - `config:switch --list`
    - `config:preview`
    - `config:release`
- Outcome:
  - versioned map iteration is easier before more playtest rounds

## 4. Do Docs / Player-Facing Polish
- Completed:
  - improved the player guide sections for:
    - stations
    - tunnels
    - ferries
  - improved onboarding step-by-step teaching flow
  - added a designer-facing explanation of the config/version system
- Outcome:
  - collaborators and outside playtesters have a clearer rules and versioning reference

## 5. Do Map Visual Polish Without Adding New Stations
- Completed:
  - optimized board-label abbreviations while keeping full station names in config `name`
  - continued using `label` only for on-board readability
  - ran a label-only sweep on the active draft without moving stations or changing the route graph
  - improved twin-route split/merge geometry
  - improved claimed-route pattern readability
  - refined `backdropMode` behavior
- Outcome:
  - the active draft reads more cleanly at board scale without introducing new stations or new graph complexity
