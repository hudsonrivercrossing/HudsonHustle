# Agent Vs Agent Playtesting

This document is the evergreen guide for running Hudson Hustle agent self-play.

It is not a historical result log.
Version-specific seeded runs and balance conclusions should live under `docs/playtests/`.

## Purpose
- compare strategic personas against the same rules and config
- surface balance pressure without requiring a full human play group every time
- generate structured move-by-move reasoning, not just winners and losers

## Default Inputs
- current player-facing rules:
  - [player-guide.md](/Users/djfan/Workspace/HudsonHustle/docs/gameplay/player-guide.md)
- current active config:
  - [current.json](/Users/djfan/Workspace/HudsonHustle/configs/hudson-hustle/current.json)
- strategy skill:
  - [how-to-win-hudson-hustle](/Users/djfan/Workspace/HudsonHustle/.codex/skills/how-to-win-hudson-hustle/SKILL.md)

## Recommended Persona Pairings
- `central optimizer` vs `outer opportunist`
- `scarcity hawk` vs `ticket maximizer`
- `tunnel conservative` vs `tempo gambler`

Prefer contrasting styles over two generic rational agents.

## Per-Turn Expectations
Each agent should:
- observe current hidden and public state first
- infer the opponent's visible plan from public information
- choose one move
- explain:
  - why this move is best now
  - what ticket or trunk it protects
  - what risk it accepts

## Logging Standard
Record:
- config id
- seed
- personas
- opening tickets
- key choke claims
- tunnel/ferry swing moments
- final scores
- winner
- short balance read

## Where To Put Results
- evergreen guidance stays in `docs/gameplay/`
- versioned seeded runs go in:
  - `docs/playtests/<version>/`
- raw logs go in:
  - `docs/playtests/<version>/raw/`

## Current Historical Example
For the earlier small-map balance cycle, see:
- [v0.4 agent-vs-agent playtest](/Users/djfan/Workspace/HudsonHustle/docs/playtests/v0.4/agent-vs-agent-playtest.md)
