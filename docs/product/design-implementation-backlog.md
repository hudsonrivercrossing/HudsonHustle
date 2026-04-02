# Design Implementation Backlog

## Current Phase

`v2.1` should validate one strong slice before broad system rollout.

## Landed

### Foundation Layer
- `color system`
- `layout rhythm system`

Scope:
- semantic color roles promoted into stable docs and theme tokens
- stable shell spacing and width rhythm promoted into stable docs and theme tokens
- outer shell containers start consuming semantic layout variables

### First Slice
- `status/banner system`

Scope:
- multiplayer in-game turn status
- waiting states
- host/setup states
- reconnect and failure states
- timer treatment

Extraction allowed during this slice:
- `StatusBanner`
- `Panel`
- optional `Chip/Badge`
- semantic tokens reused in at least two places

## In Progress

### Second Slice
- `lobby shell + panel/card family`

Scope:
- stronger lobby hierarchy
- more authored setup/lobby section headers
- unified panel-card surface language across seats, tickets, details, and small status surfaces
- minimal supporting primitives only where clearly reused

Extraction allowed during this slice:
- `SectionHeader`
- `Chip/Badge`
- shared panel-card surface styling

### Third Slice
- `game side panels`

Scope:
- active-game scoreboard, hand, ticket, market, board, and action headers use the same shell primitives
- ticket-state labels move into the chip/badge family
- local and multiplayer active shells stay aligned instead of drifting apart

Extraction allowed during this slice:
- reuse existing `SectionHeader`
- reuse existing `Chip`
- keep page layout stable while strengthening system consistency

### Fourth Slice
- `action/detail surfaces`

Scope:
- nested action-detail cards become one reusable surface family
- endgame cards use the same internal surface language
- claim/build choice controls use one reusable choice-chip button

Extraction allowed during this slice:
- `SurfaceCard`
- `ChoiceChipButton`

## Deferred

Not for this phase:
- broad map redesign
- full component-library push
- form-system redesign
- button-system redesign
- full modal-system redesign

## Review Gates

Before widening beyond the second slice, confirm:
- `Fraunces + Inter` feels right in real UI
- status hierarchy is stronger
- timer readability improved
- gameplay affordances did not regress
- extracted primitives were actually reusable
- lobby and card surfaces feel more like one family than isolated utility blocks
