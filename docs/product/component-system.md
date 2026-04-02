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
- `SurfaceCard`
- `ChoiceChipButton`

These primitives now also govern:
- active game side-panel headers
- private-information headers
- board/action shell section framing
- ticket status medallions
- action-detail nested surfaces
- in-action payment choice chips

## Surface Card

Use `SurfaceCard` for nested authored surfaces inside a larger panel:
- route detail
- city detail
- tunnel reveal
- endgame summary cards

It should not replace the outer `Panel` layer.

## Choice Chip Button

Use `ChoiceChipButton` for compact action choices inside a detail surface, such as:
- claim route with a specific color
- build station with a specific color

It belongs to the action/detail family, not the global button family.

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

## Section Header

Use `SectionHeader` when a shell or panel section needs:
- an eyebrow
- a title
- a small right-side metadata line

It should be used to strengthen hierarchy in:
- lobby sections
- setup sections
- modal/picker headers

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
