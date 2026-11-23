# Berlin Cold War Basemap Design

## Status

Approved design for the Berlin Cold War basemap slice.

## Goal

Add a Berlin Cold War basemap that uses the existing basemap generation pipeline (proven on NYC) without changing the pipeline, the schema, or any shared UI code.

The board should feel unmistakably **Berlin during the Cold War** — anchored by a single concrete-grey Wall theme line that visibly crosses every "Border Crossing" route — while staying subordinate to the gameplay graph. Following the cartography workflow rule, the basemap is **神似，不追求形似**: it preserves the meaning of divided Berlin without copying literal map geometry.

The slice must also achieve visual distinctiveness ("区分度") from the NYC basemap, with distinctiveness expressed entirely through recipe content and `visuals.json` palette values — not through changes to shared CSS, React components, or schema.

## Current Context

The basemap pipeline already exists from the NYC pilot (commits `787ec9a` → `f3fd649`):

- `BoardBackdrop` schema includes `landmarks`, `themeLines`, and `generatedBy` metadata
- Protected-zone derivation lives in `packages/game-data/src/basemap-protection.ts`
- `pnpm config:basemap-candidate --config <id> --recipe <recipe.json> --out <file>` generates candidates from normalized recipes
- Recipe format is proven by `configs/hudson-hustle/basemap-recipes/nyc-harbor-memory-v1.json`
- Render path is three layers: board surface → backdrop geometry → gameplay graph
- Skill `basemap-candidate-generation` documents the workflow

The Berlin release config already exists at `configs/hudson-hustle/releases/berlin/`:

- 26 active stations, 38 routes, 1200×900 board
- 8 routes typed as Border Crossing
- `backdropMode: "none"` — backdrop arrays are empty placeholders
- Warm-transit-nostalgia palette already in `visuals.json`

Nothing in the pipeline needs to change. This slice is recipe authoring on top of working infrastructure.

## Approach

Single slice, three artifacts:

1. AI reference PNG at `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` — generated, then approved by the user before any vector authoring.
2. Recipe file at `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` — normalized 0–1 coordinates, schemaVersion 1, modeled on `nyc-harbor-memory-v1.json`.
3. Updated `configs/hudson-hustle/releases/berlin/visuals.json` — `backdropMode` flipped from `"none"` to `"muted"` (the same value the active NYC release uses), backdrop arrays populated from the generated candidate.

A hard PNG approval gate sits between artifact 1 and artifact 2. Until the user approves the PNG, no recipe coordinates are written and no `visuals.json` modifications are made.

## Recipe Contents

The recipe authors all five backdrop arrays plus generation metadata. Coordinates below are normalized (0–1) against the 1200×900 board.

### Wall — `themeLines`

Single entry, the centerpiece:

- `id: "berlin-wall-trace"`
- `kind: "historic-border"`
- `priority: "medium"` (highest the spec allows for background)
- `opacity: ~0.32`
- `avoidProtectedZones: true` — the Wall passes between route endpoints, not through them
- `points`: an anchored-and-fitted polyline, approximately:
  - Bornholmer (~0.74, 0.18)
  - west of Schoenhauser Allee (~0.83, 0.25)
  - between Wedding and Mitte (~0.55, 0.35)
  - west of Brandenburger Tor (~0.55, 0.55)
  - Potsdamer Platz crossing zone (~0.51, 0.65)
  - Checkpoint Charlie corridor (~0.58, 0.70)
  - around Tempelhof west edge (~0.50, 0.78)
  - south of Neukoelln (~0.75, 0.84)
  - north of Treptow / east of Ostkreuz (~0.92, 0.68)

Final coordinates will be tuned during recipe authoring so the line passes between the two endpoints of every Border Crossing route:

- `hauptbahnhof-friedrichstrasse-a`
- `hauptbahnhof-friedrichstrasse-b`
- `hauptbahnhof-brandenburger-tor`
- `gesundbrunnen-schoenhauser-allee`
- `ostkreuz-hermannplatz`
- `suedkreuz-flughafen-ber`
- `potsdamer-platz-suedkreuz`
- `ostkreuz-neukoelln`
- `neukoelln-flughafen-ber`

### Spree — `waterAreas` and `shorelines`

A single quiet east-west water band through Mitte:

- `waterAreas[0]` with `id: "spree-memory"`, opacity ~0.14, threading from Hauptbahnhof past Friedrichstrasse, forming a thin notch around Museumsinsel, continuing past Alexanderplatz to Ostkreuz.
- `shorelines`: two thin lines at ~0.04 opacity along the Spree banks.

No `landAreas` — Berlin is one continuous landmass; rendering land would just add visual noise.

### Region labels

Two faint labels, large type, on opposite sides of the Wall:

- `West Berlin` (~0.30, 0.20)
- `East Berlin` (~0.78, 0.20)

### Landmarks — `landmarks`

