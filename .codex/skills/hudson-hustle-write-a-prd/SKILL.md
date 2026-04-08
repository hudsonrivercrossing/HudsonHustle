---
name: hudson-hustle-write-a-prd
description: Use when drafting or revising a Hudson Hustle PRD or feature requirement doc inside docs/product, especially for new initiatives, feature slices, or versioned product changes that need user value, scope, implementation decisions, testing decisions, and out-of-scope boundaries.
---

# Hudson Hustle Write A PRD

Use this skill when the user wants to:
- write a PRD
- shape a new feature or initiative before implementation
- revise product requirements after scope changes
- turn a rough idea into a concrete Hudson Hustle doc under `docs/product/`

Do not use this skill for:
- runtime debugging
- merge readiness
- visual polish cycles
- simple roadmap status updates without a new requirement document

Use `roadmap-manager` instead when the task is mainly milestone planning, sequencing, or risk control.
Use `hudson-hustle-prd-to-plan` after this skill when the PRD is accepted and needs to be sliced into execution phases.

## Output Location
- Prefer updating an existing doc before creating a new one.
- Use:
  - `docs/product/prd.md` for core product scope
  - `docs/product/v2/*.md` for multiplayer/versioned initiatives
  - a new `docs/product/*.md` file only when the topic deserves its own stable artifact

## Workflow
1. Clarify the problem.
- ask only the minimum necessary questions
- identify:
  - user/player value
  - who is affected
  - why now
  - what success looks like

2. Inspect the repo before drafting.
- read only the relevant docs and code
- verify the current product state
- note any existing constraints, version boundaries, or prior decisions

3. Lock the scope boundary.
- separate:
  - in scope
  - out of scope
  - later follow-ups
- explicitly call out whether the work affects:
  - gameplay rules
  - UI/system design
  - multiplayer/backend
  - map/config/balance

4. Record implementation decisions at the right level.
- include module- or system-level decisions
- include testing expectations
- do not overfit the PRD to volatile file paths or code snippets unless the user specifically wants an implementation note

5. Write the doc in repo-native form.
- use the Hudson Hustle template in [references/prd-template.md](references/prd-template.md)
- keep the writing concrete and scoped
- prefer plain language over product theater

6. Align follow-on docs.
- if the PRD changes product behavior, note which docs should later be updated:
  - `docs/product/tech-spec.md`
  - `docs/gameplay/player-guide.md`
  - design docs under `docs/product/`
7. If the user also wants execution planning, explicitly hand off to:
- `hudson-hustle-prd-to-plan`
- and later `hudson-hustle-prd-to-issues` if issue/task breakdown is needed

## Hudson Hustle Defaults
- Preserve:
  - `V1` = local pass-and-play
  - `V2` = authoritative multiplayer backend
- Avoid speculative systems that do not clearly support the active milestone.
- Keep shell/system work separate from map redesign unless the user explicitly expands scope.
- If gameplay or balance changes are involved, record a rationale and expected validation path.

## Good PRD Qualities
- The problem is clear from the player or product perspective.
- The proposed solution is bounded and testable.
- User stories are concrete, not generic filler.
- Implementation decisions are stable enough to guide work without pretending every detail is final.
- Testing decisions focus on observable behavior.
- Out-of-scope items are explicit.

## Deliverable
A good turn should leave behind:
- one updated or newly created PRD-style doc
- one clear in/out-of-scope boundary
- one implementation/testing decision section
- one short note about follow-on docs if behavior changes
