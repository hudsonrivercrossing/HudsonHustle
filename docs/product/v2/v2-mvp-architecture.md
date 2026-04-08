# V2 MVP Architecture

## Goal
Deliver the smallest separate-device multiplayer version of Hudson Hustle that preserves the current rules while moving hidden information and turn validation to an authoritative backend.

## Product Shape
- Frontend: `Vercel`
- Backend: `Railway`
- Database: `Railway Postgres`

This split keeps the static client cheap and easy to deploy while the backend handles rooms, reconnect, and private information.

## MVP2 Scope
- `2-4` human players on separate devices
- room create / join / ready / start
- authoritative turn validation
- private hand and ticket state per player
- reconnect after refresh
- resume an in-progress room

## Explicit Non-Goals
- matchmaking
- spectator mode
- social login
- difficulty tiers for `bot` seats
- user-supplied agents
- chat, voice, or emotes

## Core Runtime Model

### Server
The server is the authority for:
- deck order
- ticket draws
- legal action validation
- route claims
- scoring and endgame triggers
- private/public state projection

### Client
The client is responsible for:
- rendering public state
- rendering the current player's private state
- collecting player intents
- reconnecting and restoring the seat session

### Shared Rules
`packages/game-core` remains the source of truth for:
- reducer logic
- scoring
- legal action structure
- deterministic rules behavior

## Room Model
- one room hosts one game
- each room has a short room code
- each client-controlled seat has a stable player secret
- a server-owned seat may have no client auth secret at all
- the room may have a host for setup flow, but game continuity must not depend on the host staying connected

## Reconnect Model
Recommended MVP identity flow:
- room code
- seat assignment
- one reconnect token stored locally on the device, using a versioned opaque format such as `hh1.<base64url(json)>`

This is enough for:
- refresh recovery
- brief disconnect recovery
- avoiding a full account system in MVP2

## Seat / Controller Model
The server should model seats separately from controllers from the beginning.

### Seat
A seat is a stable player position in a room.

### Controller Types
- `human`
- `bot`
- `agent`
- `human+agent`

### MVP2 Rule
- only `human` is active in shipped MVP2 rooms

### V2.2 Shipped Rule
- public mixed human/`bot` rooms are now part of shipped `v2.2`
- `bot` seats stay server-owned and route through the same authoritative action path as human seats
- `bot` seats see only the same public/private projection their seat should see
- `bot` seats do not expose reconnect credentials

### MVP3 Direction
- add `human+agent` first
- full `agent` controllers come later

## Why `human+agent` Matters
`human+agent` is the most useful early agent mode because:
- the player still owns the final move
- the agent can explain options and risks
- it helps onboarding and assisted play
- it avoids many fairness concerns of a fully autonomous agent

## Backend Components
- `apps/server`
  - HTTP routes for room lifecycle and snapshot fetch
  - WebSocket transport for turn-by-turn updates
- `packages/game-core`
  - shared rules and validation
- `Postgres`
  - room records
  - player seat records
  - game snapshots and/or action log

## Suggested First API Surface

### HTTP
- `POST /rooms`
- `POST /rooms/:roomCode/join`
- `POST /rooms/:roomCode/rejoin`
- `GET /rooms/:roomCode`

### WebSocket
- connect with room code + player secret recovered from the reconnect token in the UI
- submit action intent
- receive authoritative state updates
- receive private state payload for that seat only

## Persistence Strategy
Keep MVP2 simple:
- store a current room snapshot
- optionally append a lightweight action log

Do not start with a fully elaborate event-sourced system unless reconnect and debugging clearly require it.

## Deployment Recommendation

### Frontend
- deploy `apps/web` to `Vercel`
- expose `VITE_API_BASE_URL`
- expose `VITE_WS_URL`

### Backend
- deploy `apps/server` to `Railway`
- attach `Railway Postgres`

## Milestones

### MVP2
1. local dev room + two browsers
2. authoritative multiplayer full turn loop
3. `2-4` player room support
4. reconnect and resume
5. hosted end-to-end deployment

### V2.2 System Player Milestone
1. public mixed human/`bot` room setup
2. one deterministic competent baseline `bot` policy
3. hardened timer, reconnect, and persistence behavior for mixed rooms

### Current V2.2 Freeze
- room state now distinguishes:
  - client-owned seats authenticated by `playerSecret`
  - server-owned `bot` seats with no reconnect secret
- public mixed rooms can assign any number of non-host seats as `bot` up to room size
- the shipped `bot` path submits normal legal actions through the authoritative room service
- the current deterministic baseline handles:
  - initial ticket confirmation
  - coherent ticket keeps
  - route-demand claim prioritization
  - deterministic draw decisions aimed at near-term claims
- mixed-room lifecycle is hardened for:
  - timed human-to-bot handoff
  - persisted-room resume with a `bot` active seat
  - explicitly human-only reconnect semantics

### MVP3
1. `human+agent` assisted seats
2. optional autonomous `agent` seats
3. external agent integration model
