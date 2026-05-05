# Typography And Layout

## Active Font Pair

Current `v2.1` working choice:
- display: `Fraunces`
- body / operational UI: `IBM Plex Sans`
- setup/lobby operational UI: `IBM Plex Sans`

Fallbacks:
- primary sans fallback: `IBM Plex Sans + Segoe UI`
- high-intensity experiment: `Archivo Black + DM Sans`

## Typography Roles

### Display
Use `Fraunces` for:
- page titles
- major status headlines
- ceremony moments in setup, lobby, and modals
- the `Round table` section family
- endgame summary titles
- state-surface headlines for setup, lobby, reconnect, and empty-detail moments

Do not use `Fraunces` for:
- ordinary panel titles
- setup step titles
- section headers
- timers
- buttons
- chips
- seat metadata
- detailed gameplay facts

### Body / Operational UI
Use `IBM Plex Sans` for:
- controls
- labels
- timers
- chips and badges
- panel copy
- ticket metadata
- scoreboard rows
- detailed gameplay information

Rule of thumb:
- `IBM Plex Sans` handles work
- `Fraunces` handles ceremony

Setup hierarchy:
- `SetupShell` uses compact `IBM Plex Sans` placards so the active panel stays primary.
- `StationPlate` / `SetupStepPanel` titles, controls, labels, summary rows, seat rows, room codes, timers, and mode switches use `IBM Plex Sans` to avoid a generic AI-product feel and lean into transit manual / station hardware language.
- Reserve `Fraunces` for true ceremony outside the setup console, not routine setup page identity.
- Gateway and setup copy should use game-table verbs such as seat, board, pass, claim, launch, and guide. Avoid generic app verbs like configure, submit, or continue when a more table-native command is clear.
- Active gameplay now uses the same operational sans as setup so controls, buttons, and roster objects feel like one product instead of two UI systems.
- Departure-board tile text is uppercase, short, and mechanical. The six-cell code is the title; do not repeat the same word as a second heading below it.

## Hierarchy

Stable text roles:
- `display-xl`: page-level title
- `display-lg`: section title or major status headline
- `label-eyebrow`: uppercase orientation labels
- `body-md`: default UI body
- `body-sm`: metadata and helper text
- `utility-xs`: dense chip, badge, and operational small print

## Layout Rules

Stable layout rhythm now lives in:
- [Layout Rhythm](/Users/djfan/Workspace/HudsonHustle/docs/product/layout-rhythm.md)

### Global
- board remains the dominant visual region in active play
- side panels should read as instruments, not drawers
- setup and lobby should feel editorial, not form-first

### Spacing
- prefer larger outer breathing room over dense block packing
- establish consistent vertical rhythm between title, status, and panel regions
- use panel groupings to create hierarchy, not color noise

### Banner Placement
- primary status banner sits near the title block, not buried in side content
- timer stays attached to the status banner family
- do not duplicate the same status message in multiple regions

### State Surfaces
- larger state surfaces may pair a Fraunces headline with IBM Plex Sans body text
- keep the headline declarative and short
- reserve this treatment for setup, lobby, reconnect, empty-detail, and failure moments

## Validation Rule

Any typography or layout decision should be judged in:
- setup
- lobby
- multiplayer active game shell
- local-play active game shell

Reject choices that:
- look strong in isolation but weaken in dense play states
- reduce timer readability
- flatten the board/panel hierarchy
