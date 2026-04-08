---
name: roadmap-manager
description: Use when working on Hudson Hustle planning artifacts, milestone sequencing, scope control, risk tracking, or keeping the PRD, tech spec, and implementation work aligned.
---

# Roadmap Manager

Use this skill when the task touches project planning, milestone reshaping, or doc alignment.

This is a planning/orchestration skill, not the best place for every workflow.

Pair it with:
- `hudson-hustle-write-a-prd` for drafting requirements
- `hudson-hustle-prd-to-plan` for converting an accepted PRD into slices
- `hudson-hustle-prd-to-issues` for issue-sized execution breakdowns

## Workflow
1. Read only the relevant planning docs from `docs/`.
2. State which milestone or scope boundary the request affects.
3. Prefer updating existing docs instead of creating new planning files.
4. Keep v1 focused on same-laptop play unless the user explicitly changes scope.
5. When implementation changes behavior, reflect that in `docs/product/prd.md`, `docs/product/tech-spec.md`, and `docs/gameplay/player-guide.md` if needed.
6. When a milestone is effectively complete, prefer an explicit freeze or closeout doc update over leaving the status implicit.

## Use This Instead Of `hudson-hustle-engineering-manager` When
- the task is primarily milestone planning or scope control
- the work is mostly about PRD, roadmap, sequencing, or status docs
- you are shaping future work rather than debugging current runtime behavior

Use `hudson-hustle-engineering-manager` instead when the task is about:
- delivery readiness
- debugging
- testing strategy
- merge gates
- deploy verification

Use `hudson-hustle-prd-to-plan` instead when the source PRD is accepted and the main job is turning it into phased execution slices.

Use `hudson-hustle-prd-to-issues` instead when the source plan is accepted and the main job is turning it into task-sized items.

## Hudson Hustle Defaults
- `V1`: local pass-and-play web app.
- `V2`: authoritative backend for separate-device multiplayer.
- Avoid speculative systems that do not clearly support those milestones.