Five Berlin memory triggers:

| id | kind | rough position | label | opacity | avoidProtectedZones |
|---|---|---|---|---|---|
| `brandenburger-tor-memory` | `civic` | near Brandenburger Tor station, west side | (no label — station label suffices) | 0.22 | true |
| `checkpoint-charlie-memory` | `theme-marker` | on the Wall path, between Potsdamer Platz and Hermannplatz | "Checkpoint C." | 0.26 | **false** — intentional exception |
| `tempelhofer-feld-memory` | `park` | over old Tempelhof airport area | "Tempelhofer Feld" | 0.16 | true |
| `humboldt-uni-memory` | `civic` | between Friedrichstrasse and Alexanderplatz, Spree south bank | "Humboldt" | 0.18 | true |
| `museumsinsel-memory` | `civic` | small island in the Spree between Friedrichstrasse and Alexanderplatz | "Museumsinsel" | 0.20 | true |

Checkpoint Charlie is the one approved `avoidProtectedZones: false` exception — it sits on the Wall path between routes, the same pattern as the NYC recipe's Liberty/Ellis harbor memory marker.

All `kind` values (`civic`, `park`, `theme-marker`, `historic-border`) already exist in `BoardBackdropLandmark` and `BoardBackdropThemeLine` (`packages/game-data/src/config-types.ts`). No schema additions are needed.

### Generation metadata — `generatedBy`

- `recipeId: "berlin-cold-war-v1"`
- `generatorVersion: "manual-pilot-2026-05-15"`
- `acceptedAt: "2026-05-15"`
- `notes`: brief description that this is the first Berlin Cold War basemap, paired with the reference PNG.

## Palette And Distinctiveness

Visual distinctiveness from NYC lives entirely in `visuals.json` and the recipe — no shared UI code changes.

The base palette is inherited from Berlin's existing `visuals.json` (warm-transit-nostalgia). Two values are added or tuned:

- A concrete-grey color applied to the Wall theme line and the Checkpoint Charlie landmark only.
- A cooler-blue value (already present in the palette family) applied to the Spree water band.

Land areas, shorelines, region labels, and the other four landmarks all stay in the warm ochre/parchment family already shared with NYC.

The Berlin board ends up distinct from NYC across five axes:

| Axis | NYC | Berlin |
|---|---|---|
| Theme line | Ferry memory | Berlin Wall |
| Theme accent color | All warm ochre | Concrete-grey on Wall + Checkpoint Charlie |
| Region labels | Boroughs (geographic) | West/East (political sectors) |
| Landmark vocabulary | Harbor, waterfront | Civic, park, theme-marker |
| Water | Two rivers + harbor | Single Spree band with Museumsinsel notch |

Both boards still share the same route style, station style, type scale, and shell — so they feel like the same game, not two different games.

## PNG Approval Gate

Before any recipe coordinates are written or any `visuals.json` changes are made, a single AI reference PNG is generated and approved by the user.

The PNG:

- Filename: `apps/web/public/basemaps/berlin-cold-war-reference-v1.png`
- Drawn at 1200×900, the Berlin board frame
- Shows the Wall as a single concrete-grey dashed line with the historic-anchor + crossing-driven waypoints from this spec
- Shows the Spree band with Museumsinsel notch
- Shows the five landmark glyphs labeled
- Shows `West Berlin` / `East Berlin` faint region labels
- Shows station dots and route lines drawn faintly for visual reference (these are not part of the final basemap geometry — they only verify that the Wall threads correctly)

Hard rule: until the user approves the PNG, the following actions are not taken:

- Authoring `berlin-cold-war-v1.json` with real coordinates
- Modifying `releases/berlin/visuals.json`
- Running `pnpm config:basemap-candidate`
- Committing any artifact

If the user rejects the PNG, the SVG source is revised and the PNG is regenerated. Only after PNG approval does recipe authoring begin.

PNG acceptance bar:

- Wall visibly passes between the two endpoints of all 8 Border Crossing routes
- Wall + Spree + landmarks all sit below routes/stations/labels in the visual stack (faint, low-opacity)
- West/East region labels are unambiguously on opposite sides of the Wall
- The board feels Berlin — Spree band, Wall trace, Brandenburger Tor area, Museumsinsel notch
- The board feels distinct from NYC: concrete-grey accent, political sector labels, civic landmark vocabulary

## File Plan

Created:

- `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` — the approval-gate PNG.
- `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` — the recipe.

Modified:

- `configs/hudson-hustle/releases/berlin/visuals.json` — `backdropMode` flipped from `"none"` to `"muted"` (matches NYC's active release), `backdrop.{landAreas, waterAreas, shorelines, regionLabels, landmarks, themeLines, generatedBy}` populated from the candidate output, palette values tuned for the Wall and Spree.

  Valid `backdropMode` values per `packages/game-data/src/config-types.ts` are `"full" | "muted" | "minimal" | "none"`. This slice uses `"muted"`.

Not modified (explicitly out of scope):

- `apps/web/src/components/**`
- `apps/web/src/styles/**`
- `packages/game-data/src/config-types.ts`
- `packages/game-data/src/basemap-protection.ts`
- `scripts/config/generate-basemap-candidate.mjs`
- `configs/hudson-hustle/current.json`
- `configs/hudson-hustle/releases/berlin/{map,rules,tickets,meta}.json`
- `docs/map/cartography-workflow.md`

## Sequence

Pre-gate:

1. Author a temporary SVG (in `/tmp` or local working directory) that renders the Wall, Spree, landmarks, region labels, and faint reference routes/stations.
2. Render the SVG to PNG, save to `apps/web/public/basemaps/berlin-cold-war-reference-v1.png`.
3. Present the PNG for user approval.

PNG approval gate — wait for explicit user approval.

Post-gate:

4. Author `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` with normalized coordinates that match the approved PNG.
5. Run `pnpm config:basemap-candidate --config berlin --recipe configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json --out /tmp/berlin-basemap-candidate.json`.
6. Paste the candidate output into `configs/hudson-hustle/releases/berlin/visuals.json` under `backdrop`. Flip `backdropMode: "none"` → `"muted"`. Update the `notes` array.

Verification:

7. `pnpm --filter @hudson-hustle/game-core test -- game.test.ts`
8. `pnpm config:registry`
9. `pnpm config:preview berlin`
10. `pnpm build`
11. `pnpm --filter web dev` and run the playability and Berlin-specific checks.

Commits (three small ones, optionally squashed):

12. `feat(map): add berlin cold war basemap reference png`
13. `feat(map): add berlin cold war basemap recipe`
14. `feat(map): apply berlin cold war basemap to release visuals`

## Validation

Pipeline checks:

- `pnpm --filter @hudson-hustle/game-core test -- game.test.ts` passes
- `pnpm config:registry` completes without errors
- `pnpm config:preview berlin` reports station count 26 and route count 38, unchanged
- `pnpm build` passes

Playability checks (Berlin board, `pnpm --filter web dev`):

- Routes remain the highest-contrast line system
- Station rings and labels stay readable at normal laptop size
- Wall, Spree, landmarks, and region labels never look like playable routes
- No landmark sits under a route segment, station ring, route claim badge, or station label, except Checkpoint Charlie (intentional, on the Wall path between routes)
- Resize preserves alignment between basemap and gameplay graph
- If `backdropMode` is toggled to `"none"`, the graph remains fully readable

Berlin-specific checks:

- Wall visibly bisects all 8 Border Crossing routes listed above
- Wall path reads as historically anchored: Bornholmer area, west of Brandenburger Tor, Checkpoint Charlie corridor, around Tempelhof, east of Friedrichshain
- Spree reads east-west through Mitte, with Museumsinsel notch visible
- `West Berlin` and `East Berlin` labels are unambiguously on opposite sides of the Wall
- All five landmarks are readable at faint opacity and do not compete with gameplay

Distinctiveness check ("区分度"):

- Open NYC and Berlin configs in two browser tabs
- Berlin shows Wall theme-line, concrete-grey accent, sector labels, civic landmarks
- NYC shows ferry theme-line, all-warm-ochre, borough labels, harbor/waterfront landmarks
- Both boards feel like the same game — route style, station style, type scale, and shell are visually identical

## Definition Of Done

- `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` exists and is approved by the user.
- `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` exists with valid normalized-coordinate JSON.
- `configs/hudson-hustle/releases/berlin/visuals.json` has `backdropMode: "muted"` and a populated backdrop matching the recipe candidate output.
- All four pipeline checks pass.
- All playability, Berlin-specific, and distinctiveness checks pass in the browser.
- Changes are scoped to the three files above. Zero edits to shared UI code, schema, pipeline, or other config snapshots.
- Three small commits land on a feature branch (or one squashed commit) ready for review.

## Open Implementation Notes

- The reference PNG generator can be a temporary local SVG → PNG script; it does not need to be committed as reusable tooling in this slice. A later slice can promote it into `scripts/config/` if Berlin proves the pattern is reusable beyond NYC.
- The Wall's dashed appearance comes from the existing `historic-border` CSS class in `ui.css`. If the dashed pattern needs tuning for Berlin, prefer adjusting `themeLine.opacity` or recipe palette values inside `visuals.json` over editing the shared CSS class.
- If recipe tuning reveals that one or two Border Crossing routes cannot be cleanly bisected by a single Wall polyline at acceptable opacity, the fix is recipe iteration — adjusting waypoints — not changing routes, station positions, or the schema.
- A future slice may add Cold War sector shading (`landAreas` for West and East sectors with very low opacity fills). It is intentionally deferred from this slice to keep the recipe quiet.
