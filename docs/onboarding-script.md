# Hudson Hustle Onboarding Script

This file defines the shipped `v1.1` guided tutorial flow.

## Step Order
1. Setup table
2. Public board
3. Private hand and tickets
4. Transit market
5. Action rail
6. Round table pressure
7. Pass-and-play handoff

## Copy Rules
- Keep the copy short, player-facing, and non-technical.
- Explain one concept per step, then reinforce it with a few key points.
- Tell the player where to look and what to try.
- Reuse terminology from `docs/player-guide.md`.
- The tone should feel like a friendly board-game teach, not a software tour.

## UI Rules
- The tutorial auto-opens for first-time visitors and can also open from setup or from the live game.
- In the live game, the active step highlights the matching interface region.
- The tutorial never changes `game-core` state by itself.
- The final step explains the `I'm done` to `I'm ready` handoff flow.
- Returning players must be able to skip it immediately.
