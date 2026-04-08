# Hudson Hustle Tech Spec

## Architecture
- `apps/web`: React + TypeScript + Vite client for same-laptop play and separate-device multiplayer UI.
- `apps/server`: Fastify + Socket.IO authoritative backend for rooms, reconnect, realtime sync, and multiplayer validation.
- `packages/game-core`: pure rules engine with deterministic reducers, shared multiplayer transport types, and seeded randomness.
- `packages/game-data`: NYC/NJ board layout, routes, tickets, tuning constants, and released-config registry data.

## Runtime Split
- `V1` runs entirely through `apps/web`, using the shared rules engine locally.
- `V2` keeps gameplay rules in `packages/game-core`, but moves room lifecycle and authoritative state ownership into `apps/server`.
- Clients submit intent; the server validates and broadcasts resulting public/private projections.
- `V2.2` extends the room model so a seat can be owned either by a client controller or by a server-owned `bot` controller.
- `V2.2` Slice 2 exposes that controller distinction in normal multiplayer room setup through seat-oriented `bot` assignment for non-host seats.
- `V2.2` Slice 3 strengthens the built-in deterministic bot with coherent ticket-keep, route-demand claim selection, and color-demand draw heuristics while keeping the same authoritative action path.
- `V2.2` Slice 4 hardens mixed-room lifecycle behavior so timed human turns, persisted-room restore, and reconnect flows can hand off cleanly through server-owned bot seats.
- `V2.2` Slice 5 freezes the first public system-player milestone and keeps `bot`, `agent`, `human+agent`, `seat`, and `controller` terminology explicit.
- `packages/game-data` remains the shared source for released maps and balance data across both `web` and `server`.

## State Model
- `GameState` contains players, route claims, station placements, public market, decks, score state, turn state, RNG state, and final-round bookkeeping.
- `GameAction` drives all rules changes through a single reducer.
- UI-only reveal state stays in the web app so the core remains serializable and reusable in v2.

## Key Rules Decisions
- `35` trains per player.
- `3` stations per player.
- Initial setup: one long ticket plus three regular tickets, keep at least two.
- Standard route scoring curve: `1, 2, 4, 7, 10, 15`.
- Final round triggers when a player ends a turn with `<= 2` trains.
- Longest route bonus uses owned routes only.
- Unused stations award endgame points.

## Data Layout
- `MapConfig` stores cities, coordinates, routes, and bonus settings.
- `RouteDef` stores endpoints, length, route color, route type, ferry locomotive requirement, and optional twin-group membership.
- `TicketDef` stores id, endpoints, points, and bucket (`long` or `regular`).
- Board map work uses a layered model:
  - `lat/lon` remains reference truth for station authority binding
  - `boardX/boardY` is the shipped board layout source of truth
  - `x/y` is the runtime board position derived from that board layout
  - route `waypoints` handle dense corridor shaping, mirrored twin-route geometry, and any additional route harmonization needed for a clean board
  - backdrop water/coastline features are optional supporting art, not the primary layout engine

## Config Versioning Spec
- Use `configs/hudson-hustle/` as the home for versioned game-design snapshots.
- Do not flatten Hudson Hustle config snapshots directly into `configs/`; the product name should own its own namespace so future maps or sibling games do not collide.
- The config versioning goal is not just Git history. It should preserve named, discussable gameplay snapshots:
  - which stations were active
  - which routes existed
  - what each ticket scored
  - what rules values were in force
  - why that version existed

### Directory Layout
- `configs/hudson-hustle/current.json`
  - Points to the currently active config snapshot.
- `configs/hudson-hustle/drafts/`
  - Holds unfinished or exploratory working configs.
- `configs/hudson-hustle/releases/`
  - Holds frozen, reviewable snapshots that should stay stable once named.

### Draft Layout
- `configs/hudson-hustle/drafts/current-working/`
  - The main working draft while the map is evolving.
- A draft folder should contain:
  - `meta.json`
  - `map.json`
  - `tickets.json`
  - `rules.json`
  - `visuals.json`
  - `notes.md`

### Release Layout
- Example:
  - `configs/hudson-hustle/releases/v0.1-anchor-prototype/`
  - `configs/hudson-hustle/releases/v0.2-chelsea-williamsburg/`
  - `configs/hudson-hustle/releases/v0.3-atlantic-hoboken/`
- A release folder should contain the same file set as a draft:
  - `meta.json`
  - `map.json`
  - `tickets.json`
  - `rules.json`
  - `visuals.json`
  - `notes.md`

