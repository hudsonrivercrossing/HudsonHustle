# Basemap Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first NYC-focused, generic basemap pipeline slice: remove the dotted overlay, extend config-backed vector backdrop data, add protected-zone utilities, and refine the NYC basemap without changing gameplay.

**Architecture:** Keep `map.json` as gameplay layout truth and `visuals.json` as the initial runtime basemap source. Add small vector-backed basemap fields, render them below gameplay, and add deterministic protected-zone utilities so future AI-assisted basemap generation can avoid routes, stations, and labels. The first slice proves the pipeline on the current NYC/Hudson map while staying reusable for Berlin.

**Tech Stack:** TypeScript, React, SVG, Vite, Vitest, existing Hudson Hustle config snapshot tooling.

---

## File Structure

- Modify `packages/game-data/src/config-types.ts`
  - Extend `BoardBackdrop` with optional `landmarks`, `themeLines`, and `generatedBy` data.
- Create `packages/game-data/src/basemap-protection.ts`
  - Pure geometry helpers for deriving route, station, and label protected zones from `MapConfig`.
- Modify `packages/game-data/src/index.ts`
  - Export the protected-zone helper types/functions.
- Modify `packages/game-core/tests/game.test.ts`
  - Add focused tests for backdrop schema safety and protected-zone output on the active NYC map.
- Modify `apps/web/src/components/ui/game/BoardMap.tsx`
  - Remove the dotted overlay render path.
  - Render new optional backdrop features between existing backdrop geometry and gameplay graph.
- Modify `apps/web/src/styles/ui.css`
  - Add low-contrast styles for `landmark` and `themeLine` classes.
- Modify `configs/hudson-hustle/releases/v0.4-flushing-newark-airport/visuals.json`
  - Refine the NYC backdrop with a small vector-first pilot set.
- Modify `configs/hudson-hustle/README.md`
  - Document that long-term basemaps use three visible layers and generated vector backdrop data.
- Modify `docs/map/cartography-workflow.md`
  - Add the “神似，不追求形似” basemap rule and protected-zone requirement.

Do not modify `configs/hudson-hustle/current.json`. Do not change `map.json`, `tickets.json`, or `rules.json` in this slice unless a later approved plan explicitly expands scope.

---

### Task 1: Extend Backdrop Types

**Files:**
- Modify: `packages/game-data/src/config-types.ts`

- [ ] **Step 1: Add backdrop feature interfaces**

In `packages/game-data/src/config-types.ts`, after `BoardBackdropLabel`, add:

```ts
export interface BoardBackdropLandmark {
  id: string;
  kind:
    | "harbor-island"
    | "park"
    | "terminal"
    | "waterfront"
    | "civic"
    | "theme-marker";
  point?: BoardPoint;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string;
  opacity?: number;
  priority?: "low" | "medium";
}

export interface BoardBackdropThemeLine {
  id: string;
  kind: "ferry" | "historic-border" | "shore-memory" | "theme-trace";
  points: BoardPoint[];
  opacity?: number;
  priority?: "low" | "medium";
}

export interface BoardBackdropGenerationMetadata {
  recipeId: string;
  generatorVersion: string;
  acceptedAt: string;
  notes?: string[];
}
```

- [ ] **Step 2: Extend `BoardBackdrop`**

Update the existing interface to:

```ts
export interface BoardBackdrop {
  landAreas: BoardBackdropArea[];
  waterAreas: BoardBackdropArea[];
  shorelines: BoardBackdropLine[];
  regionLabels: BoardBackdropLabel[];
  landmarks?: BoardBackdropLandmark[];
  themeLines?: BoardBackdropThemeLine[];
  generatedBy?: BoardBackdropGenerationMetadata;
}
```

- [ ] **Step 3: Export new types from `index.ts`**

In `packages/game-data/src/index.ts`, add the new types to the existing `export type { ... } from "./config-types.js";` block:

