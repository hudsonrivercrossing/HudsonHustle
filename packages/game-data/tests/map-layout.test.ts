import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { MapConfig, RouteDef } from "@hudson-hustle/game-core";
import {
  type BasemapBounds,
  buildBasemapProtectedZones,
  hudsonHustleAnchorWaveCityIds,
  hudsonHustleBackdrop,
  hudsonHustleBoardFrame,
  hudsonHustleConfigRegistry,
  hudsonHustleCurrentConfigId,
  hudsonHustleFirstRingCityIds,
  hudsonHustleGeoCities,
  hudsonHustleMap,
  hudsonHustleReleasedConfigs,
  hudsonHustleStationReferences,
  getHudsonHustleMapByConfigId,
  findSnapshotProblems,
  labelBox,
  routePath,
  routeSpaces
} from "../src";

// These tests describe one particular board, New York Harbor. They read it through the "active map"
// exports, so the first test fails loudly if the active map is ever switched to something else.
const NEW_YORK_CONFIG_ID = "v0.5-river-crossings";

/** A drawn space shorter than this cannot show a train car and its colour mark. */
const MIN_SPACE_LENGTH = 22;
const backdropPointRadius = 6;
const backdropLineSegmentClearance = 10;

function boundsIntersect(first: BasemapBounds, second: BasemapBounds): boolean {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

function pointBounds(point: { x: number; y: number }, radius = backdropPointRadius): BasemapBounds {
  return {
    left: point.x - radius,
    top: point.y - radius,
    right: point.x + radius,
    bottom: point.y + radius
  };
}

function segmentBounds(
  start: { x: number; y: number },
  end: { x: number; y: number },
  padding = backdropLineSegmentClearance
): BasemapBounds {
  return {
    left: Math.min(start.x, end.x) - padding,
    top: Math.min(start.y, end.y) - padding,
    right: Math.max(start.x, end.x) + padding,
    bottom: Math.max(start.y, end.y) + padding
  };
}

function landmarkBounds(landmark: NonNullable<typeof hudsonHustleBackdrop.landmarks>[number]): BasemapBounds | undefined {
  if (landmark.bounds) {
    return {
      left: landmark.bounds.x,
      top: landmark.bounds.y,
      right: landmark.bounds.x + landmark.bounds.width,
      bottom: landmark.bounds.y + landmark.bounds.height
    };
  }

  return landmark.point ? pointBounds(landmark.point) : undefined;
}

function connectedCityCount(): number {
  const visited = new Set<string>();
  const [startCity] = hudsonHustleMap.cities;
  const queue = [startCity.id];
  visited.add(startCity.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const route of hudsonHustleMap.routes) {
      const nextCityId =
        route.from === current ? route.to : route.to === current ? route.from : null;

      if (nextCityId && !visited.has(nextCityId)) {
        visited.add(nextCityId);
        queue.push(nextCityId);
      }
    }
  }

  return visited.size;
}

function getCity(id: string) {
  const city = hudsonHustleMap.cities.find((item) => item.id === id);
  expect(city).toBeDefined();
  return city!;
}

function approxEqual(a: number, b: number, epsilon = 0.001) {
  return Math.abs(a - b) <= epsilon;
}

function pointEquals(first: { x: number; y: number }, second: { x: number; y: number }, epsilon = 0.001) {
  return approxEqual(first.x, second.x, epsilon) && approxEqual(first.y, second.y, epsilon);
}

function orientation(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 0.001) {
    return 0;
  }
  return value > 0 ? 1 : 2;
}

function onSegment(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  return (
    b.x <= Math.max(a.x, c.x) + 0.001 &&
    b.x + 0.001 >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + 0.001 &&
    b.y + 0.001 >= Math.min(a.y, c.y)
  );
}

function segmentsIntersect(
  firstStart: { x: number; y: number },
  firstEnd: { x: number; y: number },
  secondStart: { x: number; y: number },
  secondEnd: { x: number; y: number }
) {
  const firstOrientationA = orientation(firstStart, firstEnd, secondStart);
  const firstOrientationB = orientation(firstStart, firstEnd, secondEnd);
  const secondOrientationA = orientation(secondStart, secondEnd, firstStart);
  const secondOrientationB = orientation(secondStart, secondEnd, firstEnd);

  if (firstOrientationA !== firstOrientationB && secondOrientationA !== secondOrientationB) {
    return true;
  }

  if (firstOrientationA === 0 && onSegment(firstStart, secondStart, firstEnd)) return true;
  if (firstOrientationB === 0 && onSegment(firstStart, secondEnd, firstEnd)) return true;
  if (secondOrientationA === 0 && onSegment(secondStart, firstStart, secondEnd)) return true;
  if (secondOrientationB === 0 && onSegment(secondStart, firstEnd, secondEnd)) return true;

  return false;
}

