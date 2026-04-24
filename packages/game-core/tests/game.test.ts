import { describe, expect, it } from "vitest";
import { getTicketProgress, startGame, reduceGame } from "../src/game";
import type { CityDef, GameState, MapConfig, RouteDef } from "../src/types";
import {
  hudsonHustleAnchorWaveCityIds,
  hudsonHustleBackdrop,
  hudsonHustleBoardFrame,
  hudsonHustleFirstRingCityIds,
  hudsonHustleGeoCities,
  hudsonHustleMap,
  hudsonHustleStationReferences
} from "../../game-data/src";

function forcePlayerHand(state: GameState, colors: Array<GameState["players"][number]["hand"][number]["color"]>): GameState {
  const nextState = structuredClone(state);
  nextState.players[nextState.activePlayerIndex].hand = colors.map((color, index) => ({
    id: `forced-${index}`,
    color
  }));
  return nextState;
}

function finishInitialTickets(state: GameState, config: MapConfig = hudsonHustleMap): GameState {
  let nextState = state;
  while (nextState.phase === "initialTickets") {
    const player = nextState.players[nextState.activePlayerIndex];
    nextState = reduceGame(
      nextState,
      {
        type: "select_initial_tickets",
        keptTicketIds: player.pendingTickets.slice(0, 2).map((ticket) => ticket.id)
      },
      config
    );
  }
  return nextState;
}

const exhaustedDoubleRouteMap: MapConfig = {
  id: "exhausted-double-route-test",
  name: "Exhausted Double Route Test",
  cities: [
    { id: "alpha", name: "Alpha", x: 0, y: 0 },
    { id: "bravo", name: "Bravo", x: 100, y: 0 }
  ],
  routes: [
    {
      id: "alpha-bravo-a",
      from: "alpha",
      to: "bravo",
      length: 2,
      color: "obsidian",
      type: "normal",
      twinGroup: "alpha-bravo"
    },
    {
      id: "alpha-bravo-b",
      from: "alpha",
      to: "bravo",
      length: 2,
      color: "amber",
      type: "normal",
      twinGroup: "alpha-bravo"
    }
  ],
  tickets: [
    { id: "long-1", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-2", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-3", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-4", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "regular-1", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-2", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-3", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-4", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-5", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-6", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-7", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-8", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-9", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-10", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-11", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-12", from: "alpha", to: "bravo", points: 3, bucket: "regular" }
  ],
  settings: {
    trainsPerPlayer: 8,
    stationsPerPlayer: 3,
    longestRouteBonus: 10,
    stationValue: 4
  }
};

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

