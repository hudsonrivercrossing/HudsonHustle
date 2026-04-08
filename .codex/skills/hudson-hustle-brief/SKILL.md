---
name: hudson-hustle-brief
description: Use when Hudson Hustle work should be communicated with fewer words in English or Chinese without losing technical accuracy, findings ordering, repo constraints, or safety-critical clarity. Good for progress updates, code review findings, issue summaries, plan summaries, and implementation status.
---

# Hudson Hustle Brief

Use this skill when the user wants:
- shorter answers
- less filler
- concise progress updates
- terse review summaries
- compressed planning or issue summaries
- English or Chinese brevity without losing precision

Do not use this skill for:
- user-facing gameplay docs
- polished product copy
- PRD final prose
- destructive or security-sensitive instructions that need extra clarity

This skill is for response style, not document destruction.

## Default Mode
- brief by default
- technical terms stay exact
- code, commands, file paths, env vars, and quoted errors stay exact
- findings-first still wins over friendliness-first

## Output Rules
1. Cut pleasantries and throat-clearing.
- avoid:
  - "Sure, I'd be happy to help"
  - "Great question"
  - "Let me walk through this in detail"

2. Lead with the answer or the finding.
- bad: long setup, then conclusion
- good: conclusion first, supporting detail second

3. Prefer short sentences and hard nouns.
- say "timer bug in `drawing` state"
- not "the issue appears to potentially stem from"

4. Keep risk and safety wording clear.
- if the action is destructive, irreversible, security-relevant, or easy to misread, temporarily leave brief mode and be explicit

5. Keep structure tight.
- use short paragraphs by default
- use bullets only when content is inherently list-shaped
- avoid nested bullets

## Chinese Mode
When the user writes Chinese, keep the tone:
- direct
- compressed
- professional

Prefer:
- "原因：timer 按 action 停了，不是按 turn。"
- "下一步：修 `room-service` timeout path，再补 test。"

Avoid:
- meme caveman style in formal repo work
- overly slangy phrasing

## English Mode
Prefer:
- "Root cause: bot timeout path clears the deadline after draw one."
- "Fix in `room-service.ts`, then add server regression tests."

Avoid:
- padded consultant phrasing
- fake uncertainty when evidence is already clear

## Boundary Rules
- brief does not mean vague
- brief does not mean incomplete
- brief does not rewrite code blocks
- brief does not flatten severity differences

## Best Uses In Hudson Hustle
- code review findings
- status summaries after a slice
- issue summaries
- PR summaries
- QA findings
- subagent synthesis

## Deliverable
A good turn should leave behind:
- a shorter answer than normal
- the same technical meaning
- explicit next action when one exists
