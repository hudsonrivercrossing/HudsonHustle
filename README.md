# Hudson Hustle

![Hudson Hustle Cover 1](docs/assets/readme-cover.png)

Hudson Hustle is an original NYC/NJ transit strategy game for laptop play.

`V1` is a same-laptop pass-and-play web app.
`V2` is the long-term multiplayer version where each player joins from their own laptop through an authoritative backend.

The project is inspired by route-building board games, but the branding, map, copy, and visuals are original to this repo.

## At A Glance
![Hudson Hustle Cover 2](docs/assets/readme-cover2.jpeg)
- Build a personal network across New Jersey, Manhattan, Brooklyn, and Queens.
- Collect transit cards, claim routes, complete hidden tickets, and decide when to spend stations.
- Use a lightweight handoff flow so players can safely share one laptop in `v1`.
- Keep the rules engine deterministic and reusable so `v2` can add online multiplayer cleanly.

## Quick Guide
![Hudson Hustle Cover 3](docs/assets/readme-cover3.png)

### Panel 1: Gather Cards
Draw from the face-up market or the deck. Face-up locomotives are powerful, so taking one ends that draw action immediately.

### Panel 2: Claim Routes
Spend matching cards to take a route. Gray routes accept one color set. Ferries need locomotives. Tunnels can cost extra.

### Panel 3: Chase Tickets
Your destination tickets are your secret goals. Connect the two endpoints before the game ends to score them.

### Panel 4: Pass The Laptop
When your turn is finished, click `I'm done`. The app hides your private information and shows a neutral takeover screen. The next player clicks `I'm ready`.

## Project Scope

### V1
- Browser-based local play
- `2-4` players on one laptop
- SVG board
- Tunnels, ferries, stations, hidden tickets, longest-route bonus
- Save/resume
- Written guide plus in-app onboarding

### V2
- One laptop per player
- Authoritative backend
- Separate-device private information
- Lobby, reconnect, and saved match support

## Quick Start

### Install
```bash
pnpm install
```

### Run The Web App
```bash
pnpm dev
```

### Test
```bash
pnpm test
pnpm build
pnpm test:e2e
```

If Playwright needs a browser on a new machine:

```bash
pnpm --filter @hudson-hustle/web exec playwright install chromium
```

## Tech Stack
- `pnpm` workspace
- `React + TypeScript + Vite` in `apps/web`
- `SVG` board rendering
- `Vitest` for rules tests
- `Playwright` for end-to-end flow checks
- Shared deterministic rules engine in `packages/game-core`
- Shared map and balance data in `packages/game-data`

Planned for `v2`:
- `Node.js`
- `Fastify`
- `Socket.IO`
- `PostgreSQL`
- `Drizzle`

## Repo Layout
```text
apps/
  web/           React client for local and multiplayer play
  server/        Fastify + Socket.IO authoritative backend
packages/
  game-core/     deterministic rules engine
  game-data/     cities, routes, tickets, balance data
docs/
  README.md
  product/
    prd.md
    tech-spec.md
    design-system.md
    v2/
      README.md
      v2-mvp-architecture.md
      v2-multiplayer-flow.md
      v2-deployment.md
  gameplay/
    player-guide.md
    onboarding-script.md
    agent-vs-agent-playtest.md
  map/
    cartography-workflow.md
    hudson-map-rubric.md
    map-balance-notes.md
  config/
    config-snapshot-guide.md
  planning/
    v1-status.md
  playtests/
    v0.4/
    mvp2/
  assets/
scripts/
  config/        snapshot switching, preview, export, release tooling
  playtests/     seeded playtest and simulation harnesses
.github/
  workflows/     CI automation
.codex/skills/
  roadmap-manager/
  game-balance/
  transit-cartography/
  config-snapshot-manager/
  how-to-win-hudson-hustle/
```

## Key Docs
- [Docs Index](docs/README.md)
- [Product Requirements](docs/product/prd.md)
- [Tech Spec](docs/product/tech-spec.md)
- [V2 Docs Index](docs/product/v2/README.md)
- [V2 MVP Architecture](docs/product/v2/v2-mvp-architecture.md)
- [V2 Multiplayer Flow](docs/product/v2/v2-multiplayer-flow.md)
- [V2 Deployment](docs/product/v2/v2-deployment.md)
- [V1 Status](docs/planning/v1-status.md)
- [V2 Status](docs/planning/v2-status.md)
- [Player Guide](docs/gameplay/player-guide.md)
- [Onboarding Script](docs/gameplay/onboarding-script.md)
- [Config Snapshot Guide](docs/config/config-snapshot-guide.md)
- [Design System](docs/product/design-system.md)
- [Map And Balance Notes](docs/map/map-balance-notes.md)
- [MVP2 Staging Smoke Checklist](docs/playtests/mvp2/staging-smoke-checklist.md)
- [Agent Operating Guide](AGENTS.md)

## Current Product Status
- The current active config is the frozen release `v0.4-flushing-newark-airport`.
- Same-laptop `v1` is playable and documented.
- The first playable small-map station set and the first full balance/playtest pass are complete.
- `v2` multiplayer foundation exists but is not yet complete.
- The main remaining `v2.0` work is staging validation, browser/E2E hardening, and merge/promotion through `develop`.

## Branch Strategy
- `main`
  - stable production branch
  - deploys production frontend and backend through platform-native Git integration
- `develop`
  - shared integration branch
  - deploys preview frontend and staging backend through platform-native Git integration
- working branches
  - branch off `develop`
  - open PRs into `develop`
  - promote from `develop` to `main` after staging validation

## Working In This Repo
- Keep game rules in shared code, not in React components.
- Treat `packages/game-core` and `packages/game-data` as shared ownership zones.
- Update player-facing docs when gameplay behavior changes.
- Read [AGENTS.md](AGENTS.md) before making larger changes.

## Design Direction
![Hudson Hustle Cover 4](docs/assets/readme-cover4.png)
Hudson Hustle aims for a transit-nostalgia look: warm paper, tactile route pieces, and readable geography. The UI should feel like an inviting board game, not a generic dashboard.