function getPathPoints(route: RouteDef, config: MapConfig) {
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

function estimateLabelBounds(city: CityDef) {
  const text = city.label ?? city.name;
  const labelX = city.x + (city.labelDx ?? 0);
  const labelY = city.y + (city.labelDy ?? -18);
  const width = text.length * 7.1;
  const anchor = city.labelAnchor ?? "start";
  const left =
    anchor === "end" ? labelX - width : anchor === "middle" ? labelX - width / 2 : labelX;

  return {
    left,
    right: left + width,
    top: labelY - 14,
    bottom: labelY + 2
  };
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


describe("game-core", () => {
  it("keeps the Hudson Hustle map inside the intended board-size targets", () => {
    expect(hudsonHustleMap.cities.length).toBeGreaterThanOrEqual(13);
    expect(hudsonHustleMap.cities.length).toBeLessThanOrEqual(20);
    expect(hudsonHustleMap.routes.length).toBeGreaterThanOrEqual(22);
    expect(hudsonHustleMap.routes.length).toBeLessThanOrEqual(38);
    expect(connectedCityCount()).toBe(hudsonHustleMap.cities.length);
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
    for (const city of hudsonHustleMap.cities) {
      const bounds = estimateLabelBounds(city);
      expect(bounds.left).toBeGreaterThanOrEqual(4);
      expect(bounds.right).toBeLessThanOrEqual(hudsonHustleBoardFrame.width - 4);
      expect(bounds.top).toBeGreaterThanOrEqual(4);
      expect(bounds.bottom).toBeLessThanOrEqual(hudsonHustleBoardFrame.height - 4);
    }
  });

  it("keeps station labels off the route graph by moving them into nearby empty space", () => {
    const failures: string[] = [];
    const stationClearRadius = 34;

    for (const city of hudsonHustleMap.cities) {
      const bounds = estimateLabelBounds(city);

      for (const route of hudsonHustleMap.routes) {
        const points = getPathPoints(route, hudsonHustleMap);

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

    expect(failures).toEqual([]);
  });

  it("does not let unrelated routes intersect away from shared stations", () => {
    const failures: string[] = [];

    for (let routeIndex = 0; routeIndex < hudsonHustleMap.routes.length; routeIndex += 1) {
      const firstRoute = hudsonHustleMap.routes[routeIndex];
      const firstPoints = getPathPoints(firstRoute, hudsonHustleMap);

      for (let comparisonIndex = routeIndex + 1; comparisonIndex < hudsonHustleMap.routes.length; comparisonIndex += 1) {
        const secondRoute = hudsonHustleMap.routes[comparisonIndex];
        const secondPoints = getPathPoints(secondRoute, hudsonHustleMap);
        const allowedTouchPoints = getSharedStationPoints(firstRoute, secondRoute, hudsonHustleMap);

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

    expect(failures).toEqual([]);
  });

  it("creates a deterministic setup with the same seed", () => {
    const first = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    const second = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    expect(first.players[0].hand.map((card) => card.color)).toEqual(second.players[0].hand.map((card) => card.color));
    expect(first.market.map((card) => card.color)).toEqual(second.market.map((card) => card.color));
  });

  it("requires each player to keep at least two starting tickets", () => {
    const state = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    expect(() =>
      reduceGame(
        state,
        {
          type: "select_initial_tickets",
          keptTicketIds: [state.players[0].pendingTickets[0].id]
        },
        hudsonHustleMap
      )
    ).toThrow(/Keep at least two tickets/);
  });

  it("allows a player to draw two cards unless the first is a face-up locomotive", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 }));
    state.market[0] = { id: "loco", color: "locomotive" };
    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 0 }, hudsonHustleMap);
    expect(state.turn.stage).toBe("awaitingHandoff");
    expect(state.players[0].hand.at(-1)?.color).toBe("locomotive");
  });

  it("refreshes the full face-up market when three locomotives are showing", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 8 }));
    state.market = [
      { id: "m1", color: "locomotive" },
      { id: "m2", color: "locomotive" },
      { id: "m3", color: "locomotive" },
      { id: "m4", color: "obsidian" },
      { id: "m5", color: "amber" }
    ];
    state.trainDeck = [
      { id: "d1", color: "cobalt" },
      { id: "d2", color: "rose" },
      { id: "d3", color: "emerald" },
      { id: "d4", color: "violet" },
      { id: "d5", color: "amber" },
      { id: "d6", color: "obsidian" }
    ];
    state.discardPile = [];

    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 3 }, hudsonHustleMap);

    expect(state.players[0].hand.at(-1)?.color).toBe("obsidian");
    expect(state.market.map((card) => card.color)).toEqual(["rose", "emerald", "violet", "amber", "obsidian"]);
    expect(state.discardPile.map((card) => card.color)).toEqual([
      "locomotive",
      "locomotive",
      "locomotive",
      "amber",
      "cobalt"
    ]);
  });

  it("claims a standard route and deducts trains", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 9 }));
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);
    state = reduceGame(
      state,
      { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
      hudsonHustleMap
    );
    expect(state.routeClaims).toHaveLength(1);
    expect(state.players[0].trainsLeft).toBe(hudsonHustleMap.settings.trainsPerPlayer - 2);
    expect(state.finalRoundRemaining).toBeNull();
    expect(state.turn.stage).toBe("awaitingHandoff");
  });

  it("does not let a player claim a route longer than their remaining trains", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 9 }));
    state.players[0].trainsLeft = 1;
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);

    expect(() =>
      reduceGame(
        state,
        { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
        hudsonHustleMap
      )
    ).toThrow("You do not have enough trains left for that route.");
  });

  it("triggers the final round when no route remains open", () => {
    let state = finishInitialTickets(
      startGame(exhaustedDoubleRouteMap, { playerNames: ["A", "B"], seed: 9 }),
      exhaustedDoubleRouteMap
    );
    state = forcePlayerHand(state, ["obsidian", "obsidian"]);

    state = reduceGame(
      state,
      { type: "claim_route", routeId: "alpha-bravo-a", color: "obsidian" },
      exhaustedDoubleRouteMap
    );

    expect(state.players[0].trainsLeft).toBe(6);
    expect(state.finalRoundRemaining).toBe(1);
    expect(state.finalRoundTriggeredBy).toBe("player-1");
  });

  it("does not trigger route-exhaustion endgame while a 4-player double route twin remains open", () => {
    let state = finishInitialTickets(
      startGame(exhaustedDoubleRouteMap, { playerNames: ["A", "B", "C", "D"], seed: 9 }),
      exhaustedDoubleRouteMap
    );
    state = forcePlayerHand(state, ["obsidian", "obsidian"]);

    state = reduceGame(
      state,
      { type: "claim_route", routeId: "alpha-bravo-a", color: "obsidian" },
      exhaustedDoubleRouteMap
    );

    expect(state.players[0].trainsLeft).toBe(6);
    expect(state.finalRoundRemaining).toBeNull();
    expect(state.finalRoundTriggeredBy).toBeNull();
  });

  it("builds a station and consumes cards", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 11 }));
    state = forcePlayerHand(state, ["rose", "amber", "cobalt"]);
    state = reduceGame(state, { type: "build_station", cityId: "jamaica", color: "rose" }, hudsonHustleMap);
    expect(state.stations).toHaveLength(1);
    expect(state.players[0].stationsLeft).toBe(2);
  });

  it("reports live ticket progress from the player's current network", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 14 }));
    state.players[0].tickets = [
      { id: "custom-ticket", from: "newark-penn", to: "grove-st", points: 5, bucket: "regular" }
    ];
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);
    state = reduceGame(
      state,
      { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
      hudsonHustleMap
    );
    const progress = getTicketProgress(state, hudsonHustleMap, state.players[0].id);
    expect(progress).toEqual([
      {
        ticket: { id: "custom-ticket", from: "newark-penn", to: "grove-st", points: 5, bucket: "regular" },
        completed: true
      }
    ]);
  });

  it("lets a player cancel a freshly drawn ticket choice and restore the deck order", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 21 }));
    const nextThreeTicketIds = state.regularTickets.slice(0, 3).map((ticket) => ticket.id);
    state = reduceGame(state, { type: "draw_tickets" }, hudsonHustleMap);
    expect(state.players[0].pendingTickets.map((ticket) => ticket.id)).toEqual(nextThreeTicketIds);
    state = reduceGame(state, { type: "cancel_ticket_draw" }, hudsonHustleMap);
    expect(state.phase).toBe("main");
    expect(state.players[0].pendingTickets).toEqual([]);
    expect(state.regularTickets.slice(0, 3).map((ticket) => ticket.id)).toEqual(nextThreeTicketIds);
  });

  it("advances to game over after the final round count is exhausted", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 12 }));
    state.players[0].trainsLeft = 2;
    state.turn.stage = "awaitingHandoff";
    state.finalRoundRemaining = 0;
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(state.phase).toBe("gameOver");
    expect(state.players[0].endgame).toBeDefined();
  });
});