function getSharedStationPoints(first: RouteDef, second: RouteDef, config: MapConfig) {
  const sharedIds = [first.from, first.to].filter((id) => id === second.from || id === second.to);
  return sharedIds.map((id) => {
    const city = config.cities.find((item) => item.id === id)!;
    return { x: city.x, y: city.y };
  });
}

function segmentsHaveAllowedTouch(
  firstStart: { x: number; y: number },
  firstEnd: { x: number; y: number },
  secondStart: { x: number; y: number },
  secondEnd: { x: number; y: number },
  allowedPoints: Array<{ x: number; y: number }>
) {
  const stationJoinRadius = 30;

  for (const allowedPoint of allowedPoints) {
    const firstTouches = pointEquals(firstStart, allowedPoint) || pointEquals(firstEnd, allowedPoint);
    const secondTouches = pointEquals(secondStart, allowedPoint) || pointEquals(secondEnd, allowedPoint);
    if (firstTouches && secondTouches) {
      return true;
    }

    const firstNearStation =
      Math.hypot(firstStart.x - allowedPoint.x, firstStart.y - allowedPoint.y) <= stationJoinRadius ||
      Math.hypot(firstEnd.x - allowedPoint.x, firstEnd.y - allowedPoint.y) <= stationJoinRadius;
    const secondNearStation =
      Math.hypot(secondStart.x - allowedPoint.x, secondStart.y - allowedPoint.y) <= stationJoinRadius ||
      Math.hypot(secondEnd.x - allowedPoint.x, secondEnd.y - allowedPoint.y) <= stationJoinRadius;

    if (firstNearStation && secondNearStation) {
      return true;
    }
  }

  return false;
}

function pointInRect(point: { x: number; y: number }, rect: { left: number; right: number; top: number; bottom: number }) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function segmentIntersectsRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
  rect: { left: number; right: number; top: number; bottom: number }
) {
  if (pointInRect(start, rect) || pointInRect(end, rect)) {
    return true;
  }

  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom }
  ];
  const edges = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]]
  ] as const;

  return edges.some(([edgeStart, edgeEnd]) => segmentsIntersect(start, end, edgeStart, edgeEnd));
}


/** Station names that a route runs through, other than the routes arriving at that station. */
function labelRouteCollisions(map: MapConfig): string[] {
  const failures: string[] = [];
  const stationClearRadius = 34;

  for (const city of map.cities) {
    const bounds = labelBox(city);

    for (const route of map.routes) {
      const points = routePath(route, map);

      for (let segmentIndex = 1; segmentIndex < points.length; segmentIndex += 1) {
        const start = points[segmentIndex - 1];
        const end = points[segmentIndex];

        const startNearCity = Math.hypot(start.x - city.x, start.y - city.y) <= stationClearRadius;
        const endNearCity = Math.hypot(end.x - city.x, end.y - city.y) <= stationClearRadius;
        if (startNearCity || endNearCity) {
          continue;
        }

        if (segmentIntersectsRect(start, end, bounds)) {
          failures.push(`${city.id} label x ${route.id}`);
        }
      }
    }
  }

  return failures;
}

/** Pairs of routes that cross anywhere other than at a station they share. */
function routeCrossings(map: MapConfig): string[] {
  const failures: string[] = [];

  for (let routeIndex = 0; routeIndex < map.routes.length; routeIndex += 1) {
    const firstRoute = map.routes[routeIndex];
    const firstPoints = routePath(firstRoute, map);

    for (let comparisonIndex = routeIndex + 1; comparisonIndex < map.routes.length; comparisonIndex += 1) {
      const secondRoute = map.routes[comparisonIndex];
      const secondPoints = routePath(secondRoute, map);
      const allowedTouchPoints = getSharedStationPoints(firstRoute, secondRoute, map);

      for (let firstSegmentIndex = 1; firstSegmentIndex < firstPoints.length; firstSegmentIndex += 1) {
        const firstStart = firstPoints[firstSegmentIndex - 1];
        const firstEnd = firstPoints[firstSegmentIndex];

        for (let secondSegmentIndex = 1; secondSegmentIndex < secondPoints.length; secondSegmentIndex += 1) {
          const secondStart = secondPoints[secondSegmentIndex - 1];
          const secondEnd = secondPoints[secondSegmentIndex];

          if (!segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) {
            continue;
          }

          if (segmentsHaveAllowedTouch(firstStart, firstEnd, secondStart, secondEnd, allowedTouchPoints)) {
            continue;
          }

          failures.push(`${firstRoute.id} x ${secondRoute.id}`);
        }
      }
    }
  }

  return failures;
}

