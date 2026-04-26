# Color System

## Purpose

This document defines Hudson Hustle's stable color roles.

Use color semantically:
- by function
- by information hierarchy
- by urgency

Do not assign colors ad hoc per page.

## Core Roles

### Canvas
- `canvas.base`: warm field behind the shell
- `canvas.deep`: deeper backdrop tone for gradients and edge falloff
- `canvas.warm-glow`: warm radial lift
- `canvas.cool-glow`: restrained cool counterweight

These support the transit-nostalgia atmosphere without flattening the board.

### Ink
- `ink.strong`: primary reading color
- `ink.muted`: secondary text, helper copy, and orientation labels

Do not introduce multiple unrelated text browns or grays.

### Surface
- `surface.panel`: default shell surface
- `surface.panel-strong`: brighter high-emphasis shell surface
- `surface.paper`: soft information paper
- `surface.paper-strong`: stronger paper/highlight surface
- `surface.private`: private-information surface
- `surface.alert`: alert/failure-adjacent surface

Surface differences should feel related, not like separate products.

### Border
- `border.subtle`: the default framing line for shell surfaces

Use border emphasis through opacity and context, not by inventing new border colors everywhere.

### Accent
- `accent.base`: primary interactive and active-state blue
- `accent.strong`: deeper action blue for emphasis
- `accent.soft`: supporting accent tint for non-primary states

Blue remains the active shell accent because it reads clearly against the warm paper field.

### Status
- `status.warning`: amber/burnished warning role
- `status.danger`: failure/critical role

These should stay rare and legible. They are not decorative palette colors.

### Setup / Lobby
- `setup.backdrop-veil`: dim atmospheric image layer behind the counter
- `setup.station-enamel`: dark signage/control/panel surface
- `setup.ticket-field`: muted dark printed field surface for inputs, selects, and room-code plates
- `setup.token-accent`: restrained brass/blue selected state for mode switches, chips, timer controls, and primary setup actions
- `setup.printed-rule`: subtle rule line and dashed divider
- `setup.route-line-accent`: small route-line color accent inside thumbnails and markers
- `setup.metadata-muted`: compact setup metadata and secondary labels

These roles support the board-game setup table. Setup panels should read as station enamel, not bright cream cards. Inputs, selects, and room-code plates should use the darker ticket-field material; cream fields are reserved for future literal ticket/paper artifacts only when surrounded by a lighter layout. These roles should not become a second app-wide palette.

## Usage Rules

### Shell
- shell uses warm canvas + paper surfaces
- shell should feel authored and tactile, not flat white
- large shell regions should not compete with map ownership colors

### Interactive States
- active and selected states should lean on accent blue
- hover/focus states should come from existing accent or border roles first
- avoid introducing new greens, purples, or novelty colors for ordinary interactions

### Status States
- neutral: paper + subtle border
- active: accent-tinted surface treatment
- waiting: warm amber-tinted surface treatment
- warning: stronger amber/orange signal
- failure: danger-tinted surface treatment

### Map Boundary
- route colors and gameplay ownership colors are governed by the map/data layer, not by shell palette experimentation
- shell color changes must not reduce route legibility or station clarity

## Implementation Direction

Stable semantic roles should live in:
- [tokens.ts](/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/tokens.ts)
- [theme.css](/Users/djfan/Workspace/HudsonHustle/apps/web/src/design/theme.css)

Page components should consume semantic variables such as:
- `--color-surface-panel`
- `--color-ink-strong`
- `--color-border-subtle`
- `--color-accent-base`

Avoid hardcoding hex values in page-level component styles unless they are map-specific or asset-specific.