### File Responsibilities
- `meta.json`
  - `id`
  - `version`
  - `basedOn`
  - `status` such as `draft`, `playtest`, `released`, or `deprecated`
  - `createdAt`
  - `summary`
  - `designGoals`
- `map.json`
  - active stations
  - board coordinates
  - label placement
  - route list
  - twin groups
  - route geometry such as waypoints
- `tickets.json`
  - long tickets
  - regular tickets
  - point values
- `rules.json`
  - `trainsPerPlayer`
  - `stationsPerPlayer`
  - `stationValue`
  - `longestRouteBonus`
  - any future rules toggles or map-specific knobs
- `notes.md`
  - why this version exists
  - what changed from the parent version
  - known issues
  - what the next playtest or review should focus on
- `visuals.json`
  - backdrop art data
  - card and player palettes
  - visual style metadata for the active board snapshot
  - explicit `theme`, `backdropMode`, and `boardLabelMode`

### JSON Shapes
- `current.json`
  - purpose: one moving pointer to the active config
  - shape:

```json
{
  "schemaVersion": 1,
  "gameId": "hudson-hustle",
  "activeConfigId": "current-working",
  "activeConfigPath": "configs/hudson-hustle/drafts/current-working",
  "mode": "draft"
}
```

- `meta.json`
  - purpose: release identity, authorship, parentage, and intent
  - required fields:

```json
{
  "schemaVersion": 1,
  "id": "current-working",
  "gameId": "hudson-hustle",
  "version": "draft",
  "status": "draft",
  "basedOn": null,
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "YYYY-MM-DD",
  "sourceSync": {
    "method": "manual",
    "sourceModule": "packages/game-data/src/index.ts",
    "sourceExport": "hudsonHustleMap",
    "syncedAt": "YYYY-MM-DD"
  },
  "summary": "Short one-line summary",
  "designGoals": [],
  "changeSummary": [],
  "playtestFocus": []
}
```

- `map.json`
  - purpose: exact board geometry and active route graph
  - required top-level fields:

```json
{
  "schemaVersion": 1,
  "mapId": "hudson-hustle-working-map",
  "name": "Hudson Hustle Working Map",
  "board": {
    "width": 1200,
    "height": 900,
    "padX": 90,
    "padY": 90
  },
  "stations": [],
  "routes": []
}
```

  - station shape:

```json
{
  "id": "world-trade",
  "name": "World Trade",
  "label": "World Trade",
  "active": true,
  "tier": "anchor",
  "lat": 40.712603,
  "lon": -74.0095515,
  "boardX": 532,
  "boardY": 430,
  "labelPreset": "left-near",
  "labelDx": -20,
  "labelDy": 6,
  "labelAnchor": "end",
  "authorityRef": {
    "source": "panynj-path-official",
    "reference": "World Trade Center PATH / Oculus",
    "sourceUrl": "https://example.com"
  },
  "notes": []
}
```

  - `labelPreset` is optional metadata for human editing convenience.
  - the actual rendering truth is `labelDx`, `labelDy`, and `labelAnchor`.

  - route shape:

```json
{
  "id": "exchange-place-world-trade-a",
  "from": "exchange-place",
  "to": "world-trade",
  "length": 2,
  "color": "gray",
  "type": "tunnel",
  "locomotiveCost": 0,
  "twinGroup": "exchange-world",
  "waypoints": [
    { "x": 436, "y": 328 },
    { "x": 496, "y": 380 }
  ],
  "notes": []
}
```

- `tickets.json`
  - purpose: all ticket definitions for one snapshot
  - required shape:

```json
{
  "schemaVersion": 1,
  "ticketSetId": "hudson-hustle-working-tickets",
  "long": [],
  "regular": []
}
```

  - ticket shape:

```json
{
  "id": "t-world-trade-downtown-brooklyn",
  "from": "world-trade",
  "to": "downtown-brooklyn",
  "points": 8,
  "notes": []
}
```

- `rules.json`
  - purpose: map-scoped tunable rules values
  - required shape:

```json
{
  "schemaVersion": 1,
  "rulesetId": "hudson-hustle-working-rules",
  "trainsPerPlayer": 24,
  "stationsPerPlayer": 3,
  "stationValue": 4,
  "longestRouteBonus": 10,
  "routeScoreTable": {
    "1": 1,
    "2": 2,
    "3": 4,
    "4": 7,
    "5": 10,
    "6": 15
  },
  "notes": []
}
```

