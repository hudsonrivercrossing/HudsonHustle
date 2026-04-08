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
4. Prefer vertical issues over layer-only issues.
5. If the repo is not using GitHub issues for this work, output markdown that can live in a planning doc or checklist.

## Hudson Hustle Defaults
- keep gameplay, UI, backend, and docs aligned when behavior changes
- do not hide validation in a vague “tests pass” note
- if a task touches shared rules or map/config, say so explicitly

## Output Shape
Use the structure in [references/issue-template.md](references/issue-template.md).

## Deliverable
A good turn should leave behind:
- one issue list or task checklist
- stable acceptance criteria
- clear validation notes
- explicit excluded work per item
