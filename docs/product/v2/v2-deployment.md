# V2 Deployment

## Hosting Split
- frontend: `Vercel`
- backend: `Railway`
- database: `Railway Postgres`

## Branch and Environment Model
Use a three-level git flow:

- `main`
  - stable production branch
  - production branch
  - deploys via platform-native Git integration
- `develop`
  - shared integration branch
  - staging branch
  - deploys via platform-native Git integration
- working branches
  - short-lived feature branches from `develop`
  - open PRs back into `develop`
  - run CI only
  - do not auto-deploy to production

Recommended promotion path:
1. branch from `develop`
2. merge into `develop`
3. validate on staging and preview
4. merge `develop` into `main`
5. let production deploy from `main`

## Post-Merge Verification
These checks should run by default after merges, not only when someone remembers to ask.

### After Merge To `develop`
Use platform CLIs to verify the staging path:
- check `Vercel` preview deployment status for `develop`
- check `Railway` deployment status for `api-develop`
- check staging backend health:
  - `curl https://api-develop-develop.up.railway.app/health`

### After Merge To `main`
Use platform CLIs to verify the production path:
- check `Vercel` production deployment status
- check `Railway` deployment status for `api`
- check production backend health:
  - `curl https://api-production-226b.up.railway.app/health`

## GitHub Actions
This repo keeps GitHub Actions for CI only:

- [.github/workflows/ci.yml](/Users/djfan/Workspace/HudsonHustle/.github/workflows/ci.yml)
  - runs on pushes to `main` and `develop`
  - runs on PRs targeting `main` or `develop`
  - installs dependencies, runs `pnpm test`, then `pnpm build`

Deployments are handled by the hosting platforms directly, not by GitHub Actions.

## Frontend
The web app is deployed from the repo root with [vercel.json](/Users/djfan/Workspace/HudsonHustle/vercel.json).

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

Recommended preview values for `develop`:
- `VITE_API_BASE_URL=https://<your-railway-develop-domain>`
- `VITE_WS_URL=https://<your-railway-develop-domain>`

### Vercel Git Deployment
Current state:
- project: `hudson-hustle`
- connected repo: `hudsonrivercrossing/HudsonHustle`
- production env values exist
- `develop` branch preview env values exist

Recommended branch behavior:
- production branch: `main`
- preview deployments: `develop` and PR branches

Current configured staging backend for `develop` preview:
- `VITE_API_BASE_URL=https://api-develop-develop.up.railway.app`
- `VITE_WS_URL=https://api-develop-develop.up.railway.app`

Because deployment is platform-native, GitHub Actions secrets for Vercel are no longer required.

## Backend
The server is deployed from the repo root with [railway.json](/Users/djfan/Workspace/HudsonHustle/railway.json).

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

Recommended develop values:
- `PORT` is managed by Railway
- `CORS_ORIGIN=https://<your-vercel-preview-domain>`
- `DATABASE_URL=<Railway Postgres connection string for the develop environment>`

### Railway Native Deployment
Current state:
- project: `hudson-hustle`
- production environment: `production`
- staging environment: `develop`
- production service: `api`
- staging service: `api-develop`
- current staging backend domain:
  - `https://api-develop-develop.up.railway.app`

Recommended branch behavior:
- `main` deploys to production service/environment
- `develop` deploys to staging service/environment

The Railway CLI let us create the staging environment, database, service, and domain, but branch-to-service Git deployment settings are still best verified in the Railway dashboard because CLI coverage there is limited.

Because deployment is platform-native, GitHub Actions secrets for Railway are no longer required.

### One-Time Railway Setup
1. Keep the existing `production` environment for `main`.
2. Create a second environment named `develop`.
3. Create a dedicated backend service for staging:
   - recommended name: `api-develop`
4. Create or attach a database in the `develop` environment.
5. Set `CORS_ORIGIN` on `api-develop`.
   - recommended: `https://*.vercel.app,http://127.0.0.1:5173,http://127.0.0.1:5174`
6. Give `api-develop` its own public domain.
   - current staging backend: `https://api-develop-develop.up.railway.app`

## Local Development
Copy env examples as needed:
- [apps/server/.env.example](/Users/djfan/Workspace/HudsonHustle/apps/server/.env.example)
- [apps/web/.env.example](/Users/djfan/Workspace/HudsonHustle/apps/web/.env.example)
- [.env.example](/Users/djfan/Workspace/HudsonHustle/.env.example)

Run:
```bash
pnpm dev:server
pnpm dev:web
```

Defaults:
- web: `http://127.0.0.1:5173`
- server: `http://127.0.0.1:8787`
- local CORS examples also allow `http://127.0.0.1:5174` for Vite fallback-port sessions

## First Branch-Based Deployment Checklist
1. Create the `develop` branch in GitHub.
2. Confirm the Vercel project is linked to this repo.
3. Confirm the Railway project contains:
   - `production` environment
   - `develop` environment
   - `api` service for production
   - `api-develop` service for staging
4. In Vercel, confirm:
   - production branch is `main`
   - preview deploys are enabled for `develop` and PR branches
5. In Railway, confirm:
   - production service/environment correspond to `main`
   - staging service/environment correspond to `develop`
6. Push a small commit to `develop` and confirm:
   - CI passes
   - Vercel preview deploy succeeds
   - Railway develop deploy succeeds
7. Merge `develop` into `main` and confirm:
   - production deploy succeeds on both platforms
   - `GET /health` succeeds on the production backend
   - room creation still works end-to-end

## Quick Setup Walkthrough
If you are setting this up for the first time, use this exact order:

1. Create and push `develop` from the current `main`.
2. In GitHub `Settings` -> `Branches`, consider adding protection rules for:
   - `main`
   - `develop`
3. In Vercel:
   - connect the GitHub repo
   - confirm production branch is `main`
   - confirm preview deploys are available for `develop` and PR branches
   - set:
     - production `VITE_API_BASE_URL` / `VITE_WS_URL`
     - preview `develop` `VITE_API_BASE_URL` / `VITE_WS_URL`
4. In Railway:
   - create a `develop` environment
   - create `api-develop`
   - attach its database
   - set `CORS_ORIGIN`
   - give it a stable domain if desired
5. In Railway's Git settings, map:
   - `main` -> production service/environment
   - `develop` -> staging service/environment
6. Push a small commit to `develop`.
7. Confirm:
   - GitHub Actions `CI` passes
   - Vercel preview deploy succeeds
   - Railway staging deploy succeeds
8. Confirm `develop` deploys to staging and preview successfully before using it as the integration branch.
