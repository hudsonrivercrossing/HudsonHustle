---
name: hudson-hustle-prd-to-plan
description: Use when an accepted Hudson Hustle PRD or feature doc needs to be turned into a concrete implementation plan with vertical slices, sequencing, validation, doc updates, and explicit out-of-scope boundaries.
---

# Hudson Hustle PRD To Plan

Use this skill when the user wants to:
- turn an accepted PRD into an implementation plan
- sequence a feature into vertical slices
- decide milestone fit, validation order, and follow-on docs
- convert a product doc into execution-ready phased work without yet writing code

Do not use this skill for:
- writing the initial PRD from scratch
- runtime debugging
- merge readiness
- vague roadmap discussion without a concrete requirement doc

Use `hudson-hustle-write-a-prd` first when the requirement document does not exist yet.
Use `roadmap-manager` instead when the task is mainly milestone reshaping across multiple initiatives.

## Inputs
- one accepted PRD or equivalent feature doc
- only the minimum supporting context from:
  - `docs/product/`
  - `docs/gameplay/`
  - relevant code when needed to verify constraints

## Workflow
1. Confirm the source doc and active milestone.
2. Extract:
- problem
- goal
- explicit non-goals
- risky constraints
- required validation
3. Convert the work into vertical slices.
- prefer each slice to cross UI, shared logic, backend, and docs only when needed
- avoid horizontal plans like “schema first, UI later” unless the feature truly requires it
4. Sequence the slices.
- smallest end-to-end proof first
- riskiest unknowns early
- polish last
5. For each slice, state:
- objective
- code/doc areas likely affected
- validation
- out-of-scope guardrail
6. Add rollout or promotion notes if the work touches `develop`, `main`, staging, or production.

## Hudson Hustle Defaults
- Preserve:
  - `V1` = local pass-and-play
  - `V2` = authoritative multiplayer backend
- Do not reopen map redesign unless the PRD explicitly does.
- UI/system work should not silently change gameplay behavior.
- If rules, scoring, map data, or balance change, require tests or a stated rationale.

## Output Shape
Prefer updating or creating a doc under `docs/product/` or `docs/product/v2/` using the structure in [references/plan-template.md](references/plan-template.md).

## Good Plan Qualities
- Each slice is independently meaningful.
- The first slice proves the risky thing quickly.
- Validation is observable and specific.
- Out-of-scope boundaries are explicit.
- The plan is durable and not overfit to volatile file paths.

## Deliverable
A good turn should leave behind:
- one phased implementation plan
- explicit slice order
- validation notes per slice
- a short follow-on docs list
