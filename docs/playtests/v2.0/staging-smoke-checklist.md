# V2.0 Staging Smoke Checklist

Run this on the deployed `develop` environment after meaningful multiplayer merges.

## Latest Result
- `2026-04-02`: passed on `develop`
- validated manually on deployed staging after the realtime handshake fix
- confirmed:
  - frontend preview loaded
  - room create / join worked
  - connected badges recovered from `Offline`
  - ready / start worked
  - multiplayer game flow was playable

## Backend
- staging backend `/health` returns `200`
- released configs list is correct

## Frontend
- staging frontend loads without a blank screen
- create/join UI is visible

## Room Lifecycle
- create room succeeds
- second client can join
- ready/start succeeds

## Multiplayer Flow
- each seat only sees its own hand and tickets
- public board state matches on both clients
- drawing two cards works
- end turn hands control to the next player

## Recovery
- refresh reconnects to the same seat
- invalid credentials show a real error state
- lobby connected badge tracks websocket presence correctly

## Timer
- untimed room stays untimed
- timed room shows the configured timeout
- timer countdown appears active during play
- timeout does not deadlock the room

## Maps
- `v0.3-atlantic-hoboken` can start
- `v0.4-flushing-newark-airport` can start
