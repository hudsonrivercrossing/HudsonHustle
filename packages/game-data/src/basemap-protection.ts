import type { MapConfig, RouteDef } from "@hudson-hustle/game-core";

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

function getPathPoints(route: RouteDef, config: MapConfig): BasemapPoint[] {
  const from = config.cities.find((city) => city.id === route.from);
  const to = config.cities.find((city) => city.id === route.to);

  if (!from || !to) {
    throw new Error(`Route ${route.id} references a missing city`);
  }

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
  const routes = config.routes.map((route) => ({
    id: `route:${route.id}`,
    kind: "route" as const,
    routeId: route.id,
    bounds: boundsFromPoints(getPathPoints(route, config), 34, frame.width, frame.height)
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

  const labels = config.cities.map((city) => {
    const label = city.label ?? city.name;
    const labelX = city.x + (city.labelDx ?? 14);
    const labelY = city.y + (city.labelDy ?? -14);
    const textWidth = Math.max(44, label.length * 9);
    const labelAnchor = city.labelAnchor ?? "start";
    const left = labelAnchor === "end" ? labelX - textWidth : labelAnchor === "middle" ? labelX - textWidth / 2 : labelX;

    return {
      id: `label:${city.id}`,
      kind: "label" as const,
      cityId: city.id,
      bounds: padBounds(
        {
          left,
          top: labelY - 18,
          right: left + textWidth,
          bottom: labelY + 8
        },
        10,
        frame.width,
        frame.height
      )
    };
  });

  return { routes, stations, labels };
}
