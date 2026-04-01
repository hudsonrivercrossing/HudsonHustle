---
name: how-to-win-hudson-hustle
description: Use when an agent should play Hudson Hustle competently, teach the game strategy, run agent-vs-agent playtests, or review move quality against the current player guide and active config snapshot.
---

# How To Win Hudson Hustle

Use this skill when the task is to play Hudson Hustle, teach another agent how to play well, or run structured playtest games.

## Read First
- Read [docs/gameplay/player-guide.md](../../docs/gameplay/player-guide.md) for the shipped rules.
- Read [configs/hudson-hustle/current.json](../../configs/hudson-hustle/current.json) to see which snapshot is active.
- Read the active snapshot `meta.json` for design goals and playtest focus.
- If the task is balance-sensitive, also read:
  - [docs/playtests/v0.4/balance-review.md](../../docs/playtests/v0.4/balance-review.md)
  - [docs/playtests/v0.4/keep-tune-cut.md](../../docs/playtests/v0.4/keep-tune-cut.md)

## Rules That Matter Most In Play
- You take exactly one action on your turn:
  - draw transit cards
  - claim a route
  - draw destination tickets
  - build a station
- Gray routes require one single color set.
- In `2-3` player games, if one side of a double route is claimed, the twin is locked too.
- Tunnels can cost extra:
  - matching reveal cards and locomotives add surcharge
  - failed tunnel claims still spend the turn
- Ferries require a minimum number of locomotives.
- Stations are mainly endgame rescue tools:
  - each station borrows exactly one adjacent rival route
  - it does not borrow a whole rival network
  - unused stations are worth points

## Core Winning Heuristics

### 1. Solve Tickets With One Coherent Plan
- Keep ticket sets that overlap in geography or trunk use.
- Avoid early hands that require both Jersey and outer Queens unless you already see a coherent central bridge.
- A good opening plan usually has:
  - one primary trunk
  - one secondary branch
  - one fallback ticket you can abandon if needed

### 2. Respect Scarcity Before Value
- Claim routes that are both:
  - important to your ticket set
  - likely to disappear first
- In small-player games, double-route lock matters a lot. Treat a contested double as a scarce single.

### 3. Locomotives Are Tempo, Not Treasure
- Save locomotives for:
  - tunnels you expect to contest soon
  - ferries
  - critical off-color route grabs
- Do not hoard them so long that you lose the route they were supposed to secure.

### 4. Stations Are Rescue, Not Default Infrastructure
- Build a station when it saves a meaningful ticket swing or bypasses a hard block.
- Do not build one early just because the option exists.
- Compare:
  - points saved by rescuing a ticket
  - points lost from spending the station

### 5. Central Nodes Win Games, But Overdependence Gets Punished
- The current tuned map still makes these nodes strategically important:
  - `Penn District`
  - `World Trade`
  - `Grand Central`
  - `Battery Park`
- Use them, but do not assume they are always open.
- Good players pivot to outer or side branches before the core fully closes.

## Current Draft Heuristics

These are draft-sensitive and should be rechecked whenever the active config changes.

### Current Strong Corridors
- `Exchange Pl. <-> World Trade`
- `Newark Penn -> Grove St -> Exchange Pl.`
- `Grand Central -> Flushing`
- `Union Sq. -> Williamsburg`
- `Battery Park -> Downtown Brooklyn`

### Current Risks
- Too many tickets may still want the same central trunk.
- `Battery Park` is still a strong pivot even after recent tuning.
- West-side recovery is clearer than before, so do not assume Jersey mistakes are fatal.

### Current Outer-Node Opportunities
- `Flushing`
- `Newark Airport`
- `Red Hook`
- `Hudson Yards`

If your tickets can justify one of these branches, you often gain:
- lower contest pressure
- a clearer build order
- better ticket-draw upside later

## Observe First, Then Move

Every turn starts with observation.
Do not pick a move from static heuristics alone.

