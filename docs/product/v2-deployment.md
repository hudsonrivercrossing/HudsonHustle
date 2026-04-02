# V2 Deployment

## Hosting Split
- frontend: `Vercel`
- backend: `Railway`
- database: `Railway Postgres`

## Branch and Environment Model
Use a three-level git flow:

- `main`
  - stable production branch
  - pushes trigger:
    - `Vercel` production deploy
    - `Railway` production deploy
- `develop`
  - shared integration branch
  - pushes trigger:
    - `Vercel` preview deploy
    - `Railway` develop or staging deploy
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

## GitHub Actions
This repo now includes:

- [.github/workflows/ci.yml](/Users/djfan/Workspace/HudsonHustle/.github/workflows/ci.yml)
  - runs on pushes to `main` and `develop`
  - runs on PRs targeting `main` or `develop`
  - installs dependencies, runs `pnpm test`, then `pnpm build`
- [.github/workflows/deploy.yml](/Users/djfan/Workspace/HudsonHustle/.github/workflows/deploy.yml)
  - on `main` push:
    - deploys frontend to `Vercel` production
    - deploys backend to `Railway` production
  - on `develop` push:
    - deploys frontend to `Vercel` preview
    - deploys backend to a `Railway` develop environment

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

### GitHub Secrets and Variables for Vercel
Set these in GitHub Actions:

Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Repository variables:
- `VITE_API_BASE_URL_PRODUCTION`
  - recommended: `https://api-production-226b.up.railway.app`
- `VITE_WS_URL_PRODUCTION`
  - recommended: `https://api-production-226b.up.railway.app`
- `VITE_API_BASE_URL_DEVELOP`
  - recommended: `https://api-develop-develop.up.railway.app`
- `VITE_WS_URL_DEVELOP`
  - recommended: `https://api-develop-develop.up.railway.app`

Step by step in GitHub:
1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Secrets and variables` -> `Actions`.
4. Under `Secrets`, click `New repository secret`.
5. Add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
6. Save each secret before moving to the next.
7. Switch to the `Variables` tab.
8. Add:
   - `VITE_API_BASE_URL_PRODUCTION=https://api-production-226b.up.railway.app`
   - `VITE_WS_URL_PRODUCTION=https://api-production-226b.up.railway.app`
   - `VITE_API_BASE_URL_DEVELOP=https://api-develop-develop.up.railway.app`
   - `VITE_WS_URL_DEVELOP=https://api-develop-develop.up.railway.app`

These GitHub variables are used directly by the deploy workflow, so branch deploys do not depend on Vercel Git-linked preview env settings.

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

### GitHub Secrets and Variables for Railway
Set these in GitHub Actions:

Secrets:
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`

Repository variables:
- `RAILWAY_SERVICE_NAME_PRODUCTION`
  - recommended: `api`
- `RAILWAY_SERVICE_NAME_DEVELOP`
  - recommended: `api-develop`
- `RAILWAY_ENVIRONMENT_PRODUCTION`
  - recommended: `production`
- `RAILWAY_ENVIRONMENT_DEVELOP`
  - recommended: `develop`

Step by step in GitHub:
1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Secrets and variables` -> `Actions`.
4. Under `Secrets`, click `New repository secret`.
5. Add:
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`
6. Switch to the `Variables` tab.
7. Add:
   - `RAILWAY_SERVICE_NAME_PRODUCTION=api`
   - `RAILWAY_SERVICE_NAME_DEVELOP=api-develop`
   - `RAILWAY_ENVIRONMENT_PRODUCTION=production`
   - `RAILWAY_ENVIRONMENT_DEVELOP=develop`
8. Save each variable after entering it.

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

## First Branch-Based Deployment Checklist
1. Create the `develop` branch in GitHub.
2. Add the GitHub Actions secrets and repository variables listed above.
3. Confirm the Vercel project already linked to this repo is the correct production project.
4. Confirm the Railway project contains:
   - `production` environment
   - `develop` environment
   - `api` service for production
   - `api-develop` service for staging
5. Add the Vercel URL variables in GitHub Actions variables.
6. Confirm the Railway service-name variables point to the right services.
7. Push a small commit to `develop` and confirm:
   - CI passes
   - Vercel preview deploy succeeds
   - Railway develop deploy succeeds
8. Merge `develop` into `main` and confirm:
   - production deploy succeeds on both platforms
   - `GET /health` succeeds on the production backend
   - room creation still works end-to-end

## Quick Setup Walkthrough
If you are setting this up for the first time, use this exact order:

1. Create and push `develop` from the current `main`.
2. In GitHub `Settings` -> `Branches`, consider adding protection rules for:
   - `main`
   - `develop`
3. In GitHub `Settings` -> `Secrets and variables` -> `Actions`, add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`
4. In GitHub `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`, add:
   - `VITE_API_BASE_URL_PRODUCTION=https://api-production-226b.up.railway.app`
   - `VITE_WS_URL_PRODUCTION=https://api-production-226b.up.railway.app`
   - `VITE_API_BASE_URL_DEVELOP=https://api-develop-develop.up.railway.app`
   - `VITE_WS_URL_DEVELOP=https://api-develop-develop.up.railway.app`
   - `RAILWAY_SERVICE_NAME_PRODUCTION=api`
   - `RAILWAY_SERVICE_NAME_DEVELOP=api-develop`
   - `RAILWAY_ENVIRONMENT_PRODUCTION=production`
   - `RAILWAY_ENVIRONMENT_DEVELOP=develop`
5. In Railway:
   - create a `develop` environment
   - create `api-develop`
   - attach its database
   - set `CORS_ORIGIN`
   - give it a stable domain if desired
6. In Vercel:
   - keep the project linked for production
   - let GitHub Actions inject frontend API URLs during deploy
7. Push a small commit to `develop`.
8. Confirm GitHub Actions runs:
   - `CI`
   - `Deploy`
9. Confirm `develop` deploys to staging and preview successfully before using it as the integration branch.
