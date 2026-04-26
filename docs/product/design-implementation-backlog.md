# Design Implementation Backlog

## Current Phase

`v2.1` is in final shell/system hardening and freeze.

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

### Fifth Slice
- `overlay / modal / tutorial surfaces`

Scope:
- ticket picker, handoff overlays, draw reveal, and tutorial shells share one modal container family
- tutorial helper blocks use the same nested surface language as the rest of the shell

Extraction allowed during this slice:
- `ModalShell`
- reuse `SurfaceCard` inside guided/tutorial flows

### Sixth Slice
- `button / form control system`

Scope:
- primary and secondary buttons use one reusable component
- setup and reconnect fields use one reusable label/control wrapper
- local, multiplayer, modal, and utility button usage stay aligned

Extraction allowed during this slice:
- `Button`
- `FormField`

### Seventh Slice
- `navigation / utility chrome`

Scope:
- topbar config/session affordances move into one compact chrome language
- local and multiplayer shell utility clusters stop drifting apart
- reconnect/session entry surfaces feel like shell metadata, not ad hoc pills

Extraction allowed during this slice:
- `UtilityPill`
- reuse existing `Button`

### Eighth Slice
- `state surface system`

Scope:
- setup, lobby, reconnect, and action-failure messaging share one larger state surface family
- empty detail states in the action rail use the same surface/copy rhythm
- state blocks feel like deliberate product moments instead of ad hoc error boxes

Extraction allowed during this slice:
- `StateSurface`
- reuse existing `Button`
- reuse existing `SectionHeader`

### Ninth Slice
- `row / roster object system`

Scope:
- scoreboard rows
- seat rows
- ticket rows
- compact metadata row anatomy across setup, lobby, and active shells

Extraction allowed during this slice:
- CSS object family first
- no broad React primitive by default

### Tenth Slice
- `artifact / inventory family`

Scope:
- hand cards
- market cards
- ticket selection cards
- ticket and printed artifact framing

Extraction allowed during this slice:
- artifact tokens and CSS family
- no structural replacement for `Panel`

### Eleventh Slice
- `motion / transition language`

Scope:
- modal open/close
- state-surface/banner transitions
- utility hover/focus states
- tutorial/navigation emphasis

Extraction allowed during this slice:
- system-level motion rules only

### Twelfth Slice
- `responsive density pass`

Scope:
- tighter narrow-width spacing
- utility chrome wrapping
- side-panel and row density under compressed widths
- setup/lobby/modal readability at smaller widths

Extraction allowed during this slice:
- breakpoint refinement only

### Thirteenth Slice
- `system hardening + freeze`

Scope:
- align docs with shipped primitives and CSS object families
- keep showcase current
- add browser verification for utility chrome, state surfaces, and ceremony typography
- reject new primitive creep

Extraction allowed during this slice:
- no new major primitives

## Remaining P1/P2 Follow-ups

### P1 Active Game Shell Object Pass
Scope:
- make active-game side panels feel like table instruments and transit/game objects, not generic app panels
- strengthen scoreboard, hand, market, ticket, board/action headers, and action rail using the existing panel, row, artifact, and control families
- keep board dominance and local/multiplayer active play aligned

Avoid:
- gameplay rules changes
- broad new primitives before CSS object reuse is proven
- copying setup/lobby station-counter composition into active play where table instruments would fit better

### P1 Rulebook / Tutorial / Ticket-Desk Overlay Pass
Scope:
- bring rulebook, tutorial, ticket picker, handoff, and draw reveal into the same object system
- treat tutorial/rulebook as guided lesson sheets or table references
- treat ticket choice/reveal as printed artifacts with stronger station/game affordance

Avoid:
- a full modal-library rewrite
- tutorial copy expanding into active action details
- implementing the disabled guide/onboarding gateway placeholder in this pass

### P2 Semantic Color Usage Audit
Scope:
- audit hardcoded shell colors and migrate stable values to semantic tokens where reuse is clear
- keep setup/lobby-only roles bounded to setup/lobby objects
- map state colors, warning/success/danger, and ownership colors to existing semantic roles instead of adding decorative one-offs

Avoid:
- redefining the palette
- introducing new decorative status colors
- changing map or player ownership colors without a gameplay readability reason

### P2 Type Role Enforcement Pass
Scope:
- verify `Fraunces` is reserved for signage, ceremony, reveal, and major state moments
- verify `IBM Plex Sans` carries operational UI: setup step titles, controls, timers, chips, seat rows, summary rows, and dense game facts
- tighten copy toward board-game verbs: seat, claim, board, launch, pass, guide

Avoid:
- reopening the font-pair decision
- using `Fraunces` for ordinary buttons, chips, timers, dense facts, or small panel labels
- repeating completed setup identity changes

## Deferred

Not for `v2.1`:
- map-adjacent framing refinements
- board label rhythm work
- map visual polish
- design-tooling infrastructure
- broader `v2.2` design evolution

## Review Gates

Freeze checks:
- `Fraunces + IBM Plex Sans` still feels right in dense play states
- utility chrome remains distinct from chips and gameplay controls
- `StatusBanner` and `StateSurface` do not drift into the same job
- row/object and artifact families feel governed without becoming generic cards
- gameplay affordances did not regress
