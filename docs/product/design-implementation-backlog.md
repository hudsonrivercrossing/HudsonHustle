# Design Implementation Backlog

## Current Phase

`v2.1` should validate one strong slice before broad system rollout.

## In Progress

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

## Next Candidate Slices

Choose only one after the first slice review:
- `lobby shell`
- `panel/card family`

Do not run both in the same step.

## Deferred

Not for this phase:
- broad map redesign
- full component-library push
- form-system redesign
- button-system redesign
- full modal-system redesign

## Review Gates

Before choosing the second slice, confirm:
- `Fraunces + Inter` feels right in real UI
- status hierarchy is stronger
- timer readability improved
- gameplay affordances did not regress
- extracted primitives were actually reusable
