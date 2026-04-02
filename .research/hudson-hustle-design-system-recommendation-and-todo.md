# Hudson Hustle Design System Recommendation And TODO

## Summary

Hudson Hustle does not need a giant component-library-first redesign yet. It needs a shell-first design system that makes the product feel intentional, original, and scalable while protecting the map as the core play surface.

This document is a research synthesis and strategy memo, not the canonical final design-system home. Stable design-system decisions are being promoted into `docs/product/`, while `docs/product/v2/` keeps the versioned rationale and experiment trail.

This recommendation assumes an AI-agent-era workflow:
- coding is not the expensive part
- design judgment and direction-setting are the expensive parts
- existing Hudson Hustle code, docs, and UI are assets to build on
- the right move is not a giant redesign, but a series of validated small slices

The current direction is already better than a generic app:
- warm paper and transit nostalgia language
- route pieces that feel tactile
- cards with printed-ticket energy
- a map-first board

But the system is still incomplete:
- typography is not yet fully distinctive
- shell hierarchy is not yet strong enough
- banners, panels, and action rails still feel more utilitarian than authored
- the relationship between shell language and map language is not fully defined

## AI-era design assumptions for Hudson Hustle

Hudson Hustle should treat design-system work as:
- a direction problem first
- a systematization problem second
- a coding problem third

That means:
- use agents heavily for reference expansion, critique, and synthesis
- keep final taste and boundary decisions human-led
- do not discard existing product strengths just because code changes are cheap
- prefer one strong implemented slice over a broad speculative redesign

The project should assume:
- existing map quality is ahead of shell quality
- existing docs are useful raw material
- existing cards/tactile language are worth preserving
- design work should reuse and formalize good existing patterns wherever possible

## Recommended system direction

### 1. Product position
Hudson Hustle should feel like:
- an original transit strategy game
- warm and tactile
- editorial and confident
- visually authored, not template-driven
- map-first, never dashboard-first

It should not feel like:
- a SaaS dashboard
- a generic board-game companion app
- a Figma component exercise
- a clone of MTA or Ticket to Ride artifacts

### 2. Strong reference direction
`ideago.cc` is a useful directional reference mainly for:
- typography confidence
- layout rhythm
- whitespace discipline
- strong editorial hierarchy
- cohesive brand mood

What to borrow:
- title/body hierarchy
- deliberate spacing
- strong section framing
- confidence through restraint
- layout rhythm that feels designed, not just assembled

What to avoid borrowing literally:
- website-as-poster behaviors that distract from gameplay
- overly sparse layouts that harm readability during play
- decorative abstraction that weakens map legibility

### 3. Shell-first priority
The design system should first shape:
- setup screens
- room lobby
- multiplayer game shell
- local-play shell
- status banners
- action rails
- private information panels
- card and ticket surfaces

The map should remain its own governed layer, influenced carefully rather than restyled aggressively.

This is also the best AI-era cost decision:
- shell changes are cheaper to test and easier to reverse
- map changes are riskier because they affect legibility and gameplay feel
- therefore the shell should absorb the first design-system evolution

## Core design-system recommendation

### Typography
Need:
- one display direction with more authorship and memorability
- one body/system direction that stays highly readable
- a tighter hierarchy for:
  - screen titles
  - section labels
  - status copy
  - utility text

Recommendation:
- use a more distinctive display face for headings and hero moments
- keep body text practical and highly legible
- define a strict scale before broader UI restyling
- current `v2.1` working choice:
  - display: `Fraunces`
  - body / operational UI: `Inter`
- current backup directions:
  - `Space Grotesk + IBM Plex Sans` for a stronger sans-led shell
  - `Archivo Black + DM Sans` for a more brutalist brand experiment

Typography TODO:
- test the chosen `Fraunces + Inter` pair in:
  - setup screen
  - lobby
  - action rail
  - player panel
  - ticket card
- keep `Space Grotesk + IBM Plex Sans` as the fallback if `Fraunces` feels too soft in implementation
- reject any pair that weakens map labels or timer/status readability

### Layout
Need:
- more deliberate page rhythm
- clearer shell hierarchy
- less "UI blocks on a page"
- more authored relationships between board, panel, and banner regions