```ts
  BoardBackdropGenerationMetadata,
  BoardBackdropLandmark,
  BoardBackdropThemeLine,
```

- [ ] **Step 4: Build game-data**

Run:

```bash
pnpm --filter @hudson-hustle/game-data build
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add packages/game-data/src/config-types.ts packages/game-data/src/index.ts
git commit -m "feat(map): extend basemap backdrop types"
```

---

### Task 2: Add Protected-Zone Geometry Utilities

**Files:**
- Create: `packages/game-data/src/basemap-protection.ts`
- Modify: `packages/game-data/src/index.ts`
- Modify: `packages/game-core/tests/game.test.ts`

- [ ] **Step 1: Create failing tests**

In `packages/game-core/tests/game.test.ts`, add `buildBasemapProtectedZones` to the existing import from `../../game-data/src`:

```ts
  buildBasemapProtectedZones,
```

Add these tests near the existing backdrop geometry tests:

```ts
  it("builds protected zones for routes, stations, and labels", () => {
    const zones = buildBasemapProtectedZones(hudsonHustleMap, hudsonHustleBoardFrame);

    expect(zones.routes.length).toBe(hudsonHustleMap.routes.length);
    expect(zones.stations.length).toBe(hudsonHustleMap.cities.length);
    expect(zones.labels.length).toBe(hudsonHustleMap.cities.length);

    for (const zone of [...zones.routes, ...zones.stations, ...zones.labels]) {
      expect(zone.bounds.left).toBeGreaterThanOrEqual(0);
      expect(zone.bounds.top).toBeGreaterThanOrEqual(0);
      expect(zone.bounds.right).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
      expect(zone.bounds.bottom).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      expect(zone.bounds.right).toBeGreaterThan(zone.bounds.left);
      expect(zone.bounds.bottom).toBeGreaterThan(zone.bounds.top);
    }
  });

  it("protects the Exchange Place to World Trade Hudson crossing corridor", () => {
    const zones = buildBasemapProtectedZones(hudsonHustleMap, hudsonHustleBoardFrame);
    const crossing = zones.routes.find((zone) => zone.id === "exchange-place-world-trade-a");

    expect(crossing).toBeDefined();
    expect(crossing?.routeId).toBe("exchange-place-world-trade-a");
    expect(crossing?.bounds.left).toBeLessThan(getCity("world-trade").x);
    expect(crossing?.bounds.right).toBeGreaterThan(getCity("exchange-place").x);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: FAIL because `buildBasemapProtectedZones` is not exported.

- [ ] **Step 3: Add `basemap-protection.ts`**

Create `packages/game-data/src/basemap-protection.ts`:

```ts
import type { MapConfig, RouteDef } from "@hudson-hustle/game-core";

export interface BasemapBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BasemapProtectedZone {
  id: string;
  kind: "route" | "station" | "label";
  bounds: BasemapBounds;
  routeId?: string;
  cityId?: string;
}

export interface BasemapProtectedZones {
  routes: BasemapProtectedZone[];
  stations: BasemapProtectedZone[];
  labels: BasemapProtectedZone[];
}

export interface BasemapBoardFrame {
  width: number;
  height: number;
}

interface PathPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function padBounds(bounds: BasemapBounds, padding: number, width: number, height: number): BasemapBounds {
  return {
    left: clamp(bounds.left - padding, 0, width),
    top: clamp(bounds.top - padding, 0, height),
    right: clamp(bounds.right + padding, 0, width),
    bottom: clamp(bounds.bottom + padding, 0, height)
  };
}

function boundsFromPoints(points: PathPoint[], padding: number, width: number, height: number): BasemapBounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return padBounds(
    {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys)
    },
    padding,
    width,
    height
  );
}

