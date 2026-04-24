# Hudson Hustle Onboarding Script

This file defines the shipped `v1.1` guided tutorial flow.

## Step Order
1. Setup table
2. Public board
3. Private hand and tickets
4. Transit market
5. Route types: normal, tunnel, ferry
6. Stations as endgame rescue tools
7. Action rail
8. Round table pressure
9. Pass-and-play handoff

## Copy Rules
- Keep the copy short, player-facing, and non-technical.
- Explain one concept per step, then reinforce it with a few key points.
- Tell the player where to look and what to try.
- Reuse terminology from `docs/gameplay/player-guide.md`.
- The tone should feel like a friendly board-game teach, not a software tour.

## UI Rules
- The tutorial auto-opens for first-time visitors and can also open from setup or from the live game.
- In the live game, the active step highlights the matching interface region.
- The tutorial never changes `game-core` state by itself.
- The route-types step should explain risk and payment shape, not just labels.
- The station step should clearly say stations matter at endgame ticket scoring, not during route claiming.
- The final step explains the `I'm done` to `I'm ready` handoff flow.
- Returning players must be able to skip it immediately.

## Teaching Goals By Step
1. Setup table
  - explain player count, names, and private starting tickets
2. Public board
  - teach that routes, crossings, and choke points are public information
3. Private hand and tickets
  - separate resources from secret goals
4. Transit market
  - teach the normal draw rhythm and locomotive market rule
5. Route types
  - explain the difference between normal routes, tunnels, and ferries
6. Stations
  - explain cost growth, endgame borrowing, and unused-station bonus tension
7. Action rail
  - show where legal moves and payments are confirmed
8. Round table pressure
  - explain trains left, open routes, stations left, ticket counts, and endgame pressure
9. Pass-and-play handoff
  - reinforce the social rhythm of one shared laptop
