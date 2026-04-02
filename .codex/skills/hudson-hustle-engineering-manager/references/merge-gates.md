# Merge Gates

Use this reference when deciding whether a Hudson Hustle branch is ready for `develop` or `main`.

## `develop` Gate
A branch is usually ready for `develop` when:
- the intended code change is complete enough to validate on staging
- local targeted tests pass
- local build passes
- a findings-first code review has been done
- affected docs have been updated or intentionally deferred with a reason

After merge to `develop`, verify:
- `Vercel` preview / `develop`
- `Railway` `api-develop`
- staging `/health`

If the change affects runtime multiplayer behavior, prefer a staging smoke pass before promoting further.

## `main` Gate
A branch is usually ready for `main` only after:
- the corresponding `develop` result is trusted
- staging smoke has passed for the relevant behavior
- any staging-only regressions are resolved
- a findings-first code review has been done
- affected docs are aligned with shipped behavior

After merge to `main`, verify:
- `Vercel` production
- `Railway` `api`
- production `/health`

Prefer at least one real browser or remote multiplayer validation before calling a release stable.

## Docs Review Rule
Before merge to either `develop` or `main`, review whether the change should update:
- `docs/product/`
- `docs/gameplay/`
- `docs/config/`
- `docs/playtests/`
- `docs/planning/`

Not every code change needs docs edits, but every merge should include the check.
