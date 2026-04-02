# Component System

## Purpose

This document defines the stable component families Hudson Hustle should grow toward.

During `v2.1`, only extract primitives that are proven by the first slice.

## Current Primitive Direction

Minimum system layer:
- `StatusBanner`
- `Panel`
- optional `Chip/Badge`
- optional `SectionHeader`
- `Button`
- `FormField`
- `SurfaceCard`
- `ChoiceChipButton`
- `ModalShell`
- `UtilityPill`
- `StateSurface`

These primitives now also govern:
- active game side-panel headers
- private-information headers
- board/action shell section framing
- ticket status medallions
- action-detail nested surfaces
- in-action payment choice chips
- setup/lobby/reconnect state surfaces
- shell utility chrome
- modal and tutorial framing

Alongside the React primitives, `v2.1` now also treats two CSS object families as system-level contracts:
- `row / roster object family`
- `artifact / inventory family`

These are not broad React primitives. They are shared anatomy and token rules reused across several surfaces.

## Row / Roster Object Family

Use the row object family to align repeated stacked data rows such as:
- scoreboard entries
- lobby seat rows
- ticket rows
- compact metadata rows inside side panels

Stable anatomy:
- optional `lead` marker, swatch, or chip
- main label block
- secondary metadata line
- trailing stat cluster

This family should stay CSS-first unless a later phase proves a reusable React primitive is necessary.

## Artifact / Inventory Family

Use the artifact family for tactile game objects such as:
- hand cards
- market entries
- destination tickets
- ticket-picker cards
- printed-feel selection artifacts

This family should stay distinct from structural `Panel` surfaces.
Artifacts should feel printed, collectible, or table-native rather than like generic application cards.

## Surface Card

Use `SurfaceCard` for nested authored surfaces inside a larger panel:
- route detail
- city detail
- tunnel reveal
- endgame summary cards

It should not replace the outer `Panel` layer.
Summary variant titles may use the ceremony typography treatment when they represent endgame moments.

## Choice Chip Button

Use `ChoiceChipButton` for compact action choices inside a detail surface, such as:
- claim route with a specific color
- build station with a specific color

It belongs to the action/detail family, not the global button family.

## Modal Shell

Use `ModalShell` for:
- ticket choice overlays
- handoff overlays
- draw reveal moments
- tutorial overlays

It unifies:
- backdrop tone
- width presets
- text alignment
- shared card framing

Its interior titles can use the ceremony typography treatment because modal content is a moment, not a work surface.

## Button

Use `Button` for the primary and secondary shell button family:
- setup actions
- modal actions
- turn controls
- copy/share controls

Do not use it for:
- action-detail color chips
- ticket-card selection buttons

## Form Field

Use `FormField` for labeled inputs and selects in:
- local setup
- multiplayer setup
- reconnect forms

It provides the stable label/control wrapper. It does not replace every custom control container.

## Utility Pill

Use `UtilityPill` for compact chrome metadata and session affordances such as:
- active config labels
- reconnect/session entry points
- small authored utility markers in shell chrome

It belongs to the topbar and shell-utility layer, not the gameplay action layer.

## State Surface

Use `StateSurface` for larger state blocks that need a headline, copy, and optional action or right-side slot:
- setup guidance
- lobby readiness
- reconnect status
- action failure
- empty detail states

It is the more expansive sibling of `StatusBanner`.

## Hardening Boundary

`v2.1` freeze boundaries:
- `StatusBanner` = horizontal shared-state strip
- `StateSurface` = larger state block
- `Panel` = structural shell surface
- `SurfaceCard` = nested authored detail surface
- `UtilityPill` = shell chrome only
- `Inter` = work
- `Fraunces` = ceremony

Do not start by building:
- full button library
- full form library
- full modal library
- full card library

## Status Banner

The first `v2.1` implementation slice is the `status/banner system`.

Banner variants:
- `neutral`
- `active`
- `waiting`
- `warning`
- `failure`

Banner anatomy:
- eyebrow
- headline
- supporting copy
- optional timer or right-side status badge

Use cases:
- multiplayer turn status
- lobby readiness
- setup guidance
- reconnect state
- failure / invalid state

## Panel

Panel variants:
- `neutral`
- `status`
- `private-info`
- `alert`

Panels should remain map-supporting, not map-competing.

Use panel differentiation through:
- surface treatment
- border emphasis
- tonal shifts

Do not differentiate panels through radically different shapes or unrelated visual languages.

Variant intent:
- `neutral` = quiet structural container for board-adjacent or general shell content
- `status` = authored public status surface with slightly stronger hierarchy and emphasis
- `private-info` = warmer, slightly more intimate shell for hidden hand, tickets, and seat-private data
- `alert` = recovery or attention state, visually separate but still inside the same family

## Section Header

Use `SectionHeader` when a shell or panel section needs:
- an eyebrow
- a title
- a small right-side metadata line

It should be used to strengthen hierarchy in:
- lobby sections
- setup sections
- modal/picker headers

Density rules:
- `ceremony`
  - major table status
  - modal/tutorial main titles
  - reveal moments
- `standard`
  - normal board and action shell sections
  - standard setup and lobby sections
- `compact`
  - supporting inventory and supply sections such as hand, tickets, and market

Do not use the full eyebrow/title/meta stack everywhere.
The same anatomy repeated at equal weight will make the shell feel templated.

## Detail Decision Shelf

Within `SurfaceCard`, route and city detail should separate:
- summary / information
- decision shelf

The action choices should feel like a dedicated payment or build tray, not a row of appended pills after body text.

It should not replace every inline heading in the product.

## Cards And Tickets

Cards and tickets remain a separate family from banners and general panels.

Current stable direction:
- keep the printed-ticket language
- unify route cards, tickets, and small previews through anatomy and tokens
- keep interaction clarity stronger than decorative flavor

## Chips And Badges

Chips and badges should:
- stay compact
- remain highly legible
- reinforce status, ownership, and metadata without becoming primary visual events

Likely use cases:
- seat state
- room metadata
- ownership indicators
- small timer or status medallions

During `v2.1`, keep chips small and restrained. They should support the shell, not become the dominant style language.

## Extraction Rule

A primitive should move into the system layer only when:
- it is reused in at least two real UI contexts
- its variants are clear
- extracting it reduces drift more than it adds abstraction
