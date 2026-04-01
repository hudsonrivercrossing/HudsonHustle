# Hudson Hustle PRD

## Product Summary
Hudson Hustle is an original transit strategy game for laptop play, set on a customized NYC/NJ map. The core fantasy is building a personal network across a dense, familiar metro region while navigating tunnels, ferries, stations, and contested choke points.

## Audience
- Primary: you and your friends playing locally on one laptop.
- Secondary: future online players once separate-device multiplayer exists.
- Internal: one engineer and one product designer collaborating from a shared spec.

## Vision
- Deliver a same-laptop board-game experience that feels tactile, social, and easy to teach.
- Make the NYC/NJ setting recognizable without becoming a literal transit simulation.
- Preserve the strategic tension of route planning, hidden tickets, and contested crossings.

## V1 Scope
- Browser-based app with local hosting or simple remote hosting.
- `2-4` players on one laptop.
- Full local rules loop: draw cards, claim routes, draw tickets, build stations, score routes, finish tickets, award longest route.
- Europe-style route mechanics: tunnels, ferries, stations.
- Diagrammatic map with roughly `28-32` hubs and `55-65` routes.
- Save/resume for local games.
- Written player guide.

## V1 UX Principles
- Private information is hidden through a lightweight handoff flow.
- Every turn should feel readable in under a few seconds.
- Public board state stays visible and dramatic.
- The interface should feel like a transit-flavored board game, not a utilitarian dashboard.

## Handoff Flow
1. Active player completes their turn.
2. Active player clicks `I'm done`.
3. App immediately hides all private information.
4. App shows a neutral transition screen telling the next player to take over.
5. Next player clicks `I'm ready`.
6. App reveals only that player's private information.

## V1.1 Scope
- Guided in-app onboarding tutorial.
- Further polish on turn transitions and teaching moments.

## V2 Scope
- Each player uses their own laptop.
- Authoritative backend for hidden information, room lifecycle, reconnect, and saved matches.
- Shared rules engine reused between client and server.

## Out Of Scope
- Password-protected handoff.
- Facial recognition.
- AI opponents.
- Public monetization.
- Direct reuse of Ticket to Ride art, text, or branding.

## Success Criteria
- Two people can start and finish a local game without facilitator intervention.
- Route claiming, ticket completion, and endgame scoring behave deterministically.
- Designer and engineer can change visuals without rewriting game rules.
- Players can learn the game from the written guide plus the UI alone.
