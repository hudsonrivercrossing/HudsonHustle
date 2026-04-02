# V2 Status

## Summary
`V2` is now in active implementation, but `v2.0 / MVP2` is not finished yet.

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

## V2.0 Still Missing
These are the main gates before `v2.0 / MVP2` should be treated as complete.

### 1. Staging Smoke Pass
- run a full `develop` multiplayer smoke pass on deployed staging
- validate:
  - create room
  - join from second client
  - ready / start
  - private info isolation
  - draw-two-card flow
  - end turn handoff
  - reconnect after refresh
  - timer behavior
  - both released maps

### 2. Merge / Promotion
- merge the current MVP2 PR into `develop`
- confirm:
  - `develop` preview frontend deploys correctly
  - `api-develop` staging backend deploys from `develop`
- only after staging is trusted should MVP2 promotion toward `main` happen

### 3. Browser-Level Regression Coverage
- current automated coverage is still mostly service-level
- add browser/E2E coverage for:
  - reconnect UX
  - private/public state separation
  - timer display and timeout behavior
  - lobby connected badge behavior

### 4. Remote Multi-Device Validation
- complete at least one real remote game flow with:
  - two browsers on separate devices
  - deployed frontend + deployed backend
- confirm there is no environment-only desync or CORS/session issue

### 5. Multiplayer Hardening
- improve error states and UX around:
  - invalid room code
  - wrong credentials
  - seat already taken
  - socket failure after HTTP rejoin
  - backend restart / reconnect recovery

## Explicitly Not In V2.0
- public bot seats
- `human+agent`
- autonomous agent seats
- spectator mode
- account system
- chat
- matchmaking

## Recommended Next Order
1. Merge current MVP2 work into `develop`
2. Run the staging smoke checklist
3. Fix any staging-only regressions
4. Add targeted E2E coverage for the highest-risk multiplayer flows
5. Only then decide whether to promote MVP2 toward `main`
