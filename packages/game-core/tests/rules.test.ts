import { describe, expect, it } from "vitest";
import { canPay, canTakeMarketCard, drawsRemaining, isRouteOpen, longestPath, longestTrail, paymentSpend, routePoints, scoreTickets, stationCost } from "../src/rules";
import type { MapConfig, RouteDef, TrainCard } from "../src/types";

const route = (id: string, from: string, to: string, length: number, extra: Partial<RouteDef> = {}): RouteDef => ({
  id,
  from,
  to,
  length,
  color: "gray",
  type: "normal",
  ...extra
});

// A line a - b - c - d with a twin pair between c and d, and a spur b - e.
const map: MapConfig = {
  id: "rules-test",
  name: "Rules test",
  cities: ["a", "b", "c", "d", "e"].map((id, index) => ({ id, name: id, x: index * 100, y: 0 })),
  routes: [
    route("a-b", "a", "b", 3),
    route("b-c", "b", "c", 2),
    route("c-d-1", "c", "d", 4, { twinGroup: "c-d" }),
    route("c-d-2", "c", "d", 4, { twinGroup: "c-d" }),
    route("b-e", "b", "e", 1)
  ],
  tickets: [],
  settings: { trainsPerPlayer: 20, stationsPerPlayer: 3, longestRouteBonus: 10, stationValue: 4 }
};

const claim = (routeId: string, playerId: string) => ({ routeId, playerId });
const hand = (...colors: TrainCard["color"][]): TrainCard[] => colors.map((color, index) => ({ id: `card-${index}`, color }));

describe("points", () => {
  it("scores routes by length", () => {
    expect([1, 2, 3, 4, 5, 6].map(routePoints)).toEqual([1, 2, 4, 7, 10, 15]);
  });

  it("charges one more card for each station already built", () => {
    expect([3, 2, 1].map((left) => stationCost(3, left))).toEqual([1, 2, 3]);
  });
});

describe("isRouteOpen", () => {
  const twin = map.routes[2];

  it("closes a claimed route", () => {
    expect(isRouteOpen(map.routes[0], [claim("a-b", "p1")], 4, map)).toBe(false);
  });

  it("closes the other twin with two or three players, and leaves it open with four", () => {
    const claims = [claim("c-d-2", "p1")];
    expect(isRouteOpen(twin, claims, 2, map)).toBe(false);
    expect(isRouteOpen(twin, claims, 3, map)).toBe(false);
    expect(isRouteOpen(twin, claims, 4, map)).toBe(true);
  });
});

describe("paying", () => {
  it("spends the colour before locomotives", () => {
    expect(paymentSpend(2, 3, 3)).toEqual({ colored: 2, locomotives: 1 });
  });

  it("spends the required locomotives even when the colour would cover the price", () => {
    expect(paymentSpend(5, 1, 3, 1)).toEqual({ colored: 2, locomotives: 1 });
  });

  it("refuses when the required locomotives or the total are missing", () => {
    expect(paymentSpend(5, 0, 3, 1)).toBeNull();
    expect(paymentSpend(1, 1, 3)).toBeNull();
  });

  it("answers for a hand of cards", () => {
    expect(canPay(hand("crimson", "crimson", "locomotive"), "crimson", 3)).toBe(true);
    expect(canPay(hand("crimson", "amber", "locomotive"), "crimson", 3)).toBe(false);
  });
});

describe("drawing", () => {
  const turn = (stage: string, drawsTaken: number, tookFaceUpLocomotive = false) => ({ stage, drawsTaken, tookFaceUpLocomotive });

  it("allows two cards a turn, one after the first, none after a face-up locomotive", () => {
    expect(drawsRemaining({ phase: "main", turn: turn("idle", 0) })).toBe(2);
    expect(drawsRemaining({ phase: "main", turn: turn("drawing", 1) })).toBe(1);
    expect(drawsRemaining({ phase: "main", turn: turn("drawing", 1, true) })).toBe(0);
    expect(drawsRemaining({ phase: "ticketChoice", turn: turn("idle", 0) })).toBe(0);
  });

  it("allows a face-up locomotive only as the first card", () => {
    expect(canTakeMarketCard({ drawsTaken: 0 }, { color: "locomotive" })).toBe(true);
    expect(canTakeMarketCard({ drawsTaken: 1 }, { color: "locomotive" })).toBe(false);
    expect(canTakeMarketCard({ drawsTaken: 1 }, { color: "amber" })).toBe(true);
  });
});

describe("final scoring", () => {
  const ticket = (id: string, from: string, to: string, points: number) => ({ id, from, to, points });

  it("adds a connected ticket and subtracts one that is not", () => {
    const result = scoreTickets(map, [claim("a-b", "p1"), claim("b-c", "p1")], [], "p1", [ticket("done", "a", "c", 6), ticket("missed", "a", "d", 9)]);
    expect(result.total).toBe(-3);
    expect([...result.completedIds]).toEqual(["done"]);
  });

  it("lets a station borrow one rival route at its city, and only one", () => {
    const claims = [claim("a-b", "p1"), claim("b-c", "p2"), claim("b-e", "p2")];
    const tickets = [ticket("to-c", "a", "c", 6), ticket("to-e", "a", "e", 2)];
    expect(scoreTickets(map, claims, [], "p1", tickets).total).toBe(-8);
    // One station at b can borrow b-c or b-e, not both; the better of the two counts.
    const withStation = scoreTickets(map, claims, [{ cityId: "b", playerId: "p1" }], "p1", tickets);
    expect(withStation.total).toBe(4);
    expect([...withStation.completedIds]).toEqual(["to-c"]);
  });

  it("does not let a rival's station help", () => {
    const claims = [claim("a-b", "p1"), claim("b-c", "p2")];
    expect(scoreTickets(map, claims, [{ cityId: "b", playerId: "p2" }], "p1", [ticket("to-c", "a", "c", 6)]).total).toBe(-6);
  });

  it("measures the longest path without using a route twice", () => {
    expect(longestTrail([map.routes[0], map.routes[1], map.routes[4]])).toBe(5);
    expect(longestPath(map, [claim("a-b", "p1"), claim("b-c", "p1"), claim("c-d-1", "p1"), claim("b-e", "p2")], "p1")).toBe(9);
    expect(longestPath(map, [], "p1")).toBe(0);
  });
});
