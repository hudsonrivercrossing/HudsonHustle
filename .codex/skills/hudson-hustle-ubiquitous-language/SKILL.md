---
name: hudson-hustle-ubiquitous-language
description: Use when Hudson Hustle terminology is drifting across docs, UI, gameplay, or code and the repo needs one clear glossary or naming decision for components, features, rules, or multiplayer concepts.
---

# Hudson Hustle Ubiquitous Language

Use this skill when the task is to:
- align product, design, gameplay, and code terminology
- stop multiple names from describing the same concept
- create or update a glossary
- settle naming for components, flows, rules, or multiplayer entities

Do not use this skill for:
- pure copywriting polish
- broad redesign
- runtime debugging

## Typical Drift Zones
- `room` vs `lobby` vs `match`
- `seat` vs `player slot`
- `reconnect token` vs `session token`
- `route detail` vs `segment detail`
- `StatusBanner` / `StateSurface` / `Panel` / `SurfaceCard`
- `UtilityPill` vs `Chip`
- player-facing rules terms vs engine terms

## Workflow
1. Collect the current competing terms from:
- relevant docs
- visible UI copy
- shared code names when needed
2. Decide whether the concepts are:
- actually the same thing
- related but distinct
- overloaded and must be split
3. Pick the canonical term.
4. State:
- definition
- where it should appear
- where it should not appear
5. Update the glossary doc or create one using [references/glossary-template.md](references/glossary-template.md).
6. If drift is dangerous, list the highest-value follow-up edits.

## Default Output Location
- Prefer `docs/product/ubiquitous-language.md`.
- If the work is design-system specific, a short addition to `docs/product/design-system.md` is acceptable.
- If the work is gameplay-facing, note whether `docs/gameplay/player-guide.md` also needs a follow-up.

## Naming Rules
- prefer player-understandable language in user-facing docs
- prefer stable terms over clever ones
- keep component names sharp and role-based
- do not let one term cover two different concepts just because they look similar in UI

## Deliverable
A good turn should leave behind:
- one canonical term decision or glossary update
- one short explanation of the boundary
- one list of highest-value follow-up replacements if repo-wide cleanup is not done immediately
