# V2 Status

## Summary
`V2` is now in active implementation, and `v2.0` has cleared its first manual staging validation pass.

The core architecture is in place:
- separate-device multiplayer shell exists
- authoritative backend exists
- released-map room setup exists
- reconnect credentials exist
- staging/production deployment paths exist

The remaining work is mostly validation and hardening, not first-principles architecture.

## Done
- `apps/server` authoritative backend exists:
  - Fastify HTTP API
  - Socket.IO realtime channel
  - room create / join / rejoin / start
  - public/private state projection
- `apps/web` has multiplayer setup and lobby flow
- released config selection works for multiplayer rooms
- turn timer exists, with:
  - untimed default
  - server-owned timeout handling
  - restart-safe deadline persistence
  - client-side live countdown display
- reconnect model is defined and implemented around:
  - `roomCode`
  - `seatId`
  - `playerSecret`
- `connected` presence is tied to websocket subscription lifecycle
- production and staging platform paths are prepared:
  - `Vercel` frontend
  - `Railway` backend
  - `Railway Postgres`
- branch strategy is set:
  - `main`
  - `develop`
  - working branches
- CI is active
- `develop` manual staging validation completed on `2026-04-02`:
  - deployed preview loaded
  - room create / join / ready / start worked
  - realtime lobby presence recovered in manual browser testing
  - multiplayer game flow was playable on deployed staging

## V2.0 Still Missing
These are the main gates before `v2.0` should be treated as complete.

### 1. Promote Toward Main
- prepare `develop -> main` promotion once the current staging result is accepted
- after merge to `main`, confirm:
  - `Vercel` production updated
  - `Railway` `api` updated
  - production `/health` is healthy

### 2. Remote Multi-Device Validation
- complete at least one real remote game flow with:
  - two browsers on separate devices
  - deployed frontend + deployed backend
- confirm there is no environment-only desync or CORS/session issue

### 3. Multiplayer Hardening
- improve error states and UX around:
  - invalid room code
  - wrong credentials
  - seat already taken
  - socket failure after HTTP rejoin
  - backend restart / reconnect recovery

### 4. Production-Side Observation
- watch the first production deploy for:
  - realtime handshake regressions
  - preview/prod env drift
  - unexpected platform-only behavior

## Current Interpretation
- staging confidence is now materially better than before
- manual staging testing has passed
- final production promotion is still pending
- `v2.0` should be treated as late-stage integration work, not fully closed

## Explicitly Not In V2.0
- public bot seats
- `human+agent`
- autonomous agent seats
- spectator mode
- account system
- chat
- matchmaking

## Recommended Next Order
1. Record the successful staging smoke result
2. Decide whether to promote `develop -> main`
3. After merge to `main`, run production deploy checks
4. Complete one more real remote multiplayer session on production
5. Only then decide whether `v2.0` should be called complete
