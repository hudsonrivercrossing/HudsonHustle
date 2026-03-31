---
name: game-balance
description: Use when tuning Hudson Hustle routes, tickets, choke points, scoring, stations, tunnels, ferries, or reviewing playtest notes for map and rules balance.
---

# Game Balance

Use this skill for map and scoring work.

## Workflow
1. Inspect the relevant data in `packages/game-data/`.
2. Check whether the change affects route scarcity, ticket overlap, or final-round pacing.
3. Validate that UI changes do not mask balance problems that belong in data or rules.
4. Prefer small data adjustments before changing core rules.

## Review Lens
- Are Hudson and East River crossings overly dominant?
- Do outer-anchor tickets justify their train cost?
- Are stations useful but not mandatory?
- Does the route-length mix still support 45-60 minute local sessions?

## Required Output
- Summarize the balance reason for each change.
- If no automated proof is available, suggest a focused playtest scenario.
