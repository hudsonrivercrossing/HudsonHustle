---
name: hudson-hustle-prd-to-issues
description: Use when an accepted Hudson Hustle PRD or plan needs to be broken into execution-ready issues, task docs, or checklist items with stable scope, acceptance criteria, and validation notes.
---

# Hudson Hustle PRD To Issues

Use this skill when the user wants to:
- break a PRD or implementation plan into issue-sized work
- create execution checklists from an accepted scope
- prepare issue-ready tasks for GitHub or repo-local tracking

Do not use this skill for:
- writing the PRD
- shaping the milestone from scratch
- debugging current code

Use `hudson-hustle-prd-to-plan` first when the work has not yet been sliced and sequenced.

## Workflow
1. Read the accepted source doc.
2. Identify the smallest independently valuable work items.
3. For each item, write:
- title
- problem or objective
- acceptance criteria
- validation
- out-of-scope note
4. Decide the issue metadata at the same time:
- project
- milestone
- primary label
- area label
- assignee or explicit `unassigned`
- project field values
5. If the work will be executed through the roadmap board, define the intended execution order.
6. As implementation starts and finishes, update project status deliberately:
- `Todo` before work starts
- `In Progress` when that issue becomes the active task
- `Done` only after implementation and validation are actually complete
7. Prefer vertical issues over layer-only issues.
8. If the repo is not using GitHub issues for this work, output markdown that can live in a planning doc or checklist.

## Hudson Hustle Defaults
- keep gameplay, UI, backend, and docs aligned when behavior changes
- do not hide validation in a vague “tests pass” note
- if a task touches shared rules or map/config, say so explicitly
- when creating GitHub issues, default to the `Hudson Hustle Roadmap` project
- for versioned work, set the matching milestone such as `V2.2`
- apply one primary repo label:
  - `enhancement` for feature work
  - `documentation` for doc-only work
  - `bug` for regressions or broken behavior
- apply one area label where useful:
  - `area:engineering`
  - `area:docs`
  - `area:design`
  - `area:gameplay`
  - `area:product`
  - `area:ops`
- leave issues unassigned unless the current owner is explicit; do not auto-assign to a personal account by default
- GitHub issue forms in this repo auto-attach:
  - the `Hudson Hustle Roadmap` project
  - base labels such as `enhancement` or `documentation`
- repo automation syncs:
  - milestone sidebar metadata
  - area labels
  - project fields:
    - `Track`
    - `Horizon`
    - `Priority`
- after issue creation, keep project fields sane:
  - `Track`
  - `Horizon`
  - `Priority`
- `Status` still starts at the project default `Todo`
- when executing issues from the board, keep `Status` current instead of leaving everything in `Todo`
- issues created manually outside the forms may still need metadata cleanup
- GitHub sidebar `Type` is not a required automation target in this repo yet; use labels plus project fields instead

## Output Shape
Use the structure in [references/issue-template.md](references/issue-template.md).

## Deliverable
A good turn should leave behind:
- one issue list or task checklist
- stable acceptance criteria
- clear validation notes
- explicit excluded work per item
- metadata defaults that are ready for GitHub form + automation sync without extra guesswork
