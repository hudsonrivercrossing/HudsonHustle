# Typography And Layout

## Active Font Pair

Current `v2.1` working choice:
- display: `Fraunces`
- body / operational UI: `Inter`

Fallbacks:
- primary sans fallback: `Space Grotesk + IBM Plex Sans`
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
- section headers
- timers
- buttons
- chips
- seat metadata
- detailed gameplay facts

### Body / Operational UI
Use `Inter` for:
- controls
- labels
- timers
- chips and badges
- panel copy
- ticket metadata
- scoreboard rows
- detailed gameplay information

Rule of thumb:
- `Inter` handles work
- `Fraunces` handles ceremony

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
- larger state surfaces may pair a Fraunces headline with Inter body text
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