- `visuals.json`
  - purpose: board-level visual behavior and snapshot-specific theming
  - required shape:

```json
{
  "schemaVersion": 1,
  "visualSetId": "hudson-hustle-working-visuals",
  "boardStyle": "graph-first-transit-nostalgia",
  "theme": "warm-transit-nostalgia",
  "backdropMode": "minimal",
  "boardLabelMode": "station-only",
  "backdrop": {
    "landAreas": [],
    "waterAreas": [],
    "shorelines": [],
    "regionLabels": []
  },
  "palettes": {
    "cards": {},
    "players": {}
  },
  "notes": []
}
```

  - `theme` names the overall visual direction for the snapshot.
  - `backdropMode` controls how much geographic/base-art treatment the board should render:
    - `full`
    - `muted`
    - `minimal`
    - `none`
  - `boardLabelMode` controls whether the board emphasizes only station labels or also larger region labels:
    - `full-region-labels`
    - `station-only`
    - `minimal-region-labels`
  - runtime UI should consume these values directly rather than treating them as passive metadata

### Naming Rules
- station ids should stay stable once introduced
- route ids should be endpoint-based where possible:
  - `from-to`
  - `from-to-a`
  - `from-to-b`
- ticket ids should stay endpoint-based and prefixed with `t-`
- release folders should use human-readable milestone names, not dates alone
- draft ids may move quickly, but release ids should be treated as permanent references

### Versioning Rules
- Use `drafts/` for ongoing experimentation.
- Promote a draft into `releases/` only when it is coherent enough to review or playtest as a named version.
- Once a release snapshot is created, treat it as frozen. Do not silently mutate it later.
- New work should branch from a draft copied from the most relevant release or prior draft.
- `current.json` should be the only moving pointer; release folders should not move.
- Use `pnpm config:switch <config-id>` to move the active pointer between existing draft/release snapshots.
- Use `pnpm config:switch --list` to inspect available config ids and the current active pointer.
- Use `pnpm config:preview <config-id>` to inspect one snapshot without changing `current.json`.
- Use `pnpm config:release <draft-id> <release-id> <version>` to promote a draft into a frozen release snapshot.
- Use `pnpm config:registry` after adding or renaming snapshot folders.
- Use `pnpm config:export` to refresh `drafts/current-working` from the current runtime data and regenerate the registry.

### Incremental Map Workflow
- Config evolution should follow the same anchor-wave logic as the board design process.
- Start from a small anchor set and record that state as a real snapshot.
- Add first-ring or outer-ring stations in controlled waves.
- For each wave:
  - update only the affected local cluster first
  - rebalance station placement and route geometry locally
  - record the reason in `notes.md`
- If a user proposes many new stations at once, first convert that request into:
  - anchor set
  - second wave
  - later waves

### Board-Design Recording Rules
- Each snapshot should preserve enough data to recreate the shipped board exactly.
- Board coordinates are the rendering truth; lat/lon remains reference truth only.
- Label placement belongs in the config snapshot, not as an undocumented UI tweak.
- Route geometry belongs in the config snapshot, including intentional curvature or mirrored twin-route structure.
- A dedicated label-only polish pass should be allowed before release:
  - do not move stations
  - do not change routes
  - only clean labels into nearby empty space

### Why This Matters
- The snapshot system should answer questions like:
  - when did `Chelsea` enter the map
  - when was `Downtown Brooklyn -> Jamaica` split by `Atlantic Terminal`
  - what point value did a ticket have in a specific playtest version
  - which config should be the baseline for a different city or region
- This also gives the designer and engineer a shared artifact for review that is clearer than reading one large `index.ts` diff.

## Cartography Pipeline
- Projection helpers live in `packages/game-data/src/cartography.ts`.
- Region maps should start from real station coordinates, but final boards are graph-first and may distort heavily for readability.
- Use anchor waves and local rebalance before adding first-ring and outer stations.
- If map bounds or station inventory change, update the local anchor cluster first, then revisit route geometry and labels.
- See `docs/map/cartography-workflow.md` for the reusable region-map process.

## Rendering
- Use SVG for the board and route hit targets.
- Keep route geometry and labels in data instead of hardcoding them in components.
- Use CSS tokens for colors, spacing, radius, shadows, and typography hooks.
- Board rendering should respond to snapshot-level visual config:
  - `backdropMode` controls how much backdrop land/water/shoreline art is rendered
  - `boardLabelMode` controls whether region labels are hidden, reduced, or fully rendered