function getPathPoints(route: RouteDef, config: MapConfig): PathPoint[] {
  const from = config.cities.find((city) => city.id === route.from)!;
  const to = config.cities.find((city) => city.id === route.to)!;
  if (route.waypoints && route.waypoints.length > 0) {
    return [{ x: from.x, y: from.y }, ...route.waypoints, { x: to.x, y: to.y }];
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -(dy / length);
  const ny = dx / length;
  const offset = route.offset ?? 0;
  const ox = nx * offset;
  const oy = ny * offset;

  return [
    { x: from.x + ox, y: from.y + oy },
    { x: to.x + ox, y: to.y + oy }
  ];
}

export function buildBasemapProtectedZones(config: MapConfig, frame: BasemapBoardFrame): BasemapProtectedZones {
  const width = frame.width;
  const height = frame.height;

  return {
    routes: config.routes.map((route) => ({
      id: `route:${route.id}`,
      kind: "route",
      routeId: route.id,
      bounds: boundsFromPoints(getPathPoints(route, config), 34, width, height)
    })),
    stations: config.cities.map((city) => ({
      id: `station:${city.id}`,
      kind: "station",
      cityId: city.id,
      bounds: padBounds(
        {
          left: city.x - 18,
          top: city.y - 18,
          right: city.x + 18,
          bottom: city.y + 18
        },
        14,
        width,
        height
      )
    })),
    labels: config.cities.map((city) => {
      const label = city.label ?? city.name;
      const labelDx = city.labelDx ?? 14;
      const labelDy = city.labelDy ?? -14;
      const anchor = city.labelAnchor ?? "start";
      const textWidth = Math.max(44, label.length * 9);
      const x = city.x + labelDx;
      const y = city.y + labelDy;
      const left = anchor === "end" ? x - textWidth : anchor === "middle" ? x - textWidth / 2 : x;

      return {
        id: `label:${city.id}`,
        kind: "label",
        cityId: city.id,
        bounds: padBounds(
          {
            left,
            top: y - 18,
            right: left + textWidth,
            bottom: y + 8
          },
          10,
          width,
          height
        )
      };
    })
  };
}
```

- [ ] **Step 4: Export the utility**

In `packages/game-data/src/index.ts`, add:

```ts
export { buildBasemapProtectedZones } from "./basemap-protection.js";
export type { BasemapBoardFrame, BasemapBounds, BasemapProtectedZone, BasemapProtectedZones } from "./basemap-protection.js";
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/game-data/src/basemap-protection.ts packages/game-data/src/index.ts packages/game-core/tests/game.test.ts
git commit -m "feat(map): derive basemap protected zones"
```

---

### Task 3: Remove Dotted Overlay From BoardMap

**Files:**
- Modify: `apps/web/src/components/ui/game/BoardMap.tsx`
- Modify: `apps/web/src/styles/ui.css`

- [ ] **Step 1: Remove the SVG pattern definition and both dotted overlay rects**

In `apps/web/src/components/ui/game/BoardMap.tsx`, remove this block:

```tsx
        <defs>
          <pattern id="transit-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.8" fill="rgba(74, 55, 36, 0.30)" />
          </pattern>
        </defs>
```

Also remove the first dotted overlay rect:

```tsx
        {backdropOpacityScale > 0 ? (
          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="url(#transit-grid)" rx="12" style={{ pointerEvents: "none" }} />
        ) : null}
```

And remove the final multiply overlay rect near the bottom of the SVG:

```tsx
        {backdropOpacityScale > 0 ? (
          <rect
            x="0"
            y="0"
            width={boardWidth}
            height={boardHeight}
            fill="url(#transit-grid)"
            rx="12"
            style={{ pointerEvents: "none", mixBlendMode: "multiply" }}
          />
        ) : null}
```

- [ ] **Step 2: Remove CSS assumptions for the second rect**

In `apps/web/src/styles/game.css`, remove or leave harmless any selector that only targeted the old dotted overlay:

```css
.app-shell--gameplay-hud .board-map > rect:nth-of-type(2) {
  opacity: 0.8;
}
```

If this selector appears more than once, remove each duplicate occurrence.

- [ ] **Step 3: Build web**

Run:

```bash
pnpm --filter @hudson-hustle/web build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/game/BoardMap.tsx apps/web/src/styles/game.css
git commit -m "feat(map): remove dotted basemap overlay"
```

---

### Task 4: Render New Optional Backdrop Features

**Files:**
- Modify: `apps/web/src/components/ui/game/BoardMap.tsx`
- Modify: `apps/web/src/styles/ui.css`
- Modify: `packages/game-core/tests/game.test.ts`

- [ ] **Step 1: Add tests for optional backdrop feature bounds**

In `packages/game-core/tests/game.test.ts`, extend the existing `"keeps optional backdrop geometry inside the board frame"` test with:

```ts
    for (const landmark of hudsonHustleBackdrop.landmarks ?? []) {
      if (landmark.point) {
        expect(landmark.point.x).toBeGreaterThanOrEqual(0);
        expect(landmark.point.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(landmark.point.y).toBeGreaterThanOrEqual(0);
        expect(landmark.point.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
      if (landmark.bounds) {
        expect(landmark.bounds.x).toBeGreaterThanOrEqual(0);
        expect(landmark.bounds.y).toBeGreaterThanOrEqual(0);
        expect(landmark.bounds.x + landmark.bounds.width).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(landmark.bounds.y + landmark.bounds.height).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }

    for (const line of hudsonHustleBackdrop.themeLines ?? []) {
      for (const point of line.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }
```

- [ ] **Step 2: Run tests**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: PASS. These fields are optional, so existing configs should still pass.

- [ ] **Step 3: Add theme-line rendering**

In `apps/web/src/components/ui/game/BoardMap.tsx`, after shoreline rendering and before region labels, add:

```tsx
        {shorelineOpacityScale > 0
          ? backdrop.themeLines?.map((line) => (
              <path
                key={line.id}
                d={buildPathD(line.points)}
                className={`theme-line theme-line--${line.kind}`}
                style={{ opacity: (line.opacity ?? 1) * shorelineOpacityScale }}
              />
            ))
          : null}
```

- [ ] **Step 4: Add landmark rendering**

In `apps/web/src/components/ui/game/BoardMap.tsx`, after theme-line rendering and before region labels, add:

```tsx
        {backdropOpacityScale > 0
          ? backdrop.landmarks?.map((landmark) => {
              const opacity = (landmark.opacity ?? 1) * backdropOpacityScale;
              if (landmark.bounds) {
                return (
                  <rect
                    key={landmark.id}
                    x={landmark.bounds.x}
                    y={landmark.bounds.y}
                    width={landmark.bounds.width}
                    height={landmark.bounds.height}
                    rx="10"
                    className={`basemap-landmark basemap-landmark--${landmark.kind}`}
                    style={{ opacity }}
                  />
                );
              }
              if (landmark.point) {
                return (
                  <g key={landmark.id} className={`basemap-landmark basemap-landmark--${landmark.kind}`} style={{ opacity }}>
                    <circle cx={landmark.point.x} cy={landmark.point.y} r="10" />
                    {landmark.label ? (
                      <text x={landmark.point.x + 14} y={landmark.point.y + 4} className="basemap-landmark__label">
                        {landmark.label}
                      </text>
                    ) : null}
                  </g>
                );
              }
              return null;
            })
          : null}
```

- [ ] **Step 5: Add styles**

In `apps/web/src/styles/ui.css`, after `.shoreline` styles, add:

```css
.theme-line {
  fill: none;
  stroke: rgba(72, 54, 34, 0.16);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 3 8;
  pointer-events: none;
}

.theme-line--ferry {
  stroke: rgba(80, 130, 160, 0.22);
  stroke-dasharray: 2 10;
}

.basemap-landmark {
  fill: rgba(85, 103, 82, 0.14);
  stroke: rgba(72, 54, 34, 0.12);
  stroke-width: 1.2;
  pointer-events: none;
}

.basemap-landmark--harbor-island {
  fill: rgba(235, 222, 184, 0.32);
  stroke: rgba(72, 54, 34, 0.16);
}

.basemap-landmark__label {
  fill: rgba(72, 54, 34, 0.2);
  font-family: var(--font-display);
  font-size: var(--type-xs);
  font-weight: 650;
  letter-spacing: 0.06em;
  pointer-events: none;
}
```

- [ ] **Step 6: Build web and run map tests**

Run:

```bash
pnpm --filter @hudson-hustle/web build
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/ui/game/BoardMap.tsx apps/web/src/styles/ui.css packages/game-core/tests/game.test.ts
git commit -m "feat(map): render vector basemap features"
```

---

### Task 5: Add Conservative NYC Basemap Features

**Files:**
- Modify: `configs/hudson-hustle/releases/v0.4-flushing-newark-airport/visuals.json`
- Modify: `packages/game-core/tests/game.test.ts`

- [ ] **Step 1: Add NYC-specific basemap tests**

In `packages/game-core/tests/game.test.ts`, add:

```ts
  it("keeps NYC basemap memory features quiet and board-local", () => {
    const landmarks = hudsonHustleBackdrop.landmarks ?? [];
    const themeLines = hudsonHustleBackdrop.themeLines ?? [];

    expect(landmarks.some((landmark) => landmark.id === "liberty-ellis-harbor-memory")).toBe(true);
    expect(themeLines.some((line) => line.id === "battery-liberty-ferry-memory")).toBe(true);

    for (const landmark of landmarks) {
      expect(landmark.priority ?? "low").not.toBe("high");
      expect(landmark.opacity ?? 1).toBeLessThanOrEqual(0.35);
    }

    for (const line of themeLines) {
      expect(line.priority ?? "low").not.toBe("high");
      expect(line.opacity ?? 1).toBeLessThanOrEqual(0.32);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: FAIL because the NYC landmarks and theme line do not exist yet.

- [ ] **Step 3: Update `visuals.json`**

In `configs/hudson-hustle/releases/v0.4-flushing-newark-airport/visuals.json`, inside `backdrop`, keep existing `landAreas`, `waterAreas`, `shorelines`, and `regionLabels`, then add:

```json
    "landmarks": [
      {
        "id": "liberty-ellis-harbor-memory",
        "kind": "harbor-island",
        "bounds": { "x": 344, "y": 742, "width": 70, "height": 34 },
        "label": "Harbor",
        "opacity": 0.22,
        "priority": "low"
      },
      {
        "id": "battery-harbor-edge",
        "kind": "waterfront",
        "bounds": { "x": 612, "y": 640, "width": 72, "height": 26 },
        "opacity": 0.18,
        "priority": "low"
      },
      {
        "id": "queens-waterfront-memory",
        "kind": "waterfront",
        "bounds": { "x": 812, "y": 338, "width": 86, "height": 30 },
        "opacity": 0.16,
        "priority": "low"
      }
    ],
    "themeLines": [
      {
        "id": "battery-liberty-ferry-memory",
        "kind": "ferry",
        "points": [
          { "x": 646, "y": 640 },
          { "x": 560, "y": 704 },
          { "x": 410, "y": 760 }
        ],
        "opacity": 0.22,
        "priority": "low"
      }
    ],
    "generatedBy": {
      "recipeId": "nyc-harbor-memory-v1",
      "generatorVersion": "manual-pilot-2026-05-13",
      "acceptedAt": "2026-05-13",
      "notes": [
        "Manual pilot for the AI-assisted vector basemap pipeline.",
        "Features are intentionally low contrast and placed outside core route/label corridors."
      ]
    }
```

Place the new fields after `regionLabels` and before the closing brace of `backdrop`. Keep valid JSON commas.

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: PASS.

- [ ] **Step 5: Refresh registry and preview active config**

Run:

```bash
pnpm config:registry
pnpm config:preview v0.4-flushing-newark-airport
```

Expected:
- registry generation completes
- preview shows `active: true`
- preview still reports the same station and route counts

- [ ] **Step 6: Commit**

```bash
git add configs/hudson-hustle/releases/v0.4-flushing-newark-airport/visuals.json packages/game-data/src/generated-config-registry.ts packages/game-core/tests/game.test.ts
git commit -m "feat(map): add NYC basemap memory features"
```

---

### Task 6: Document The Three-Layer Basemap Model

**Files:**
- Modify: `configs/hudson-hustle/README.md`
- Modify: `docs/map/cartography-workflow.md`

- [ ] **Step 1: Update config snapshot README**

In `configs/hudson-hustle/README.md`, under “Snapshot Files”, replace the `visuals.json` bullet detail with:

```md
- `visuals.json`
  - theme, backdrop mode, board label mode, palettes, and config-backed vector basemap data
  - long-term board rendering uses three visible layers:
    1. board surface
    2. config-backed backdrop geometry
    3. gameplay routes, stations, labels, claims, hit targets, and highlights
```

- [ ] **Step 2: Update cartography workflow**

In `docs/map/cartography-workflow.md`, after “Core Principle”, add:

```md
## Basemap Principle

Basemap work should be **神似，不追求形似**.

Use real references to preserve place meaning, not to copy literal map geometry. The basemap should trigger recognition through broad geography, water relationships, terrain, and a few quiet landmarks while staying subordinate to the gameplay graph.

Before adding landmarks, theme lines, or terrain details, reserve protected zones around:

- route corridors
- station rings
- station labels
- route claim badge positions
- selected and highlighted station states

The background may explain a route crossing, such as Exchange Place to World Trade crossing the Hudson River, but it must never make that route harder to inspect.
```

- [ ] **Step 3: Commit**

```bash
git add configs/hudson-hustle/README.md docs/map/cartography-workflow.md
git commit -m "docs(map): document basemap generation rules"
```

---

### Task 7: Full Verification And Browser Smoke

**Files:**
- No planned source edits unless verification finds a bug.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --filter @hudson-hustle/game-core test -- game.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Start the web app**

Run:

```bash
pnpm dev:web
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 4: Browser smoke**

Open the local Vite URL in the browser and verify:

- the board no longer shows the dotted overlay
- water and land geometry remain behind all routes/stations/labels
- the new harbor/ferry memory features are subtle
- Exchange Place to World Trade still reads as a playable route crossing the Hudson
- station labels remain readable
- resizing the browser preserves basemap/gameplay alignment

- [ ] **Step 5: Stop the dev server**

Stop the running `pnpm dev:web` process after the smoke check.

- [ ] **Step 6: Commit verification fixes if needed**

If verification required visual tuning, commit only those scoped fixes:

```bash
git add apps/web/src/components/ui/game/BoardMap.tsx apps/web/src/styles/ui.css configs/hudson-hustle/releases/v0.4-flushing-newark-airport/visuals.json packages/game-core/tests/game.test.ts
git commit -m "fix(map): tune NYC basemap readability"
```

If no fixes were needed, do not create an empty commit.

---

## Final Definition Of Done

- Branch remains `basemap-refinement-pipeline`.
- `current.json` is unchanged.
- Dotted overlay is gone from the board render path.
- `BoardBackdrop` supports optional vector basemap landmarks, theme lines, and generation metadata.
- Protected-zone utility exists and is tested.
- NYC/Hudson active release includes a conservative vector basemap pilot.
- Docs explain the three-layer model and “神似，不追求形似” basemap rule.
- `pnpm --filter @hudson-hustle/game-core test -- game.test.ts` passes.
- `pnpm build` passes.
- Browser smoke confirms resize alignment and route/label readability.
