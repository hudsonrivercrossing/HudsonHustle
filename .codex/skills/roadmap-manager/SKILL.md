---
name: roadmap-manager
description: Use when working on Hudson Hustle planning artifacts, milestone sequencing, scope control, risk tracking, or keeping the PRD, tech spec, and implementation work aligned.
---

# Roadmap Manager

Use this skill when the task touches project planning, milestone reshaping, or doc alignment.

## Workflow
1. Read only the relevant planning docs from `docs/`.
2. State which milestone or scope boundary the request affects.
3. Prefer updating existing docs instead of creating new planning files.
4. Keep v1 focused on same-laptop play unless the user explicitly changes scope.
5. When implementation changes behavior, reflect that in `docs/prd.md`, `docs/tech-spec.md`, and `docs/player-guide.md` if needed.

## Hudson Hustle Defaults
- `V1`: local pass-and-play web app.
- `V2`: authoritative backend for separate-device multiplayer.
- Avoid speculative systems that do not clearly support those milestones.
