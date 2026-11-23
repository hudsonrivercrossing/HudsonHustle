import { describe, expect, it } from "vitest";
import { parseRoute, routePath, type Route } from "./routes";

describe("routes", () => {
  it.each<[string, Route]>([
    ["/", { name: "gateway" }],
    ["", { name: "gateway" }],
    ["/local", { name: "local" }],
    ["/online/", { name: "online" }],
    ["/guide", { name: "guide" }],
    ["/room/ABC234", { name: "room", roomCode: "ABC234" }],
    ["/room/abc234", { name: "room", roomCode: "ABC234" }],
    ["/room/", { name: "gateway" }],
    ["/room/has spaces", { name: "gateway" }],
    ["/somewhere/else", { name: "gateway" }]
  ])("parses %s", (pathname, expected) => {
    expect(parseRoute(pathname)).toEqual(expected);
  });

  it("round-trips every route through its path", () => {
    const routes: Route[] = [{ name: "gateway" }, { name: "local" }, { name: "online" }, { name: "guide" }, { name: "room", roomCode: "XY7K2P" }];
    for (const route of routes) {
      expect(parseRoute(routePath(route))).toEqual(route);
    }
  });
});
