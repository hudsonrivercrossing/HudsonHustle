import type { CityDef, MapConfig, RouteDef } from "@hudson-hustle/game-core";

/**
 * Where things are on the board: the line a route follows, the spaces along it, and the box a station
 * name takes up. The board drawing, the basemap protection zones and the layout tests all read these,
 * so what is tested is what is drawn.
 */

export interface BoardPoint2 {
  x: number;
  y: number;
}

export interface BoardBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** One space of a route: where a single train car sits. */
export interface RouteSpace {
  /** Points along the middle of the space, in order. */
  points: BoardPoint2[];
  mid: BoardPoint2;
  /** The rivet between this space and the next; the last space has none. */
  joint?: BoardPoint2;
  /** How long the space is drawn, in board units. */
  length: number;
}

/** The line a route follows: its two stations and any waypoints between them. */
export function routePath(route: RouteDef, config: MapConfig): BoardPoint2[] {
  const from = config.cities.find((city) => city.id === route.from);
  const to = config.cities.find((city) => city.id === route.to);
  if (!from || !to) {
    throw new Error(`Route ${route.id} references a missing city`);
  }
  return [{ x: from.x, y: from.y }, ...(route.waypoints ?? []), { x: to.x, y: to.y }];
}

export function pathLength(points: BoardPoint2[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return total;
}

/** The point a given distance along a path, clamped to its ends. */
export function pointAlong(points: BoardPoint2[], distance: number): BoardPoint2 {
  let remaining = distance;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy) || 1;
    if (remaining <= segmentLength || index === points.length - 1) {
      const ratio = Math.max(0, Math.min(1, remaining / segmentLength));
      return { x: start.x + dx * ratio, y: start.y + dy * ratio };
    }
    remaining -= segmentLength;
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

/** The unit vector at right angles to the path at a given distance along it. */
export function pathNormal(points: BoardPoint2[], distance: number): { nx: number; ny: number } {
  const before = pointAlong(points, Math.max(0, distance - 2));
  const after = pointAlong(points, Math.min(pathLength(points), distance + 2));
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const length = Math.hypot(dx, dy) || 1;
  return { nx: -(dy / length), ny: dx / length };
}

/** How much a path turns in total, from 0 (straight) to 1 (two thirds of a half turn or more). */
function pathCurvature(points: BoardPoint2[]): number {
  let totalTurn = 0;
  for (let index = 2; index < points.length; index += 1) {
    const a = points[index - 2];
    const b = points[index - 1];
    const c = points[index];
    let delta = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x);
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    totalTurn += Math.abs(delta);
  }
  return Math.min(1, totalTurn / (Math.PI / 1.5));
}

/**
 * The spaces of a route, one per unit of its length. A stretch at each end is left clear for the
 * stations, and the rest is shared equally between the spaces with a gap between neighbours.
 */
export function routeSpaces(route: RouteDef, config: MapConfig): RouteSpace[] {
  const points = routePath(route, config);
  const totalLength = pathLength(points);
  const curvature = pathCurvature(points);
  const endClearance = Math.min(38, Math.max(24, totalLength * 0.14) + curvature * 8);
  const usableLength = Math.max(36, totalLength - endClearance * 2);
  const gap = Math.max(16, Math.min(22, usableLength / Math.max(4, route.length * 2.4)));
  const spaceLength = Math.max(16, (usableLength - gap * (route.length - 1)) / route.length);
  const sampleSpacing = 16 - curvature * 8;
  const sampleCount = Math.max(2, Math.ceil(spaceLength / sampleSpacing));

  return Array.from({ length: route.length }, (_, index) => {
    const start = endClearance + index * (spaceLength + gap);
    const end = start + spaceLength;
    return {
      points: Array.from({ length: sampleCount + 1 }, (_unused, sample) => pointAlong(points, start + (spaceLength * sample) / sampleCount)),
      mid: pointAlong(points, start + spaceLength / 2),
      ...(index < route.length - 1 ? { joint: pointAlong(points, end + gap / 2) } : {}),
      length: spaceLength
    };
  });
}

/** Where a station's name is anchored when the map gives no offset of its own. */
export const LABEL_DEFAULT_DX = 14;
export const LABEL_DEFAULT_DY = -14;

/** Board units of width per character of a station name at the size the board draws it. */
const LABEL_CHARACTER_WIDTH = 9;
/** A Chinese, Japanese or Korean character is drawn as a full square, about as wide as the type is tall. */
const LABEL_WIDE_CHARACTER_WIDTH = 17;
const WIDE_CHARACTER = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const LABEL_ASCENT = 16;
const LABEL_DESCENT = 5;

/** The anchor point of a station's name. */
export function labelAnchorPoint(city: CityDef): BoardPoint2 {
  return { x: city.x + (city.labelDx ?? LABEL_DEFAULT_DX), y: city.y + (city.labelDy ?? LABEL_DEFAULT_DY) };
}

/** How wide a station name is drawn, in board units. */
export function labelTextWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    width += WIDE_CHARACTER.test(character) ? LABEL_WIDE_CHARACTER_WIDTH : LABEL_CHARACTER_WIDTH;
  }
  return width;
}

/** The box a station's name takes up on the board. */
export function labelBox(city: CityDef): BoardBox {
  const text = city.label ?? city.name;
  const anchorPoint = labelAnchorPoint(city);
  const width = Math.max(44, labelTextWidth(text));
  const anchor = city.labelAnchor ?? "start";
  const left = anchor === "end" ? anchorPoint.x - width : anchor === "middle" ? anchorPoint.x - width / 2 : anchorPoint.x;
  return { left, top: anchorPoint.y - LABEL_ASCENT, right: left + width, bottom: anchorPoint.y + LABEL_DESCENT };
}
