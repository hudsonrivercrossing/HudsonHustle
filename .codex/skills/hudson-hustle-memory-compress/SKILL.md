---
name: hudson-hustle-memory-compress
description: Use when a Hudson Hustle session, working note, or agent memory file should be compressed into a smaller companion note for future sessions without overwriting the original. Safe for internal memory artifacts, not for formal product or player-facing docs.
---

# Hudson Hustle Memory Compress

Use this skill when the user wants to:
- cut repeated session context
- create a lightweight handoff note for a future session
- compress internal working notes
- keep a shorter companion memory file next to a longer original

Do not use this skill for:
- `docs/gameplay/player-guide.md`
- final PRDs
- final design system docs
- final tech spec docs
- polished user-facing copy

This skill compresses memory artifacts, not canonical product artifacts.

## Output Strategy
Default behavior:
- do not overwrite the original
- write a sibling `*.compact.md` file

Example:
- `map-redesign-working-notes.md`
- `map-redesign-working-notes.compact.md`

If no obvious source file exists, create a new compact note in:
- `tmp/session-handoffs/`

## Allowed Inputs
Good candidates:
- temporary working notes
- implementation scratch docs
- freeze review notes
- session summaries
- roadmap working notes
- internal task memos

## Disallowed Inputs
Do not compress these unless the user explicitly asks for an experiment copy:
- `docs/gameplay/*.md`
- `docs/product/design-system.md`
- final PRDs under `docs/product/` that are meant to stay human-readable
- release-facing or player-facing docs

If the source is important but formal, create a separate compact companion instead of mutating it.

## Compression Rules
1. Preserve exact technical anchors:
- code blocks
- commands
- file paths
- env vars
- issue numbers
- PR numbers
- branch names
- URLs
- dates

2. Compress prose aggressively:
- remove filler
- merge repeated bullets
- keep one example, not three
- prefer decisions over narration

3. Preserve actionability:
- what changed
- what is next
- what is blocked
- what must not be forgotten

4. Preserve boundaries:
- in scope
- out of scope
- known risks

## Preferred Shape
Use [references/compact-template.md](references/compact-template.md).

Target:
- 30-60% shorter than the source
- still understandable cold in a future session

## Deliverable
A good turn should leave behind:
- one original note unchanged
- one compact companion note
- one explicit warning if the source was too formal to safely compress