Recommendation:
- keep board dominant
- make side panels feel like designed instruments, not utility drawers
- make lobby and setup pages feel more editorial and less form-first

Layout TODO:
- define canonical layouts for:
  - local setup
  - multiplayer setup
  - lobby
  - active game shell
- define width rules, spacing rhythm, and section ordering

### Surfaces and panels
Need:
- a tighter surface family
- more cohesion between banners, cards, panels, and tickets

Recommendation:
- create one unified shell language for:
  - paper-like surfaces
  - framed information cards
  - stronger status modules
  - more deliberate chip/badge styling

Surface TODO:
- define panel variants:
  - neutral panel
  - status panel
  - critical alert panel
  - private-info panel
- define shared tokens for:
  - border
  - surface fill
  - shadow
  - radius
  - inset treatment

### Cards and tickets
Current direction is solid, but needs system maturity.

Recommendation:
- keep the printed-ticket language
- improve consistency across:
  - route cards
  - market cards
  - tickets
  - small preview chips

Card TODO:
- unify the anatomy
- document all variants
- define when a card is interactive vs informational
- review contrast and hierarchy on every route color

### Status, timer, and game-state language
This is a major opportunity.

Recommendation:
- treat status banners and timers as part of the brand system, not only utility widgets
- make turn-state language feel deliberate and product-owned
- ensure urgency states are legible without becoming noisy

TODO:
- define banner hierarchy:
  - neutral
  - active turn
  - waiting
  - warning
  - failure
- define timer behavior visually:
  - normal
  - warning threshold
  - expired / timeout resolution

## Map language boundary

### What should stay map-first
- route legibility
- station readability
- color ownership clarity
- label clarity
- board hierarchy
- turn-critical visual signals

### What may safely absorb shell influence
- map framing
- surrounding chrome
- title / subtitle treatment
- panel adjacency and border language
- subtle texture alignment
- limited badge and medallion vocabulary

### What should not happen
- turning the map into a poster-first composition
- reducing contrast for the sake of elegance
- over-stylizing labels
- adding decorative shell motifs directly onto key game paths

## Suggested file structure for Hudson Hustle

Recommended long-term docs:
- `docs/product/design-principles.md`
- `docs/product/reference-critique.md`
- `docs/product/typography-and-layout.md`
- `docs/product/component-system.md`
- `docs/product/map-language-boundary.md`
- `docs/product/design-implementation-backlog.md`

That promotion has now started:
- stable system docs live in `docs/product/`
- `docs/product/v2/` keeps versioned rationale and experiment history
- this memo remains a strategy and synthesis document rather than the canonical spec

## Resource leverage guidance

Before inventing new system pieces, reuse and formalize:
- the current map-first layout logic
- the existing printed-ticket card direction
- the existing tactile/nostalgic material language
- the current status and banner improvements
- the current docs in `docs/product/` and `.research/`

Do not assume that because implementation is cheap, replacement is wise.

Preferred order:
1. formalize what is already good
2. replace only what is clearly weak
3. validate one slice in code
4. then widen the rollout

## V2.1 TODO

### Research and direction
- write a reference critique doc centered on `ideago.cc`
- write a shell-first design direction memo
- define 2-3 font pairing candidates
- define canonical shell layouts
- define panel/banner/card families
- write explicit map-language boundary rules

### Small implementation slice
- ship the multiplayer claimed-route viewer fix
- choose one shell slice to implement after the research lands:
  - lobby
  - status/banner system
  - side panel system

This list is intentionally small because:
- code is cheap
- rework is still expensive
- broad redesign before validation would create more churn than insight

### Validation
- compare before/after shell quality on:
  - setup
  - lobby
  - active game shell
- reject changes that improve mood but reduce play clarity

## V2.2 TODO
- decide whether to expand shell implementation further
- decide whether map framing gets a visual refinement pass
- begin system-player architecture work only after `v2.1` design direction is stable

## Bottom line

Hudson Hustle does not need a maximal design system yet. It needs:
- a stronger typographic and layout voice
- a more authored shell
- a clearer boundary between shell and map
- a design system that can scale without flattening the game into a generic product

That makes `v2.1` the right time for a shell-first design-system definition, not a full visual rewrite.
