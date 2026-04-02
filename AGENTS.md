# Hudson Hustle Agent Instructions

This file is the source of truth for humans and agents working in this repo.

## 1. Working Style
- Start with the smallest change that moves the milestone forward.
- Keep gameplay rules in shared code, not in React components.
- Surface tradeoffs early when scope, balance, or UX are in tension.
- Prefer explicit types, deterministic state transitions, and verifiable behavior.

## 2. Product Intent
- Hudson Hustle is an original NYC/NJ transit strategy game inspired by route-building board games.
- `V1` is a same-laptop pass-and-play web app.
- `V2` is online multiplayer with one laptop per player and an authoritative backend.
- Keep branding, copy, and visuals original even when mechanics feel familiar.

## 3. Collaboration Rules
- `packages/game-core` and `packages/game-data` are shared ownership zones.
- Any rules or map-data change should include tests or a documented balance rationale.
- UI changes must not silently change gameplay behavior.
- Gameplay changes must update player-facing docs in the same task when behavior changes.

## 4. Codebase Shape
- `apps/web`: React + TypeScript + SVG client for local play.
- `packages/game-core`: deterministic rules engine, scoring, serialization, validation.
- `packages/game-data`: board layout, route definitions, tickets, and balancing constants.
- `docs/`: PRD, tech spec, design system, and player documentation.
- `.codex/skills/`: repo-local skills for roadmap management and balance review.

## 5. Design System Guidance
- Preserve the transit-nostalgia direction: tactile, warm, legible, and map-first.
- Keep tokens and components flexible so visual taste can change without rewriting gameplay code.
- Use CSS variables for colors, spacing, radii, shadows, and typography hooks.

## 6. Verification Expectations
- Run targeted tests for `game-core` whenever rules or scoring logic changes.
- Prefer deterministic tests with fixed seeds.
- If you cannot run installs or tests because of environment restrictions, say so explicitly.
- Before any merge into `develop` or `main`, do a code review pass with findings-first reporting.
- Before any merge into `develop` or `main`, review whether affected docs in `docs/` also need updates.
- Before promoting a branch, prefer the smallest real browser or staging smoke that can catch environment-only regressions.
- After merging to `develop`, verify staging deployment health with platform CLIs:
  - check `Vercel` preview / `develop`
  - check `Railway` `api-develop`
  - check staging `/health`
- After merging to `main`, verify production deployment health with platform CLIs:
  - check `Vercel` production
  - check `Railway` `api`
  - check production `/health`

## 7. Safety
- Do not copy official art, rulebook text, logos, or trademarks from Ticket to Ride.
- Avoid introducing passwords, facial recognition, or other security theater into `v1` handoff flow.
- Treat `docs/gameplay/player-guide.md` as a user-facing artifact: tone, sequencing, and clarity matter.