Before acting, inspect:
- your own hidden state:
  - hand colors
  - locomotives
  - trains remaining
  - stations remaining
  - which tickets are already safe
  - which tickets are endangered
- open board state:
  - claimed routes
  - still-open choke points
  - locked twin routes in `2-3` player games
  - face-up market cards
- public opponent state:
  - claimed network shape
  - trains remaining
  - stations remaining
  - likely goals inferred from their route pattern

Before choosing a move, summarize:
- my current plan
- my biggest immediate risk
- the most dangerous opponent claim before my next turn
- my fallback if that claim happens

If you cannot state those four things, you have not observed enough yet.

## Turn-Level Play Protocol

Before each move, answer these questions in order:
1. What is my current network trying to do?
2. Which route, color shortage, or opponent threat is most likely to hurt me in the next two turns?
3. If I do not claim now, can an opponent lock me out or force a station later?
4. Does drawing tickets now improve expected score, or just increase variance?
5. Am I already relying on a station? If yes, avoid adding even more rescue dependency.

### Required Turn Snapshot
Record a short snapshot before acting:
- `My position`
  - strongest ticket plan
  - weakest ticket plan
  - colors closest to a real claim
- `Opponent position`
  - most dangerous open route they can plausibly take next
  - likely region they are targeting
- `Board pressure`
  - best contested route
  - best safe route
  - best draw action if no claim is urgent

Only after this snapshot should the agent pick a move.

### Good Opening Priorities
- Secure one contested trunk or bridge early.
- Draw colors toward a real claim, not just abstract flexibility.
- Avoid pure engine-building hands that leave your first route too late.

### Good Midgame Priorities
- Convert card advantage into actual network shape.
- Draw more tickets only when:
  - your current network already spans multiple useful regions, or
  - your current ticket burden is under control
- Re-plan immediately after any opponent blocks a major intended route.

### Good Endgame Priorities
- Count train pace.
- Decide whether your remaining stations are better as:
  - scoring bonuses
  - ticket rescue tools
- Do not draw new tickets late unless your network is already broad enough to absorb variance.

## Agent-vs-Agent Playtest Protocol

Agent self-play is useful, but only if the agents do not collapse into the same style.

### Recommended Setup
- Use two distinct personas.
- Make each agent declare its plan before the first move.
- Require a short post-turn rationale.
- Require a postgame review.

### Good Persona Pairs
- `Central optimizer`
  - prioritizes high-throughput trunk control
- `Outer opportunist`
  - prioritizes less-contested outer tickets and branching

- `Scarcity hawk`
  - claims vulnerable chokepoints early
- `Ticket maximizer`
  - accepts more draw variance and wider network plans

- `Tunnel conservative`
  - avoids tunnel risk unless overfunded
- `Tempo gambler`
  - uses locomotives aggressively to seize timing edges

### Per-Turn Log Format
- Turn number
- Turn snapshot:
  - my position
  - opponent position
  - board pressure
- Action taken
- Why this was better than the main alternative
- Which tickets or routes are now safer
- Which new weakness was created

### Postgame Review Format
- Final score
- Completed vs failed tickets
- Whether a station mattered
- Most important choke point
- Route or ticket that felt underused
- Any line that felt unrealistic or strategically dead

## What Not To Do
- Do not use hidden information from another player's hand or tickets.
- Do not assume route geometry implies lower contest risk; use actual graph scarcity.
- Do not treat stations as route points.
- Do not draw tickets repeatedly unless your existing network can support it.
- Do not skip the observation step just because one move looks obviously strong.
- Do not ignore public opponent information; Hudson Hustle is not a solitaire routing puzzle.

## Suggested Output When Teaching Or Reviewing
- Give the current observed situation in one short paragraph.
- Give the current strongest plan in one short paragraph.
- List the top `2-3` routes worth prioritizing next.
- Mention one fallback if the main route is blocked.
- Mention whether building a station is currently justified.
