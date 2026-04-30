# Hudson Hustle Guidebook Script

This file defines the current in-app `Guide` flow. The guide is a compact rulebook, not the old first-run tutorial.

## Entry Points
- Main gateway `GUIDE_` tile.
- Active local game board topbar.
- Active online game board topbar.
- Local setup `Guide` button.

The guide exits with `Back` and returns to the surface that opened it. It does not change `game-core`, room, timer, bot, or reconnect state.

## Step Order
1. Win the table
2. Take one action
3. Follow your secret plan
4. Turn cards into routes
5. Claimed routes close
6. Check tunnels and ferries
7. Rescue one connection
8. Watch the table close
9. Bots play the same rules

## Copy Rules
- One rule idea per card.
- Teach objective and turn structure before exceptions.
- Prefer player verbs: claim, draw, connect, borrow, pass, score.
- Avoid software-tour language and UI target callouts.
- Keep all copy readable without seeing a full board or sidebar.

## UI Rules
- No sidebar navigation.
- Use previous/next arrows and compact progress text.
- Use a narrow pocket-rulebook surface over the station backdrop.
- Use Fraunces for the guide title and major step headline only.
- Use IBM Plex Sans for body, labels, progress, and controls.
- Small glyphs may support the rule, but should not become decorative illustrations.