- Visible routes should be rendered as segmented path slices, not a continuous visible rail underlay.
- Each segment should reuse one canonical route slice for all visible layers:
  backplate, color fill, and claim highlight.
- Claimed routes should render an ownership-specific stitched centerline inside the player-colored segment.
- Curved routes should use curve-aware segment sampling so each piece follows the route bend.
- Segment gap, outer padding near stations, and sampling density should be curvature-aware.
- Double routes should default to mirrored split/merge geometry from station centers.
- Waypoint count is not itself a quality metric; use as many waypoint controls as needed to make the board more harmonic, legible, and non-intersecting.
- Label placement is part of board rendering, not a final cosmetic pass; labels should move into nearby empty space before route geometry becomes more complex.

## Persistence
- Serialize the entire `GameState` to local storage.
- Include a schema version on saved payloads so future migrations are possible.

## Testing
- `Vitest` covers rules, scoring, serialization, and deterministic random flows.
- `Playwright` covers local handoff flow, hidden-info transitions, and endgame summary.
- Core tests should use fixed seeds for reproducibility.

## Collaboration Boundaries
- Shared edits are expected in `game-core` and `game-data`.
- Rules changes require test updates or a written balance reason.
- UI should consume legal actions and derived state from the core instead of reconstructing rules ad hoc.

## V2 Backend Plan
- Add `apps/server` with `Node.js`, `Fastify`, `Socket.IO`, `PostgreSQL`, and `Drizzle`.
- Server becomes the authority for deck order, ticket draws, route claims, and private state.
- Clients receive public state plus their own private hand and ticket state.
- Frontend hosting target: `Vercel`.
- Backend hosting target: `Railway`.
- Initial persistence target: room snapshot storage in `Postgres`, with optional action-log support.

### V2 MVP Room And Identity Model
- A room has one active game.
- Players join with:
  - room code
  - seat assignment
  - player secret
- Reconnect should work after refresh without requiring a full account system.
- The room creator chooses:
  - player count
  - config id from released snapshots
  - per-turn timer in seconds
- The default turn timer is `0`, meaning no timer.
- Released config ids should be the only multiplayer map choices exposed in MVP2.
- A player's own reconnect token should be visible through a low-prominence reveal control, not permanent full-screen chrome.
- The reconnect token should be versioned and opaque-ish, for example `hh1.<base64url(json)>`, so the client can recover room code, seat id, and player secret without exposing each field in the UI.

### V2 Seat / Controller Model
Seats and controllers should be modeled separately from the beginning.

- `seat`
  - one stable player position in a room
- `controllerType`
  - `human`
  - `bot`
  - `agent`
  - `human+agent`
- `controllerState`
  - client-owned seats authenticate with `playerSecret`
  - server-owned bot seats do not expose reconnect credentials and act through server-owned controller state

Rules by phase:
- `V2 MVP`
  - ship only `human`
- `V2.2`
  - ship public mixed human/`bot` rooms through normal setup
  - keep `bot` seats server-owned and non-reconnectable
  - keep the first bot path limited to the bot seat's public/private projection
- `MVP3`
  - support `human+agent` before full autonomous `agent`

### Why `human+agent` Comes Before `agent`
- the human still confirms the move
- the agent can provide guidance without owning game fairness
- this is better for teaching, assisted play, and gradual trust

### Suggested Server Responsibilities
- room lifecycle
- player seat mapping
- legal action validation
- private/public state projection
- reconnect and resume
- timer ownership and timeout resolution

### Suggested Client Responsibilities
- render public board state
- render seat-specific private state
- submit action intents only
- recover the session from room code plus player secret
- expose reconnect credentials in a subtle hover/click reveal affordance

### Suggested HTTP Surface
- `POST /rooms`
- `POST /rooms/:roomCode/join`
- `POST /rooms/:roomCode/rejoin`
- `POST /rooms/:roomCode/start`
- `GET /rooms/:roomCode`

### Suggested WebSocket Events
- client to server:
  - `room:subscribe`
  - `player:ready`
  - `game:action`
- server to client:
  - `room:update`
  - `game:update:public`
  - `game:update:private`
  - `game:error`
  - `game:timer`
  - `game:reconnected`

- See `docs/product/v2/v2-mvp-architecture.md` for the fuller phase plan.
- See `docs/product/v2/v2-multiplayer-flow.md` for the room UX, reconnect model, and initial API examples.
