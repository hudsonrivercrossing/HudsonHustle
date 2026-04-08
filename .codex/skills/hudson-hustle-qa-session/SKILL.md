---
name: hudson-hustle-qa-session
description: Use when running a structured Hudson Hustle QA or playtest session across local, multiplayer, UI, browser, or staging flows and the result should be a concise findings log with severity, repro, and recommended next action.
---

# Hudson Hustle QA Session

Use this skill when the task is to:
- run a focused QA sweep
- capture playtest or browser findings
- verify a feature slice on local, staging, or production
- produce a clean issue log instead of free-form notes

Do not use this skill for:
- deep root-cause debugging by itself
- broad roadmap planning
- balance tuning without a QA session artifact

## Workflow
1. State the surface under test.
2. State the environment:
- local
- staging
- production
- Storybook/showcase only
3. Run the minimum checks that can prove or disprove the suspected behavior.
4. Log findings in findings-first order.
5. For each finding, include:
- severity
- repro
- expected behavior
- actual behavior
- likely owner area
6. If no findings exist, say so and still note residual gaps.

## Hudson Hustle Defaults
- prefer one real browser pass for browser-heavy behavior
- distinguish gameplay bugs from UI bugs
- if behavior changed, note whether docs or tests also need updates
- do not blur “needs polish” with “functional bug”

## Output Shape
Use [references/session-template.md](references/session-template.md).

## Deliverable
A good turn should leave behind:
- one concise QA log
- findings ordered by severity
- explicit residual risks or untested areas