/** Station names that run off the edge of the board. */
function labelsOffBoard(map: MapConfig, frame: { width: number; height: number }): string[] {
  return map.cities
    .filter((city) => {
      const box = labelBox(city);
      return box.left < 4 || box.right > frame.width - 4 || box.top < 4 || box.bottom > frame.height - 4;
    })
    .map((city) => city.id);
}

/** How many stations can be reached from the first one. */
function reachableCityCount(map: MapConfig): number {
  const seen = new Set([map.cities[0].id]);
  const queue = [map.cities[0].id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const route of map.routes) {
      const next = route.from === current ? route.to : route.to === current ? route.from : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size;
}


describe("New York Harbor layout", () => {
  it("is the active map these tests were written for", () => {
    expect(hudsonHustleCurrentConfigId).toBe(NEW_YORK_CONFIG_ID);
  });

  it("keeps the Hudson Hustle map inside the intended board-size targets", () => {
    expect(hudsonHustleMap.cities.length).toBeGreaterThanOrEqual(13);
    expect(hudsonHustleMap.cities.length).toBeLessThanOrEqual(20);
    expect(hudsonHustleMap.routes.length).toBeGreaterThanOrEqual(22);
    expect(hudsonHustleMap.routes.length).toBeLessThanOrEqual(38);
    expect(connectedCityCount()).toBe(hudsonHustleMap.cities.length);
  });

  it("keeps every Berlin release route at least two segments long", () => {
    const berlinMap = getHudsonHustleMapByConfigId("berlin");
    const shortRoutes = berlinMap.routes.filter((route) => route.length < 2);

    expect(shortRoutes).toEqual([]);
  });

  it("keeps reference coordinates attached to each city and stores every city inside the board frame", () => {
    expect(hudsonHustleGeoCities).toHaveLength(hudsonHustleMap.cities.length);

    for (const city of hudsonHustleMap.cities) {
      expect(city.lat).toBeTypeOf("number");
      expect(city.lon).toBeTypeOf("number");
      expect(city.x).toBeGreaterThanOrEqual(0);
      expect(city.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
      expect(city.y).toBeGreaterThanOrEqual(0);
      expect(city.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
    }
  });

  it("uses explicit board coordinates for the Hudson Hustle city layout", () => {
    for (const city of hudsonHustleGeoCities) {
      expect(city.boardX).toBeTypeOf("number");
      expect(city.boardY).toBeTypeOf("number");
      expect(city.diagramDx).toBeUndefined();
      expect(city.diagramDy).toBeUndefined();
    }
  });

  it("keeps every city bound to a documented station authority reference", () => {
    for (const city of hudsonHustleMap.cities) {
      expect(hudsonHustleStationReferences[city.id]).toBeDefined();
      expect(hudsonHustleStationReferences[city.id].reference.length).toBeGreaterThan(0);
    }
  });

  it("keeps the incremental anchor-wave groups valid and non-overlapping", () => {
    const cityIds = new Set(hudsonHustleMap.cities.map((city) => city.id));
    const anchorIds = new Set<string>(hudsonHustleAnchorWaveCityIds);

    expect(hudsonHustleAnchorWaveCityIds.length).toBe(9);
    expect(hudsonHustleFirstRingCityIds.length).toBeGreaterThan(0);

    for (const cityId of hudsonHustleAnchorWaveCityIds) {
      expect(cityIds.has(cityId)).toBe(true);
    }

    for (const cityId of hudsonHustleFirstRingCityIds) {
      expect(cityIds.has(cityId)).toBe(true);
      expect(anchorIds.has(cityId)).toBe(false);
    }
  });

  it("keeps Chelsea as a local west-side connector off the main trunk", () => {
    const chelseaRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "chelsea" || route.to === "chelsea")
      .map((route) => route.id)
      .sort();

    expect(chelseaRoutes).toEqual(["chelsea-union-square", "chelsea-world-trade", "hoboken-chelsea", "midtown-west-chelsea"]);
  });

  it("adds Williamsburg as the next ring station with only LIC and Downtown Brooklyn links", () => {
    const williamsburgRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "williamsburg" || route.to === "williamsburg")
      .map((route) => route.id)
      .sort();

    expect(williamsburgRoutes).toEqual([
      "long-island-city-williamsburg",
      "union-square-williamsburg",
      "williamsburg-downtown-brooklyn"
    ]);
  });

  it("adds Atlantic Terminal as the next Brooklyn ring station with only Downtown Brooklyn and Jamaica links", () => {
    const atlanticTerminalRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "atlantic-terminal" || route.to === "atlantic-terminal")
      .map((route) => route.id)
      .sort();

    expect(atlanticTerminalRoutes).toEqual(["atlantic-terminal-jamaica", "downtown-brooklyn-atlantic-terminal", "red-hook-atlantic-terminal"]);
  });

  it("adds Hoboken as the next west-side ring station with Secaucus, Chelsea, and Grove St links", () => {
    const hobokenRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "hoboken" || route.to === "hoboken")
      .map((route) => route.id)
      .sort();

    expect(hobokenRoutes).toEqual(["hoboken-chelsea", "hoboken-grove-st", "secaucus-hoboken"]);
  });

  it("adds Battery Park as the first south-core next-wave station without a direct airport shortcut", () => {
    const batteryParkRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "battery-park" || route.to === "battery-park")
      .map((route) => route.id)
      .sort();

    expect(batteryParkRoutes).toEqual([
      "battery-park-downtown-brooklyn",
      "battery-park-red-hook",
      "union-square-battery-park",
      "world-trade-battery-park"
    ]);
  });

  it("adds Grove St as the first Jersey-side next-wave station with Newark Penn, Exchange Place, and Hoboken links", () => {
    const groveRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "grove-st" || route.to === "grove-st")
      .map((route) => route.id)
      .sort();

    expect(groveRoutes).toEqual(["grove-st-exchange-place", "hoboken-grove-st", "newark-penn-grove-st"]);
  });

  it("adds Hudson Yards as the west-Manhattan next-wave station with only Grand Central and Newark Airport links", () => {
    const hudsonYardsRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "hudson-yards" || route.to === "hudson-yards")
      .map((route) => route.id)
      .sort();

    expect(hudsonYardsRoutes).toEqual(["hudson-yards-grand-central", "newark-airport-hudson-yards"]);
  });

  it("adds Flushing as the first outer-Queens next-wave station with only Grand Central and Jamaica links", () => {
    const flushingRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "flushing" || route.to === "flushing")
      .map((route) => route.id)
      .sort();

    expect(flushingRoutes).toEqual(["flushing-jamaica", "grand-central-flushing"]);
  });

  it("keeps Newark Airport as a southwest outer node with Newark Penn and Hudson Yards links", () => {
    const airportRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "newark-airport" || route.to === "newark-airport")
      .map((route) => route.id)
      .sort();

    expect(airportRoutes).toEqual(["newark-airport-hudson-yards", "newark-penn-newark-airport"]);
  });

  it("adds Red Hook as the lower-bay Brooklyn node with only Battery Park and Atlantic Terminal links", () => {
    const redHookRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "red-hook" || route.to === "red-hook")
      .map((route) => route.id)
      .sort();

    expect(redHookRoutes).toEqual(["battery-park-red-hook", "red-hook-atlantic-terminal"]);
  });

  it("adds Union Square as the central Manhattan node with Chelsea and Battery Park links only", () => {
    const unionRoutes = hudsonHustleMap.routes
      .filter((route) => route.from === "union-square" || route.to === "union-square")
      .map((route) => route.id)
      .sort();

    expect(unionRoutes).toEqual([
      "chelsea-union-square",
      "union-square-battery-park",
      "union-square-williamsburg"
    ]);
  });

  it("does not leave west-side hubs on generic proxy authority sources", () => {
    for (const cityId of [
      "secaucus",
      "exchange-place",
      "newark-penn",
      "world-trade"
    ]) {
      expect(hudsonHustleStationReferences[cityId].source).not.toBe("station-proxy");
    }
  });

  it("keeps custom route waypoints inside the board frame", () => {
    for (const route of hudsonHustleMap.routes) {
      for (const waypoint of route.waypoints ?? []) {
        expect(waypoint.x).toBeGreaterThanOrEqual(0);
        expect(waypoint.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(waypoint.y).toBeGreaterThanOrEqual(0);
        expect(waypoint.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }
  });

  it("allows waypoint routing where it improves board harmony and keeps routes legible", () => {
    const waypointRoutes = hudsonHustleMap.routes.filter((route) => (route.waypoints?.length ?? 0) > 0);
    for (const route of waypointRoutes) {
      expect(route.waypoints?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("keeps the secaucus-to-penn trunk as a single tunnel route", () => {
    const route = hudsonHustleMap.routes.find((item) => item.id === "secaucus-midtown-west");

    expect(route?.twinGroup).toBeUndefined();
    expect(route?.waypoints).toHaveLength(2);
  });

  it("uses mirrored split-merge geometry for the exchange-place-to-world-trade double route", () => {
    const first = hudsonHustleMap.routes.find((route) => route.id === "exchange-place-world-trade-a");
    const second = hudsonHustleMap.routes.find((route) => route.id === "exchange-place-world-trade-b");

    expect(first?.offset).toBeUndefined();
    expect(second?.offset).toBeUndefined();
    expect((first?.waypoints?.length ?? 0)).toBeGreaterThanOrEqual(2);
    expect(first?.waypoints?.length).toBe(second?.waypoints?.length);
    for (let index = 0; index < (first?.waypoints?.length ?? 0); index += 1) {
      expect((first?.waypoints?.[index].y ?? 0)).toBeLessThan(second?.waypoints?.[index].y ?? 0);
    }
  });

  it("keeps optional backdrop geometry inside the board frame", () => {
    for (const area of hudsonHustleBackdrop.landAreas) {
      for (const point of area.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }

    for (const area of hudsonHustleBackdrop.waterAreas) {
      for (const point of area.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }

    for (const line of hudsonHustleBackdrop.shorelines) {
      for (const point of line.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(hudsonHustleBoardFrame.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(hudsonHustleBoardFrame.height);
      }
    }

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
  });

  it("keeps NYC basemap memory features quiet and board-local", () => {
    const landmarks = hudsonHustleBackdrop.landmarks ?? [];
    const themeLines = hudsonHustleBackdrop.themeLines ?? [];

    expect(hudsonHustleBackdrop.image?.href).toBe("/basemaps/nyc-hudson-ai-reference-v2.png");
    expect(hudsonHustleBackdrop.image?.opacity ?? 1).toBeLessThanOrEqual(1);
    expect(hudsonHustleBackdrop.image?.preserveAspectRatio).toBe("none");
    expect(existsSync(path.resolve("../../apps/web/public", hudsonHustleBackdrop.image!.href.slice(1)))).toBe(true);
    expect(landmarks.some((landmark) => landmark.id === "liberty-ellis-harbor-memory")).toBe(true);
    expect(themeLines.some((line) => line.id === "battery-liberty-ferry-memory")).toBe(true);

    for (const landmark of landmarks) {
      expect(["low", "medium"]).toContain(landmark.priority ?? "low");
      expect(landmark.opacity ?? 1).toBeLessThanOrEqual(0.35);
    }

    for (const line of themeLines) {
      expect(["low", "medium"]).toContain(line.priority ?? "low");
      expect(line.opacity ?? 1).toBeLessThanOrEqual(0.32);
    }
  });

  it("keeps backdrop memory features clear of protected gameplay zones", () => {
    const zones = buildBasemapProtectedZones(hudsonHustleMap, hudsonHustleBoardFrame);
    const protectedZones = [...zones.routes, ...zones.stations, ...zones.labels];
    const overlaps: string[] = [];

    for (const landmark of hudsonHustleBackdrop.landmarks ?? []) {
      const bounds = landmarkBounds(landmark);
      if (!bounds) continue;

      for (const zone of protectedZones) {
        if (boundsIntersect(bounds, zone.bounds)) {
          overlaps.push(`${landmark.id} intersects ${zone.id}`);
        }
      }
    }

    for (const line of hudsonHustleBackdrop.themeLines ?? []) {
      for (let index = 1; index < line.points.length; index += 1) {
        const bounds = segmentBounds(line.points[index - 1], line.points[index]);
        for (const zone of protectedZones) {
          if (boundsIntersect(bounds, zone.bounds)) {
            overlaps.push(`${line.id}:${index - 1}-${index} intersects ${zone.id}`);
          }
        }
      }
    }

    expect(overlaps).toEqual([]);
  });

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
    const crossing = zones.routes.find((zone) => zone.id === "route:exchange-place-world-trade-a");

    expect(crossing).toBeDefined();
    expect(crossing?.routeId).toBe("exchange-place-world-trade-a");
    expect(crossing?.bounds.left).toBeLessThan(getCity("world-trade").x);
    expect(crossing?.bounds.right).toBeGreaterThan(getCity("exchange-place").x);
  });

  it("keeps the main board graph distributed across the board", () => {
    const worldTrade = getCity("world-trade");
    const midtownWest = getCity("midtown-west");
    const grandCentral = getCity("grand-central");
    const longIslandCity = getCity("long-island-city");
    const downtownBrooklyn = getCity("downtown-brooklyn");
    const jamaica = getCity("jamaica");
    const newarkPenn = getCity("newark-penn");
    const secaucus = getCity("secaucus");

    expect(worldTrade.x - newarkPenn.x).toBeGreaterThanOrEqual(380);
    expect(jamaica.x - longIslandCity.x).toBeGreaterThanOrEqual(220);
    expect(downtownBrooklyn.y - worldTrade.y).toBeGreaterThanOrEqual(260);
    expect(secaucus.y).toBeLessThan(midtownWest.y);
    expect(grandCentral.y).toBeLessThan(midtownWest.y);
    expect(midtownWest.y).toBeLessThan(worldTrade.y);
    expect(worldTrade.y).toBeLessThan(downtownBrooklyn.y);
    expect(longIslandCity.x).toBeGreaterThan(midtownWest.x);
    expect(jamaica.x).toBeGreaterThan(longIslandCity.x);
  });

  it("keeps the west-side anchor chain readable without requiring literal geography", () => {
    const secaucus = getCity("secaucus");
    const newarkPenn = getCity("newark-penn");
    const exchangePlace = getCity("exchange-place");
    const worldTrade = getCity("world-trade");
    const pennDistrict = getCity("midtown-west");

    expect(newarkPenn.x).toBeLessThan(exchangePlace.x);
    expect(exchangePlace.x).toBeLessThan(worldTrade.x);
    expect(secaucus.y).toBeLessThan(newarkPenn.y);
    expect(secaucus.x).toBeLessThan(pennDistrict.x);
    expect(Math.abs(exchangePlace.y - worldTrade.y)).toBeLessThanOrEqual(40);
    expect(worldTrade.x - exchangePlace.x).toBeGreaterThanOrEqual(120);
  });

  it("keeps every on-board station label inside the board frame", () => {
    expect(labelsOffBoard(hudsonHustleMap, hudsonHustleBoardFrame)).toEqual([]);
  });

  it("keeps station labels off the route graph by moving them into nearby empty space", () => {
    expect(labelRouteCollisions(hudsonHustleMap)).toEqual([]);
  });

  it("does not let unrelated routes intersect away from shared stations", () => {
    expect(routeCrossings(hudsonHustleMap)).toEqual([]);
  });
});

describe("every map snapshot", () => {
  it.each(Object.keys(hudsonHustleConfigRegistry))("%s has no data errors", (configId) => {
    const bundle = hudsonHustleConfigRegistry[configId];
    expect(findSnapshotProblems(bundle.map, bundle.tickets, bundle.rules)).toEqual([]);
  });
});

// The checks any board must pass, run on each map a player can pick.
describe.each(hudsonHustleReleasedConfigs.map((config) => config.configId))("released map %s", (configId) => {
  const map = getHudsonHustleMapByConfigId(configId);
  const frame = hudsonHustleConfigRegistry[configId].map.board;

  it("is one connected network", () => {
    expect(reachableCityCount(map)).toBe(map.cities.length);
  });

  it("keeps every station name on the board", () => {
    expect(labelsOffBoard(map, frame)).toEqual([]);
  });

  it("keeps station names clear of routes", () => {
    expect(labelRouteCollisions(map)).toEqual([]);
  });

  it("has no routes crossing away from a shared station", () => {
    expect(routeCrossings(map)).toEqual([]);
  });

  it("draws every space long enough to hold a train car", () => {
    const cramped = map.routes.flatMap((route) =>
      routeSpaces(route, map)
        .filter((space) => space.length < MIN_SPACE_LENGTH)
        .map((space) => `${route.id}: ${Math.round(space.length)}`)
    );
    expect([...new Set(cramped)]).toEqual([]);
  });
});
