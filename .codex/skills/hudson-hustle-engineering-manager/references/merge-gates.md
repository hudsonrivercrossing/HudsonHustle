# Merge Gates

Use this reference when deciding whether a Hudson Hustle branch is ready for `main`.

There is one long-lived branch. Merging to `main` deploys production; there is no staging step.

## `main` Gate
A branch is usually ready for `main` only when:
- the intended change is complete
- `pnpm typecheck`, `pnpm test` and `pnpm css:debt` pass locally, and the end-to-end tests when a flow changed
- the local build passes
- the pull request preview has been smoked in a real browser for any visible change
- server and database changes have been run against a disposable Postgres, because the preview uses the production API and does not exercise them
- any migration in the change has been read and its effect on stored data is understood
- a findings-first code review has been done
- affected docs are aligned with what ships

After merge to `main`, verify:
- `Vercel` production
- `Railway` `api`
- production `/health`

Prefer at least one real browser or remote multiplayer validation before calling a release stable.

## Docs Review Rule
Before merge, review whether the change should update:
- `docs/product/`
- `docs/gameplay/`
- `docs/config/`
- `docs/playtests/`
- `docs/planning/`

Not every code change needs docs edits, but every merge should include the check.
