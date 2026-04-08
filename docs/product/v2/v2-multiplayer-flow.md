# V2 Multiplayer Flow

## Purpose
This document turns the `V2 MVP` product direction into concrete multiplayer UX, API shape, and reconnect behavior.

## Room UX

### Create Room
The host sees:
- player count selector
- map selector
- per-turn timer selector

Recommended defaults:
- player count: `2`
- map: latest stable release
- per-turn timer: `0`

Timer meaning:
- `0` = untimed
- positive values = turn deadline in seconds

### Map Selector
MVP2 should only expose released snapshots, not drafts.

Initial options:
- `v0.3-atlantic-hoboken`
- `v0.4-flushing-newark-airport`

The player-facing UI should show:
- map display name
- short version label
- optional one-line summary

Do not expose raw config paths in the visible selector.

### Join Room
Join flow should be minimal:
- enter room code
- choose or confirm a seat
- enter nickname

The server returns:
- `roomCode`
- `seatId`
- `playerSecret`

The client should combine those values into one reconnect token for copy/paste and later recovery.

## Hidden Session Info UX
Each player should be able to inspect:
- one reconnect token that decodes to room code, seat, and player secret

Recommended format:
- versioned prefix such as `hh1.`
- opaque payload such as base64url(JSON)

But this should not live in the main gameplay surface all the time.

Recommended presentation:
- small identity chip in a corner
- click or hover reveals:
  - reconnect token
- add a copy button

This keeps reconnect information accessible without making the game screen feel operational or cluttered.

## Host Rule
The host is only responsible for:
- creating the room
- choosing setup options
- starting the game
- confirming their own starting tickets like every other player

The host is not required to stay connected for the room to remain valid.
The host should also be able to leave the lobby or room UI without being trapped in the current screen.

## Starting Ticket Selection
After the host starts the room:
- every player receives the same initial ticket choice flow
- every player may review and confirm their own starting tickets independently
- the game does not enter the main phase until every seated player has confirmed

Important UX rules:
- one player's confirmation must not reset another player's in-progress selection
- if the host confirms first, the host waits while other players finish
- reconnecting during this phase should restore either:
  - the pending ticket picker for that seat, or
  - the normal game view if that seat already confirmed

## Reconnect UX

### Automatic Reconnect
On load, the client checks local storage for:
- one reconnect token

If found:
1. try silent reconnect
2. if it succeeds, restore the room directly
3. if it fails, fall back to manual rejoin UI

### Manual Reconnect
The manual form accepts one reconnect token and decodes it client-side before calling the existing backend rejoin endpoint.

### Reconnect State Machine
Recommended states:
- `fresh`
- `attempting-reconnect`
- `reconnected`
- `reconnect-failed`
- `manual-rejoin`

## Human+Agent UX Direction
This is not in MVP2, but the room and seat model should leave room for it.

### Principle
`human+agent` means:
- the human owns the move
- the agent assists
- the agent does not auto-submit actions

### Interaction Style
The player can:
- ask questions in natural language
- request best moves
- ask for risk review
- ask whether a ticket plan is still viable

The agent can respond with:
- current board read
- top move suggestions
- tradeoffs
- warnings about choke points, tunnels, or ticket exposure

## API Shape

### HTTP

#### `POST /rooms`
Creates a room.

Request:
```json
{
  "hostName": "Blue",
  "playerCount": 3,
  "configId": "v0.4-flushing-newark-airport",
  "turnTimeLimitSeconds": 0
}
```

Response:
```json
{
  "roomCode": "M7QK",
  "seatId": "seat-1",
  "playerSecret": "secret-value",
  "room": {
    "status": "lobby"
  }
}
```

#### `POST /rooms/:roomCode/join`
Joins a free seat.

#### `POST /rooms/:roomCode/rejoin`
Rejoins with the seat id and player secret decoded from the reconnect token.

#### `POST /rooms/:roomCode/start`
Starts the game once lobby conditions are satisfied.

#### `GET /rooms/:roomCode`
Returns room snapshot and public metadata.

### WebSocket

Client sends:
- `room:subscribe`
- `player:ready`
- `game:action`

Server sends:
- `room:update`
- `game:update:public`
- `game:update:private`
- `game:error`
- `game:timer`
- `game:reconnected`

## Server Rules
- only the server owns the canonical game state
- clients send intent, not authority
- timer expiration is resolved on the server
- reconnect restores the exact seat-specific view

## MVP2.x Bot Hook
Keep controller plumbing ready for:
- `bot`

But do not expose bot seats in the public MVP UI yet.

The important design rule is:
- seat identity and room lifecycle must not assume every seat is browser-controlled forever
