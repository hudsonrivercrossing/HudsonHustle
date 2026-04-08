---
name: hudson-hustle-session-handoff
description: Use when closing a Hudson Hustle session and preparing a concise handoff for the next session, including branch state, milestone status, key decisions, open work, and the immediate next actions.
---

# Hudson Hustle Session Handoff

Use this skill when the user wants to:
- end a long session cleanly
- carry state into a new session
- summarize what was decided
- capture what still matters before switching topics

Do not use this skill for:
- full PRDs
- roadmap planning from scratch
- polished release notes

This skill is the bridge between sessions.

## Output Location
Default:
- `tmp/session-handoffs/YYYY-MM-DD-<topic>.md`

If the handoff is durable milestone memory and the user wants it to live with the milestone docs, create or update:
- a working note under `docs/product/v2/`

Default to `tmp/session-handoffs/` unless the user asks for a durable doc.

## Workflow
1. Capture branch and repo state.
- current branch
- clean or dirty worktree
- latest relevant commit(s)

2. Capture milestone state.
- active milestone or slice
- what is done
- what is in progress
- what is explicitly deferred

3. Capture key decisions.
- architecture decisions
- product scope decisions
- design boundaries
- testing conclusions

4. Capture open work only at useful granularity.
- no giant changelog
- no replay of the whole session
- only what the next session actually needs

5. End with immediate next actions.
- 1-3 concrete next steps

## Required Sections
Use [references/handoff-template.md](references/handoff-template.md).

## Compression Rule
This note should be compact enough that a fresh session can load it without dragging in the whole old conversation.

## Deliverable
A good turn should leave behind:
- one concise handoff note
- one clear next step
- one explicit statement of what does not need to be re-litigated next session
