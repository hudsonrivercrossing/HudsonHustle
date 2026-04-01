# Agent Vs Agent Playtest

This document captures one seeded self-play run on the active `v0.4-next-wave` draft using the `how-to-win-hudson-hustle` strategy skill.

## Setup

- Map: `Hudson Hustle Anchor Prototype`
- Seed: `42`
- Personas:
  - `central optimizer`
  - `outer opportunist`
- Players:
  - `Blue`
  - `Red`

## Result

- Final score: `Blue 40`, `Red 14`
- Winner: `Blue`
- Game length: `50` turns plus final scoring

## High-Level Read

- The central plan still won on this map.
- The outer plan made real progress on Jersey and Brooklyn connectors, but it could not keep pace with the center once the central Manhattan chain started converting tickets into score.
- Tunnel risk mattered early. `Exchange Pl. -> World Trade` failed once on surcharge, which is a good sign that tunnels are not pure upside.
- The `Newark Airport -> Hudson Yards` helicopter-style tunnel did not become decisive in this seed.

## Key Turning Points

1. `Blue` spent the first phase drawing toward a central trunk and quickly converted `Atlantic Terminal -> Jamaica`.
2. `Red` successfully opened the Jersey side with `Exchange Pl. -> World Trade`, `Battery Park -> Red Hook`, `Hoboken -> Chelsea`, and `Hoboken -> Grove St`.
3. `Blue` then connected the Brooklyn side and the Manhattan middle with `Williamsburg`, `Chelsea`, `Union Sq.`, and `Battery Park`.
4. `Red` never found a single outer-node chain that matched the score pace of the center.

## What The Log Suggests

- The central corridor is still the most efficient route family.
- Outer nodes now have real utility, but not enough to become the dominant plan by default.
- `Battery Park` is doing useful work as a split point.
- `Grove St` and `Hoboken` feel strategically real, not decorative.
- The `Newark Airport -> Hudson Yards` tunnel is flavorful but expensive enough to stay situational.

## Review Questions

- Is the central trunk still too score-efficient relative to outer branches?
- Are the outer-node tickets valuable enough to justify slower, safer play?
- Should one or two central tickets be softened further, or is the current balance acceptable for a first playtest draft?

## Log Source

- Full raw log: `/tmp/hudson-hustle-agent-vs-agent-log.md`

## Additional Run

### Seed `1337`

- Final score: `Blue 24`, `Red 33`
- Winner: `Red`
- Game length: `43` turns plus final scoring

Notable differences from seed `42`:

- `Red` found a cleaner outer-to-central bridge and used `Flushing`, `Exchange Place`, and `World Trade` more effectively.
- `Blue` drew a weaker ticket mix for its central plan and never fully converted `Newark / Downtown Brooklyn` pressure into enough score.
- This run looks more balanced than seed `42`, which is useful because it shows the map is not always a central blowout.

Raw log:

- `/tmp/hudson-hustle-agent-vs-agent-log-seed-1337.md`
