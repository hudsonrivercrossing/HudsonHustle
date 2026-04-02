---
name: hudson-hustle-engineering-manager
description: Use when managing Hudson Hustle engineering work across coding, debugging, testing, delivery, subagent orchestration, and promotion through working branches, develop, and main.
---

# Hudson Hustle Engineering Manager

Use this skill when the task is not only to write code, but to manage the engineering cycle around it:
- scoping the next slice
- coordinating subagents
- debugging across client/server/platform boundaries
- deciding merge gates
- verifying deploy health
- promoting work through `develop` and `main`

## Manager Role
The main session is the manager.

Manager responsibilities:
- keep the critical-path implementation local when the next step depends on it
- use subagents for bounded exploration, review, or parallel verification
- synthesize findings into ranked hypotheses
- choose the smallest defensible fix first
- require validation before promotion

Do not delegate the immediate blocking fix and then wait idly for it.

## When To Use
- staging-only or production-only bugs
- ambiguous regressions that could be client, server, or platform
- deciding whether a branch is ready for `develop` or `main`
- coordinating code review before merges
- planning a debug or hardening cycle
- deciding what to test locally vs. on staging vs. on production

## Use This Instead Of `roadmap-manager` When
- the task is about delivery, debugging, runtime verification, merge readiness, or deploy health
- the task requires subagent orchestration or findings-first code review
- the question is "is this ready to merge or promote?"

Use `roadmap-manager` instead when the task is mainly:
- milestone planning
- scope shaping
- PRD or roadmap updates
- sequencing future work without immediate runtime investigation

## Default Subagent Split
For non-trivial debugging, prefer three lanes:

1. `client`
- inspect browser/UI assumptions
- look for stale state, missing acks, disabled flows, or rendering drift

2. `server`
- inspect transport, auth, CORS, persistence, reducers, timers, and API contracts

3. `platform`
- inspect Vercel, Railway, deploy state, env drift, branch mapping, auth, and proxy behavior

Ask each subagent for:
- most likely failure point
- backups or alternative hypotheses
- fastest discriminating checks
- concrete file references

## Debug Workflow
1. Confirm the symptom shape.
- separate:
  - HTTP lifecycle
  - realtime handshake
  - browser rendering
  - deploy/platform behavior

2. Narrow the failing layer before changing code.
- if `/health` works but the app is broken, do not start by rewriting unrelated UI
- if local works but staging fails, compare env, proxy, and deploy behavior before broad refactors

3. Rank hypotheses.
- keep one leading hypothesis
- keep one or two backup explanations
- say what is proven vs. still suspected

4. Apply the smallest fix first.
- avoid multi-factor refactors on the first pass
- keep root-fix changes separate from UX hardening when possible

5. Re-validate in layers.
- targeted tests
- build
- direct backend probes
- staging/browser smoke
- only then consider promotion

## Testing Tendencies
Prefer this order:

1. local deterministic tests
2. local build
3. direct backend probes
- `/health`
- key API routes
- handshake endpoints when relevant
4. deployed staging smoke
5. production checks after merge

Do not treat `CI green` as equivalent to `staging works`.

For browser-heavy bugs:
- one small real browser flow is worth more than many assumptions
- preview auth can block verification even when the app is healthy
- use share links or equivalent access paths when preview protection is enabled

## UI Hardening Rule
Small UX guards are allowed during root-cause work when they:
- do not mask the real failure
- prevent false-positive interactions
- leave the failure visible

Good examples:
- disable actions that require realtime until subscription is confirmed
- show explicit `connecting` or `failed` states

Bad examples:
- silently fake success
- hide presence, desync, or transport failures

## Branch and Delivery Rules
Use the repo ladder:
- working branch -> `develop`
- `develop` -> `main`

### Before Merge To `develop`
- run a code review pass
- review docs that are affected by the change
- run local validation
- merge only when staging is the correct next test surface

### After Merge To `develop`
- check `Vercel` preview / `develop`
- check `Railway` `api-develop`
- check staging `/health`
- run or request a staging smoke pass if runtime behavior changed

### Before Merge To `main`
- run a code review pass
- review docs that are affected by the change
- require trusted `develop` validation
- prefer at least one real browser or remote smoke result

### After Merge To `main`
- check `Vercel` production
- check `Railway` `api`
- check production `/health`

## Code Review Default
Before every merge, review in findings-first mode:
- bugs and regressions first
- residual risks second
- summary last

If no findings exist, say so explicitly and still mention remaining test gaps.

## Hudson Hustle Heuristics
- gameplay logic belongs in shared code, not in React components
- UI changes must not silently change gameplay behavior
- `Offline` with working HTTP room flow usually points to realtime, not room creation
- `local works / staging fails` usually means env, proxy, deploy, handshake, or auth
- use subagents to widen evidence, not to duplicate the same hunch

## Deliverables
A good manager turn should leave behind:
- one clear root-cause statement
- one chosen fix
- one validation result
- one explicit recommendation:
  - not ready
  - ready for `develop`
  - ready for `main`

## References
- For merge readiness and promotion checks, read:
  - [references/merge-gates.md](references/merge-gates.md)
