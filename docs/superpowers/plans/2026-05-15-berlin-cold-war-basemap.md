# Berlin Cold War Basemap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author a Berlin Cold War basemap on top of the existing basemap generation pipeline — a single concrete-grey Wall theme line crossing all 8 Border Crossing routes, plus Spree, five landmarks, and West/East region labels.

**Architecture:** Three artifacts on a feature branch: an approval-gate reference PNG, a normalized-coordinate recipe, and a populated `releases/berlin/visuals.json`. Zero changes to the basemap pipeline, the `BoardBackdrop` schema, shared CSS, or React components. Distinctiveness from NYC lives entirely in recipe content and `visuals.json`.

**Tech Stack:** Node.js (built-in `fs`, `child_process`), the existing `pnpm config:basemap-candidate` generator, SVG → PNG via headless Chromium through `npx -y playwright` (already a transitive devDep) or via the system's `rsvg-convert` / `qlmanage`. JSON. No new dependencies.

---

## File Structure

- Create: `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` — the approval-gate AI reference PNG. Single file under `apps/web/public/` so it ships with the bundle, parallel to `nyc-hudson-ai-reference-v1.png`.
- Create: `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` — normalized-coordinate recipe. `schemaVersion: 1`, modeled exactly on `nyc-harbor-memory-v1.json`.
- Modify: `configs/hudson-hustle/releases/berlin/visuals.json` — flip `backdropMode` from `"none"` to `"muted"`, paste candidate output, add `backdrop.image` block, update `notes`.

Pipeline files (`scripts/config/generate-basemap-candidate.mjs`, `packages/game-data/src/basemap-protection.ts`, `packages/game-data/src/config-types.ts`) and all shared UI files (`apps/web/src/components/**`, `apps/web/src/styles/**`) are **not modified**.

---

### Task 1: Create the feature branch

**Files:**
- None modified

- [ ] **Step 1: Confirm working tree is clean**

Run:
```bash
git status --short
```
Expected: empty (no staged or modified tracked files). If there are unrelated changes, stash or commit them on the current branch first.

- [ ] **Step 2: Pull latest main into local develop/main if needed**

Skip this step if the branch you're branching off (`basemap-refinement-pipeline` or `main`) is already up to date.

- [ ] **Step 3: Create the branch**

Run:
```bash
git checkout -b feat/berlin-cold-war-basemap
```
Expected: `Switched to a new branch 'feat/berlin-cold-war-basemap'`.

---

### Task 2: Author the temporary preview SVG

**Files:**
- Create: `/tmp/berlin-cold-war-preview.svg`

The SVG is a *working file*, not committed. It drives PNG rendering and gets discarded after the PNG is accepted.

The SVG renders, at 1200×900:

1. A neutral parchment background rect (the board surface tone).
2. Faint reference station dots and route lines for all 26 active stations and 38 routes — these prove the Wall threads between the right endpoints. They are reference-only and **do not** appear in the final basemap geometry.
3. Spree water band (single polygon, opacity 0.14, warm-blue fill).
4. Two shoreline polylines along the Spree at 0.04 opacity.
5. The Wall — a single dashed polyline with the historic-anchor + crossing-driven waypoints, concrete-grey, opacity ~0.32, `stroke-dasharray="6 8"`.
6. Five landmark glyphs (rounded rects + small text labels), opacities and positions from the spec.
7. Two large faint region labels: `West Berlin` (left of the Wall) and `East Berlin` (right of the Wall), `fill-opacity` ~0.18, large letter-spacing.

- [ ] **Step 1: Write the SVG**

