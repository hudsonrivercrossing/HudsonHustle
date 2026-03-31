---
name: config-snapshot-manager
description: Use when switching Hudson Hustle config snapshots, exporting the current working draft, promoting snapshots toward releases, or validating the config registry and current.json pointer workflow.
---

# Config Snapshot Manager

Use this skill when the task touches Hudson Hustle config snapshots under `configs/hudson-hustle/`.

## What This Skill Covers
- Switching the active runtime config
- Exporting the current working config snapshot
- Regenerating the config registry
- Freezing a coherent draft into a release snapshot
- Keeping `current.json`, generated registry, and runtime behavior aligned

## Core Principle
- The source of truth for active runtime selection is `configs/hudson-hustle/current.json`.
- Do not hand-edit generated registry files.
- Prefer script-driven updates over manual file juggling when switching or exporting.

## Standard Commands
- Refresh the generated registry:
  - `pnpm config:registry`
- Export the current runtime map/rules/tickets/visuals into the working draft and refresh the registry:
  - `pnpm config:export`
- Switch the active config pointer to an existing draft or release and refresh the registry first:
  - `pnpm config:switch <config-id>`
- After switching, validate the app/runtime state:
  - `pnpm build`
  - optionally `pnpm dev`

## Switching Workflow
1. Confirm the target config id exists under `configs/hudson-hustle/drafts/` or `configs/hudson-hustle/releases/`.
2. Run `pnpm config:switch <config-id>`.
3. Run `pnpm build`.
4. If the user is actively inspecting the board, also run `pnpm dev`.

## Export Workflow
1. Make sure the current runtime state in `packages/game-data/src/index.ts` is the version you want to preserve.
2. Run `pnpm config:export`.
3. Review:
  - `drafts/current-working/meta.json`
  - `drafts/current-working/map.json`
  - `drafts/current-working/tickets.json`
  - `drafts/current-working/rules.json`
  - `drafts/current-working/visuals.json`
4. Update `notes.md` if the exported snapshot meaning changed.

## Release Workflow
1. Export the latest working state with `pnpm config:export`.
2. Copy the working draft into a new release folder under `configs/hudson-hustle/releases/`.
3. Update the new release `meta.json`:
  - stable `id`
  - release `version`
  - `status: "released"`
  - `basedOn`
  - release-specific summary and notes
4. Refresh registry with `pnpm config:registry`.
5. If the release should become active, run `pnpm config:switch <release-id>`.

## Guardrails
- `current.json` should be the only moving pointer.
- Release folders are frozen snapshots; do not silently mutate them.
- If a new config folder is added, regenerate the registry before trying to switch to it.
- If build/test fails after a switch, treat that as a config compatibility issue, not just a UI issue.

## When To Update Docs
- If the switching workflow changes, update:
  - `configs/hudson-hustle/README.md`
  - `docs/tech-spec.md`
- If snapshot schema changes, update both docs in the same task.
