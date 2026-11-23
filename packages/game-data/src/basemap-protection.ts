import type { MapConfig } from "@hudson-hustle/game-core";
import { labelBox, routePath } from "./board-geometry.js";

export interface BasemapBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BasemapBoardFrame {
  width: number;
  height: number;
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

interface BasemapPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
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

function boundsFromPoints(points: BasemapPoint[], padding: number, width: number, height: number): BasemapBounds {
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

export function buildBasemapProtectedZones(config: MapConfig, frame: BasemapBoardFrame): BasemapProtectedZones {
  const routes = config.routes.map((route) => ({
    id: `route:${route.id}`,
    kind: "route" as const,
    routeId: route.id,
    bounds: boundsFromPoints(routePath(route, config), 34, frame.width, frame.height)
  }));

  const stations = config.cities.map((city) => ({
    id: `station:${city.id}`,
    kind: "station" as const,
    cityId: city.id,
    bounds: padBounds(
      {
        left: city.x - 18,
        top: city.y - 18,
        right: city.x + 18,
        bottom: city.y + 18
      },
      14,
      frame.width,
      frame.height
    )
  }));

  const labels = config.cities.map((city) => ({
    id: `label:${city.id}`,
    kind: "label" as const,
    cityId: city.id,
    bounds: padBounds(labelBox(city), 10, frame.width, frame.height)
  }));

  return { routes, stations, labels };
}