Create `/tmp/berlin-cold-war-preview.svg` with this exact content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <style>
      .surface { fill: #efe2c7; }
      .ref-route { stroke: rgba(72, 54, 34, 0.18); stroke-width: 2; fill: none; }
      .ref-route-tunnel { stroke: rgba(72, 54, 34, 0.18); stroke-width: 2; fill: none; stroke-dasharray: 4 6; }
      .ref-route-border { stroke: rgba(72, 54, 34, 0.18); stroke-width: 2; fill: none; stroke-dasharray: 10 6; }
      .ref-station { fill: #efe2c7; stroke: rgba(72, 54, 34, 0.55); stroke-width: 2; }
      .ref-label { fill: rgba(72, 54, 34, 0.7); font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; }
      .spree { fill: #5f7a8a; fill-opacity: 0.14; }
      .spree-shore { stroke: rgba(72, 54, 34, 0.16); stroke-width: 1.2; fill: none; opacity: 0.4; }
      .wall { stroke: #7d8088; stroke-width: 4.5; fill: none; stroke-dasharray: 6 8; stroke-linecap: round; stroke-linejoin: round; opacity: 0.7; }
      .landmark { fill: rgba(85, 103, 82, 0.22); stroke: rgba(72, 54, 34, 0.16); stroke-width: 1.2; }
      .landmark-civic { fill: rgba(120, 100, 70, 0.20); }
      .landmark-park { fill: rgba(100, 130, 90, 0.20); }
      .landmark-checkpoint { fill: rgba(125, 128, 136, 0.30); }
      .landmark-label { fill: rgba(72, 54, 34, 0.45); font-family: system-ui, sans-serif; font-size: 11px; font-weight: 650; letter-spacing: 0.05em; }
      .region-label { fill: rgba(72, 54, 34, 0.18); font-family: system-ui, sans-serif; font-size: 44px; font-weight: 700; letter-spacing: 0.18em; }
    </style>
  </defs>

  <rect class="surface" x="0" y="0" width="1200" height="900" rx="12"/>

  <!-- Region labels (rendered before everything else so they sit lowest) -->
  <text class="region-label" x="120" y="120">WEST BERLIN</text>
  <text class="region-label" x="780" y="120">EAST BERLIN</text>

  <!-- Spree water band -->
  <polygon class="spree" points="
    540,420 720,400 820,400 900,400 1080,500 1080,520 900,440 820,440 720,440 540,460
  "/>
  <!-- Museumsinsel notch (a thin lens of land inside the river) -->
  <polygon class="surface" points="820,410 880,408 880,432 820,430"/>
  <polyline class="spree-shore" points="540,420 720,400 820,400 900,400 1080,500"/>
  <polyline class="spree-shore" points="540,460 720,440 820,440 900,440 1080,520"/>

  <!-- Reference routes (faint, for visual verification only) -->
  <!-- We draw the 8 Border Crossing routes thicker-dashed, normal routes solid-thin, tunnels dotted -->
  <!-- All Border Crossing routes will be checked against the Wall path. -->
  <!-- Stadtbahn east-west -->
  <line class="ref-route" x1="250" y1="500" x2="430" y2="450"/>
  <line class="ref-route" x1="430" y1="450" x2="600" y2="340"/>
  <line class="ref-route" x1="600" y1="340" x2="760" y2="340"/>
  <line class="ref-route" x1="760" y1="340" x2="920" y2="340"/>
  <line class="ref-route" x1="920" y1="340" x2="960" y2="480"/>
  <line class="ref-route" x1="960" y1="480" x2="1070" y2="580"/>
  <!-- Ringbahn -->
  <line class="ref-route" x1="850" y1="130" x2="1020" y2="200"/>
  <line class="ref-route" x1="1020" y1="200" x2="1130" y2="340"/>
  <line class="ref-route" x1="1130" y1="340" x2="1070" y2="580"/>
  <line class="ref-route" x1="1070" y1="580" x2="950" y2="720"/>
  <line class="ref-route" x1="950" y1="720" x2="660" y2="680"/>
  <line class="ref-route" x1="660" y1="680" x2="500" y2="760"/>
  <line class="ref-route" x1="500" y1="760" x2="350" y2="680"/>
  <line class="ref-route" x1="350" y1="680" x2="250" y2="500"/>
  <line class="ref-route" x1="250" y1="500" x2="300" y2="220"/>
  <line class="ref-route" x1="300" y1="220" x2="420" y2="130"/>
  <line class="ref-route" x1="420" y1="130" x2="630" y2="130"/>
  <line class="ref-route" x1="630" y1="130" x2="850" y2="130"/>
  <!-- Border Crossing routes -->
  <line class="ref-route-border" x1="600" y1="340" x2="760" y2="340"/>
  <line class="ref-route-border" x1="600" y1="340" x2="700" y2="480"/>
  <line class="ref-route-border" x1="850" y1="130" x2="1020" y2="200"/>
  <line class="ref-route-border" x1="1070" y1="580" x2="830" y2="580"/>
  <line class="ref-route-border" x1="500" y1="760" x2="1060" y2="860"/>
  <line class="ref-route-border" x1="600" y1="580" x2="500" y2="760"/>
  <line class="ref-route-border" x1="1070" y1="580" x2="950" y2="720"/>
  <line class="ref-route-border" x1="950" y1="720" x2="1060" y2="860"/>
  <!-- Tunnels -->
  <line class="ref-route-tunnel" x1="630" y1="130" x2="600" y2="340"/>
  <line class="ref-route-tunnel" x1="850" y1="130" x2="760" y2="340"/>

  <!-- Reference station dots and key labels -->
  <g>
    <circle class="ref-station" cx="600" cy="340" r="8"/>
    <text class="ref-label" x="586" y="324" text-anchor="end">Hbf</text>
    <circle class="ref-station" cx="760" cy="340" r="8"/>
    <text class="ref-label" x="760" y="330" text-anchor="middle">Friedrichstr.</text>
    <circle class="ref-station" cx="920" cy="340" r="8"/>
    <text class="ref-label" x="990" y="360" text-anchor="middle">Alex</text>
    <circle class="ref-station" cx="700" cy="480" r="8"/>
    <text class="ref-label" x="818" y="512" text-anchor="end">Brandenburger</text>
    <circle class="ref-station" cx="600" cy="580" r="8"/>
    <text class="ref-label" x="582" y="588" text-anchor="end">Potsd.Platz</text>
    <circle class="ref-station" cx="850" cy="130" r="8"/>
    <text class="ref-label" x="850" y="114" text-anchor="middle">Gesundbrunnen</text>
    <circle class="ref-station" cx="1020" cy="200" r="8"/>
    <text class="ref-label" x="1034" y="208">Schoenhauser</text>
    <circle class="ref-station" cx="1070" cy="580" r="8"/>
    <text class="ref-label" x="1088" y="588">Ostkreuz</text>
    <circle class="ref-station" cx="830" cy="580" r="8"/>
    <text class="ref-label" x="816" y="570" text-anchor="end">Hermannplatz</text>
    <circle class="ref-station" cx="500" cy="760" r="8"/>
    <text class="ref-label" x="520" y="790" text-anchor="end">Suedkreuz</text>
    <circle class="ref-station" cx="660" cy="680" r="8"/>
    <text class="ref-label" x="660" y="698" text-anchor="middle">Tempelhof</text>
    <circle class="ref-station" cx="950" cy="720" r="8"/>
    <text class="ref-label" x="932" y="732" text-anchor="end">Neukölln</text>
    <circle class="ref-station" cx="1060" cy="860" r="8"/>
    <text class="ref-label" x="1060" y="842" text-anchor="middle">BER</text>
  </g>

  <!-- The Wall: single dashed concrete-grey polyline -->
  <polyline class="wall" points="
    888,162    1000,225   980,290   870,300   700,295   555,315   555,500   555,640   695,705   695,820   895,820   1015,720   985,580
  "/>

  <!-- Landmarks -->
  <!-- Brandenburger Tor memory marker -->
  <rect class="landmark landmark-civic" x="668" y="468" width="28" height="24" rx="4"/>
  <!-- Checkpoint Charlie -->
  <rect class="landmark landmark-checkpoint" x="554" y="612" width="36" height="18" rx="3"/>
  <text class="landmark-label" x="546" y="608" text-anchor="end">Checkpoint C.</text>
  <!-- Tempelhofer Feld -->
  <rect class="landmark landmark-park" x="612" y="700" width="96" height="36" rx="6"/>
  <text class="landmark-label" x="660" y="752" text-anchor="middle">Tempelhofer Feld</text>
  <!-- Humboldt University -->
  <rect class="landmark landmark-civic" x="800" y="358" width="44" height="20" rx="4"/>
  <text class="landmark-label" x="822" y="392" text-anchor="middle">Humboldt</text>
  <!-- Museumsinsel -->
  <rect class="landmark landmark-civic" x="822" y="408" width="56" height="22" rx="4"/>
  <text class="landmark-label" x="850" y="448" text-anchor="middle">Museumsinsel</text>
</svg>
```

- [ ] **Step 2: Confirm the SVG is valid**

Run:
```bash
node -e "require('fs').readFileSync('/tmp/berlin-cold-war-preview.svg','utf8').length > 1000 || process.exit(1); console.log('svg ok')"
```
Expected: `svg ok`.

- [ ] **Step 3: Visually inspect the SVG**

Open `/tmp/berlin-cold-war-preview.svg` in a browser (`open /tmp/berlin-cold-war-preview.svg` on macOS) to confirm rendering works.
Expected: Berlin board frame appears with stations, routes, Spree, Wall, landmarks, region labels.

---

### Task 3: Render the SVG to PNG

**Files:**
- Create: `apps/web/public/basemaps/berlin-cold-war-reference-v1.png`

The render approach must work on the user's macOS environment. We use a small Node script that drives headless Chromium via Playwright. Playwright is already available in the repo as a devDep through Storybook's testing tools, but if `npx playwright` doesn't resolve, we fall back to `qlmanage`/`rsvg-convert`/manual screenshot.

- [ ] **Step 1: Verify the output directory exists**

Run:
```bash
ls apps/web/public/basemaps/
```
Expected: at least `nyc-hudson-ai-reference-v1.png` is listed. The directory exists.

- [ ] **Step 2: Render the SVG to PNG**

Try this command first. It uses Chrome's headless mode if Chrome is installed:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless --disable-gpu --hide-scrollbars --window-size=1200,900 --default-background-color=00000000 --screenshot=apps/web/public/basemaps/berlin-cold-war-reference-v1.png file:///tmp/berlin-cold-war-preview.svg
```

If Chrome is not at that path or fails, use this Node-based fallback:
```bash
node -e "
const { exec } = require('child_process');
exec('qlmanage -t -s 1200 -o /tmp /tmp/berlin-cold-war-preview.svg', (err, stdout) => {
  if (err) { console.error(err); process.exit(1); }
  require('fs').renameSync('/tmp/berlin-cold-war-preview.svg.png', 'apps/web/public/basemaps/berlin-cold-war-reference-v1.png');
  console.log('rendered via qlmanage');
});
"
```

If neither works, ask the user to open the SVG in a browser and export a 1200×900 PNG manually.

Expected: `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` exists, ~50–200 KB.

- [ ] **Step 3: Confirm the PNG**

Run:
```bash
ls -la apps/web/public/basemaps/berlin-cold-war-reference-v1.png
file apps/web/public/basemaps/berlin-cold-war-reference-v1.png
```
Expected: file size > 10 KB, type `PNG image data, 1200 x 900`.

- [ ] **Step 4: PNG APPROVAL GATE — show the PNG to the user**

Show the PNG to the user. Wait for explicit approval before proceeding.

Acceptance bar:
- Wall visibly passes between the two endpoints of all 8 Border Crossing routes
- Wall + Spree + landmarks all sit below routes/stations/labels in visual stack
- West/East region labels unambiguously on opposite sides of the Wall
- Feels Berlin (Spree band, Wall trace, Museumsinsel notch)
- Distinct from NYC (concrete-grey accent, political sector labels, civic landmarks)

If the user requests revisions: edit the SVG in `/tmp/berlin-cold-war-preview.svg`, re-run Step 2, re-present. Do not advance to Task 4 without explicit approval.

- [ ] **Step 5: Commit the PNG**

Only after user approval:
```bash
git add apps/web/public/basemaps/berlin-cold-war-reference-v1.png
git commit -m "feat(map): add berlin cold war basemap reference png

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Author the recipe file

**Files:**
- Create: `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json`

The recipe uses normalized coordinates (0–1) against the 1200×900 board, the same format as `nyc-harbor-memory-v1.json`. Note the array-of-arrays point format `[x, y]` and bounds format `[x, y, width, height]` — the generator requires this exact shape.

- [ ] **Step 1: Create the recipe file**

Create `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` with this exact content:

```json
{
  "schemaVersion": 1,
  "recipeId": "berlin-cold-war-v1",
  "cityId": "berlin",
  "coordinates": "normalized",
  "notes": [
    "Board-first Berlin Cold War basemap recipe. Wall is the centerpiece theme line.",
    "Shape language is 神似: Wall path is historically anchored but waypoints are board-fitted so all 8 Border Crossing routes are visibly bisected.",
    "Concrete-grey palette is scoped to the Wall theme line and Checkpoint Charlie landmark only. All other features inherit the warm-transit-nostalgia palette."
  ],
  "landAreas": [],
  "waterAreas": [
    {
      "id": "spree-memory",
      "opacity": 0.14,
      "points": [
        [0.45, 0.467],
        [0.6, 0.444],
        [0.683, 0.444],
        [0.75, 0.444],
        [0.9, 0.556],
        [0.9, 0.578],
        [0.75, 0.489],
        [0.683, 0.489],
        [0.6, 0.489],
        [0.45, 0.511]
      ]
    }
  ],
  "shorelines": [
    {
      "id": "spree-north-shore-memory",
      "points": [
        [0.45, 0.467],
        [0.6, 0.444],
        [0.683, 0.444],
        [0.75, 0.444],
        [0.9, 0.556]
      ]
    },
    {
      "id": "spree-south-shore-memory",
      "points": [
        [0.45, 0.511],
        [0.6, 0.489],
        [0.683, 0.489],
        [0.75, 0.489],
        [0.9, 0.578]
      ]
    }
  ],
  "regionLabels": [
    { "id": "west-berlin", "text": "West Berlin", "point": [0.1, 0.133] },
    { "id": "east-berlin", "text": "East Berlin", "point": [0.65, 0.133] }
  ],
  "landmarks": [
    {
      "id": "brandenburger-tor-memory",
      "kind": "civic",
      "bounds": [0.557, 0.52, 0.023, 0.027],
      "opacity": 0.22,
      "priority": "low"
    },
    {
      "id": "checkpoint-charlie-memory",
      "kind": "theme-marker",
      "bounds": [0.462, 0.68, 0.03, 0.02],
      "label": "Checkpoint C.",
      "opacity": 0.26,
      "priority": "medium",
      "avoidProtectedZones": false
    },
    {
      "id": "tempelhofer-feld-memory",
      "kind": "park",
      "bounds": [0.51, 0.778, 0.08, 0.04],
      "label": "Tempelhofer Feld",
      "opacity": 0.16,
      "priority": "low"
    },
    {
      "id": "humboldt-uni-memory",
      "kind": "civic",
      "bounds": [0.667, 0.398, 0.037, 0.022],
      "label": "Humboldt",
      "opacity": 0.18,
      "priority": "low"
    },
    {
      "id": "museumsinsel-memory",
      "kind": "civic",
      "bounds": [0.685, 0.453, 0.047, 0.024],
      "label": "Museumsinsel",
      "opacity": 0.2,
      "priority": "low"
    }
  ],
  "themeLines": [
    {
      "id": "berlin-wall-trace",
      "kind": "historic-border",
      "opacity": 0.32,
      "priority": "medium",
      "avoidProtectedZones": true,
      "points": [
        [0.74, 0.18],
        [0.833, 0.25],
        [0.817, 0.322],
        [0.725, 0.333],
        [0.583, 0.328],
        [0.463, 0.35],
        [0.463, 0.556],
        [0.463, 0.711],
        [0.579, 0.783],
        [0.579, 0.911],
        [0.746, 0.911],
        [0.846, 0.8],
        [0.821, 0.644]
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate JSON shape**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json','utf8')); console.log('valid json')"
```
Expected: `valid json`.

- [ ] **Step 3: Commit the recipe**

```bash
git add configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json
git commit -m "feat(map): add berlin cold war basemap recipe

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Generate the candidate

**Files:**
- Create: `/tmp/berlin-basemap-candidate.json` (working file, not committed)

- [ ] **Step 1: Generate**

Run:
```bash
pnpm config:basemap-candidate --config berlin --recipe configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json --out /tmp/berlin-basemap-candidate.json
```
Expected output (counts may shift slightly if waypoints get omitted, but no errors):
```
{
  "generated": true,
  "outputPath": "/tmp/berlin-basemap-candidate.json",
  "configId": "berlin",
  "recipeId": "berlin-cold-war-v1",
  "counts": {
    "landAreas": 0,
    "waterAreas": 1,
    "shorelines": 2,
    "regionLabels": 2,
    "landmarks": 5,
    "themeLines": 1
  }
}
```

- [ ] **Step 2: Inspect the candidate**

Run:
```bash
cat /tmp/berlin-basemap-candidate.json | head -80
```
Confirm:
- `landmarks` count is 5 (no Berlin landmark was omitted by protected-zone collision)
- `themeLines` count is 1 (Wall survived the protection check)
- `generatedBy.notes` does **not** include `Omitted N protected-zone conflicts`. If it does, see Step 3.

- [ ] **Step 3: If any feature was omitted, iterate**

If the generator reports omitted landmarks or theme lines:

1. Read `/tmp/berlin-basemap-candidate.json` `.generatedBy.notes` to see which features were dropped.
2. Adjust the offending coordinates in `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` to move them clear of routes/stations/labels.
3. Re-run Step 1.

For the Wall specifically — if it gets omitted, that means a waypoint sits inside a route corridor. Adjust the waypoint by 20–30 board units perpendicular to the nearest route. The Wall is allowed to pass *between* route endpoints, just not *along* a route corridor.

Do not modify `avoidProtectedZones` to bypass the check, except for Checkpoint Charlie (already set to `false` intentionally).

---

### Task 6: Apply the candidate to releases/berlin/visuals.json

**Files:**
- Modify: `configs/hudson-hustle/releases/berlin/visuals.json`

- [ ] **Step 1: Read the current visuals.json**

Run:
```bash
cat configs/hudson-hustle/releases/berlin/visuals.json
```
Confirm: `backdropMode` is `"none"`, `backdrop` arrays are empty.

- [ ] **Step 2: Read the candidate output**

Run:
```bash
cat /tmp/berlin-basemap-candidate.json
```
You will paste the contents of this file into `visuals.json` `backdrop` field.

- [ ] **Step 3: Merge candidate into visuals.json programmatically**

Use this exact Node one-liner to merge the candidate JSON into `visuals.json` in place. It updates `backdropMode`, `visualSetId`, `notes`, and the `backdrop` block (preserving an `image` field), keeping `palettes` and `schemaVersion` untouched:

```bash
node -e "
const fs = require('fs');
const visualsPath = 'configs/hudson-hustle/releases/berlin/visuals.json';
const candidate = JSON.parse(fs.readFileSync('/tmp/berlin-basemap-candidate.json','utf8'));
const visuals = JSON.parse(fs.readFileSync(visualsPath,'utf8'));
visuals.visualSetId = 'berlin-cold-war-v1-visuals';
visuals.backdropMode = 'muted';
visuals.backdrop = {
  image: {
    href: '/basemaps/berlin-cold-war-reference-v1.png',
    opacity: 1,
    preserveAspectRatio: 'none'
  },
  landAreas: candidate.landAreas,
  waterAreas: candidate.waterAreas,
  shorelines: candidate.shorelines,
  regionLabels: candidate.regionLabels,
  landmarks: candidate.landmarks,
  themeLines: candidate.themeLines,
  generatedBy: candidate.generatedBy
};
visuals.notes = [
  'Berlin Cold War basemap pilot uses local vector backdrop data derived from an approved AI concept image.',
  'The Wall theme line crosses all 8 Border Crossing routes. Concrete-grey palette is scoped to the Wall and Checkpoint Charlie only.',
  'Backdrop remains secondary to routes, stations, and labels.'
];
fs.writeFileSync(visualsPath, JSON.stringify(visuals, null, 2) + '\n');
console.log('visuals.json updated');
"
```
Expected: `visuals.json updated`.

- [ ] **Step 4: Validate the file**

Run:
```bash
node -e "const v = JSON.parse(require('fs').readFileSync('configs/hudson-hustle/releases/berlin/visuals.json','utf8')); console.log({backdropMode: v.backdropMode, imageHref: v.backdrop?.image?.href, landmarks: v.backdrop?.landmarks?.length, themeLines: v.backdrop?.themeLines?.length})"
```
Expected:
```
{
  backdropMode: 'muted',
  imageHref: '/basemaps/berlin-cold-war-reference-v1.png',
  landmarks: 5,
  themeLines: 1
}
```

- [ ] **Step 5: Run game-core tests**

Run:
```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```
Expected: PASS. These tests cover NYC-specific behavior; Berlin only needs to not break schema validation.

- [ ] **Step 6: Run config registry and preview**

Run:
```bash
pnpm config:registry
pnpm config:preview berlin
```
Expected:
- Registry generation completes without errors.
- Preview prints Berlin metadata, station count 26, route count 38.

- [ ] **Step 7: Commit**

```bash
git add configs/hudson-hustle/releases/berlin/visuals.json packages/game-data/src/generated-config-registry.ts
git commit -m "feat(map): apply berlin cold war basemap to release visuals

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

The `generated-config-registry.ts` may or may not have changed depending on whether the registry hashes content; include it only if `git status` shows it modified.

---

### Task 7: Full verification

**Files:**
- No planned source edits unless verification finds a bug.

- [ ] **Step 1: Targeted tests**

Run:
```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```
Expected: PASS.

- [ ] **Step 2: Full build**

Run:
```bash
pnpm build
```
Expected: PASS.

- [ ] **Step 3: Start dev server**

Run:
```bash
pnpm --filter web dev
```
Expected: Vite prints a local URL.

- [ ] **Step 4: Browser smoke — Berlin**

Open the local Vite URL in a browser. Switch to the Berlin config (use the existing config switcher UI, or temporarily flip `configs/hudson-hustle/current.json` to point at `berlin` — **do not commit that change**).

Verify all Berlin-specific checks from the spec:
- Wall visibly bisects all 8 Border Crossing routes:
  - `hauptbahnhof-friedrichstrasse-a`, `hauptbahnhof-friedrichstrasse-b`
  - `hauptbahnhof-brandenburger-tor`
  - `gesundbrunnen-schoenhauser-allee`
  - `ostkreuz-hermannplatz`
  - `suedkreuz-flughafen-ber`
  - `potsdamer-platz-suedkreuz`
  - `ostkreuz-neukoelln`
  - `neukoelln-flughafen-ber`
- Wall path reads as historically anchored.
- Spree reads east-west through Mitte, Museumsinsel notch visible.
- `West Berlin` / `East Berlin` labels unambiguously on opposite sides of the Wall.
- All five landmarks faint and readable.
- Routes, station rings, route claim badges, station labels remain top-contrast.
- Resize preserves alignment.

- [ ] **Step 5: Browser smoke — NYC distinctiveness**

Switch back to the NYC config and confirm:
- NYC still shows ferry theme-line, all-warm-ochre palette, borough labels, harbor/waterfront landmarks.
- Berlin and NYC feel like the same game (route style, station style, type scale identical) but visually distinct as different places.

If you flipped `current.json` for testing, revert it now:
```bash
git checkout configs/hudson-hustle/current.json
```

- [ ] **Step 6: Stop dev server**

Stop the running `pnpm --filter web dev` process.

- [ ] **Step 7: Commit any verification-only fixes**

If verification revealed any visual tuning needs (waypoint nudges in the recipe, opacity changes), apply them by editing `berlin-cold-war-v1.json`, regenerating, re-applying to `visuals.json`. Commit as:
```bash
git add configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json configs/hudson-hustle/releases/berlin/visuals.json
git commit -m "fix(map): tune berlin cold war basemap readability

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

If no fixes were needed, do not create an empty commit.

---

### Task 8: Confirm scope discipline

**Files:**
- No edits.

- [ ] **Step 1: Diff against branch base**

Run:
```bash
git diff main --stat
```
Expected: only three files changed:
- `apps/web/public/basemaps/berlin-cold-war-reference-v1.png`
- `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json`
- `configs/hudson-hustle/releases/berlin/visuals.json`

If `packages/game-data/src/generated-config-registry.ts` is also changed, that's expected from `pnpm config:registry`.

If any of these appear in the diff, investigate before continuing — they should NOT have changed:
- `apps/web/src/components/**`
- `apps/web/src/styles/**`
- `packages/game-data/src/config-types.ts`
- `packages/game-data/src/basemap-protection.ts`
- `scripts/config/generate-basemap-candidate.mjs`
- `configs/hudson-hustle/current.json`
- `configs/hudson-hustle/releases/berlin/{map,rules,tickets,meta}.json`

- [ ] **Step 2: Confirm commit history**

Run:
```bash
git log main..HEAD --oneline
```
Expected: three commits (PNG, recipe, visuals.json), plus an optional fourth `fix(map):` tuning commit if Step 7 of Task 7 ran.

---

## Final Definition Of Done

- Branch is `feat/berlin-cold-war-basemap`.
- `apps/web/public/basemaps/berlin-cold-war-reference-v1.png` exists and was approved by the user before any vector authoring.
- `configs/hudson-hustle/basemap-recipes/berlin-cold-war-v1.json` exists with valid normalized-coordinate JSON.
- `configs/hudson-hustle/releases/berlin/visuals.json` has `backdropMode: "muted"`, the `backdrop.image` block points at the new PNG, and the populated backdrop arrays match the recipe candidate output.
- `pnpm --filter @hudson-hustle/game-core test -- game.test.ts` passes.
- `pnpm config:registry` and `pnpm config:preview berlin` both succeed.
- `pnpm build` passes.
- Browser smoke confirms Wall bisects all 8 Border Crossing routes, distinctiveness from NYC is visible, route/label readability is preserved.
- Zero changes to shared UI code, the schema, the pipeline, or other config snapshots.
- `current.json` is unchanged.
