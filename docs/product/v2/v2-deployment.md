# V2 Deployment

## Hosting Split
- frontend: `Vercel`
- backend: `Railway`
- database: `Railway Postgres`

## Branch and Environment Model
One branch, one environment:

- `main`
  - the only long-lived branch
  - deploys the production frontend and backend through platform-native Git integration
- working branches
  - short-lived branches from `main`
  - open PRs back into `main`
  - run CI and get a Vercel preview without a backend

There is no staging backend. The `develop` branch and the Railway `develop` environment were removed on 2026-11-22: the staging service had been offline since June and nothing was validated there. Merging to `main` is the release.

Because a merge goes straight to production:
- the server runs its database migrations at boot and exits if they fail, so a bad migration leaves the previous deployment serving;
- Railway only switches traffic after `GET /health` answers (see `railway.json`);
- test anything that touches persistence against a disposable Postgres first (`HH_TEST_DATABASE_URL`).

## Post-Merge Verification
After every merge to `main`:
- check `Vercel` production deployment status
- check `Railway` deployment status for `api`
- check production backend health:
  - `curl https://api-production-226b.up.railway.app/health`

## GitHub Actions
This repo keeps GitHub Actions for CI only:

- [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)
  - runs on pushes to `main`
  - runs on PRs targeting `main`
  - installs dependencies, runs `pnpm test`, then `pnpm build`

Deployments are handled by the hosting platforms directly, not by GitHub Actions.

## Frontend
The web app is deployed from the repo root with [vercel.json](../../../vercel.json).

### Build
- install: `pnpm install --frozen-lockfile`
- build: `pnpm --filter @hudson-hustle/game-core build && pnpm --filter @hudson-hustle/game-data build && pnpm --filter @hudson-hustle/web build`
- output: `apps/web/dist`

### Required Vercel env vars
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

Recommended production values:
- `VITE_API_BASE_URL=https://api.<your-domain>`
- `VITE_WS_URL=https://api.<your-domain>`

Preview deployments have no API values set, so a PR preview covers local play only. To try online play from a preview, set the two variables for the Preview environment and add the preview origin to the API's `CORS_ORIGIN`.

### Vercel Git Deployment
- project: `hudson-hustle`
- connected repo: `hudsonrivercrossing/HudsonHustle`
- production branch: `main`
- preview deployments: PR branches

Because deployment is platform-native, GitHub Actions secrets for Vercel are no longer required.

## Backend
The server is deployed from the repo root with [railway.json](../../../railway.json).

### Build
- install dependencies
- build `game-core`
- build `game-data`
- build `server`

### Start
- `pnpm --filter @hudson-hustle/server start`

### Required Railway env vars
- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`

Recommended production values:
- `PORT` is managed by Railway
- `CORS_ORIGIN=https://<your-vercel-domain>`
- `DATABASE_URL=<Railway Postgres connection string>`

### Railway Native Deployment
- project: `hudson-hustle`
- environment: `production`
- services: `api` (deploys from `main`) and `Postgres`
- backend domain: `https://api-production-226b.up.railway.app`

Because deployment is platform-native, GitHub Actions secrets for Railway are no longer required.

## Local Development
Copy env examples as needed:
- [apps/server/.env.example](../../../apps/server/.env.example)
- [apps/web/.env.example](../../../apps/web/.env.example)
- [.env.example](../../../.env.example)

Run:
```bash
pnpm dev:server
pnpm dev:web
```

Defaults:
- web: `http://127.0.0.1:5173`
- server: `http://127.0.0.1:8787`
- local CORS examples also allow `http://127.0.0.1:5174` for Vite fallback-port sessions
