import type { GameState, MapConfig, RouteDef } from "@hudson-hustle/game-core";
import { cardColorPalette, playerColorPalette } from "@hudson-hustle/game-data";

interface PathPoint {
  x: number;
  y: number;
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

function getPathLength(points: PathPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return total;
}

function getPointAlongPath(points: PathPoint[], distance: number): { x: number; y: number; angle: number } {
  let remaining = distance;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy) || 1;
    if (remaining <= segmentLength || index === points.length - 1) {
      const ratio = Math.max(0, Math.min(1, remaining / segmentLength));
      return {
        x: start.x + dx * ratio,
        y: start.y + dy * ratio,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI
      };
    }
    remaining -= segmentLength;
  }

  const last = points.at(-1) ?? { x: 0, y: 0 };
  const previous = points.at(-2) ?? last;
  return {
    x: last.x,
    y: last.y,
    angle: (Math.atan2(last.y - previous.y, last.x - previous.x) * 180) / Math.PI
  };
}

function getPathDirection(points: PathPoint[], distance: number): { nx: number; ny: number } {
  const before = getPointAlongPath(points, Math.max(0, distance - 2));
  const after = getPointAlongPath(points, Math.min(getPathLength(points), distance + 2));
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    nx: -(dy / length),
    ny: dx / length
  };
}

function getAngleDelta(firstAngle: number, secondAngle: number) {
  let delta = secondAngle - firstAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta);
}

function getPathCurvature(points: PathPoint[]) {
  if (points.length < 3) {
    return 0;
  }

  let totalTurn = 0;
  for (let index = 2; index < points.length; index += 1) {
    const a = points[index - 2];
    const b = points[index - 1];
    const c = points[index];
    const firstAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const secondAngle = Math.atan2(c.y - b.y, c.x - b.x);
    totalTurn += getAngleDelta(firstAngle, secondAngle);
  }

  return Math.min(1, totalTurn / (Math.PI / 1.5));
}

function buildPathD(points: PathPoint[], closed = false): string {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return closed ? `${path} Z` : path;
}

function getPathSlice(points: PathPoint[], startDistance: number, endDistance: number, curvature: number): PathPoint[] {
  const safeStart = Math.max(0, startDistance);
  const safeEnd = Math.max(safeStart, endDistance);
  const sliceLength = safeEnd - safeStart;
  const sampleSpacing = 16 - curvature * 8;
  const sampleCount = Math.max(2, Math.ceil(sliceLength / sampleSpacing));

  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const ratio = index / sampleCount;
    const distance = safeStart + sliceLength * ratio;
    const point = getPointAlongPath(points, distance);
    return { x: point.x, y: point.y };
  });
}

function getSegments(route: RouteDef, points: PathPoint[]): Array<{ pathD: string }> {
  const totalLength = getPathLength(points);
  const curvature = getPathCurvature(points);
  const outerPadding = Math.min(38, Math.max(24, totalLength * 0.14) + curvature * 8);
  const usableLength = Math.max(36, totalLength - outerPadding * 2);
  const gap = Math.max(6, Math.min(10, usableLength / Math.max(5, route.length * (3.2 + curvature * 0.4))));
  const segmentLength = Math.max(16, (usableLength - gap * (route.length - 1)) / route.length);
  const start = outerPadding;

  return Array.from({ length: route.length }, (_, index) => {
    const segmentStart = start + index * (segmentLength + gap);
    const segmentEnd = segmentStart + segmentLength;
    const slicePoints = getPathSlice(points, segmentStart, segmentEnd, curvature);
    return {
      pathD: buildPathD(slicePoints)
    };
  });
}

interface BoardMapProps {
  config: MapConfig;
  game: GameState;
  selectedRouteId: string | null;
  selectedCityId: string | null;
  onSelectRoute: (routeId: string) => void;
  onSelectCity: (cityId: string) => void;
}

export function BoardMap({
  config,
  game,
  selectedRouteId,
  selectedCityId,
  onSelectRoute,
  onSelectCity
}: BoardMapProps): JSX.Element {
  const activePlayerId = game.players[game.activePlayerIndex]?.id;

  return (
    <div className="board-shell">
      <svg className="board-map" viewBox="0 0 1200 900" role="img" aria-label="Hudson Hustle board map">
        <rect x="0" y="0" width="1200" height="900" rx="28" fill="#ebdfc8" />

        {config.routes.map((route) => {
          const pathPoints = getPathPoints(route, config);
          const pathD = buildPathD(pathPoints);
          const totalLength = getPathLength(pathPoints);
          const segments = getSegments(route, pathPoints);
          const claim = game.routeClaims.find((item) => item.routeId === route.id);
          const claimedByActive = claim?.playerId === activePlayerId;
          const claimingPlayer = claim ? game.players.find((player) => player.id === claim.playerId) : null;
          const stroke = claim
            ? playerColorPalette[game.players.find((player) => player.id === claim.playerId)?.color ?? "harbor-blue"]
            : route.color === "gray"
              ? "#7e7463"
              : cardColorPalette[route.color];
          const selected = selectedRouteId === route.id;
          const middlePoint = getPointAlongPath(pathPoints, totalLength / 2);
          const direction = getPathDirection(pathPoints, totalLength / 2);
          const markerX = middlePoint.x + direction.nx * 18;
          const markerY = middlePoint.y + direction.ny * 18;
          const fillOpacity = claim ? 0.96 : 0.82;
          const ownerBadge = claimingPlayer?.name.trim().charAt(0).toUpperCase() ?? "";
          const backplateFill = claim ? (claimedByActive ? "#f3df9f" : "#4a3a2b") : "#f7f0e3";

          return (
            <g key={route.id}>
              {selected ? (
                <path d={pathD} className="route-selection" fill="none" />
              ) : null}
              {segments.map((segment, index) => (
                <g key={`${route.id}-${index}`}>
                  <path
                    d={segment.pathD}
                    fill="none"
                    stroke={backplateFill}
                    strokeWidth={18}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.98}
                  />
                  <path
                    d={segment.pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={fillOpacity}
                  />
                  {claim ? (
                    <path
                      d={segment.pathD}
                      fill="none"
                      stroke={claimedByActive ? "rgba(255, 250, 230, 0.98)" : "rgba(255, 248, 238, 0.34)"}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="3 7"
                    />
                  ) : null}
                </g>
              ))}
              {claim ? (
                <g transform={`translate(${markerX} ${markerY - 18})`}>
                  <circle r="11" className={claimedByActive ? "claim-badge claim-badge--self" : "claim-badge claim-badge--opponent"} />
                  <text textAnchor="middle" dy="4" className="claim-badge__label">
                    {ownerBadge}
                  </text>
                </g>
              ) : null}
              <path
                d={pathD}
                stroke="transparent"
                strokeWidth="28"
                strokeLinecap="round"
                onClick={() => onSelectRoute(route.id)}
                className="route-hitbox"
                fill="none"
              />
            </g>
          );
        })}

        {config.cities.map((city) => {
          const station = game.stations.find((item) => item.cityId === city.id);
          const selected = selectedCityId === city.id;
          const labelDx = city.labelDx ?? 14;
          const labelDy = city.labelDy ?? -14;
          const labelAnchor = city.labelAnchor ?? "start";
          return (
            <g key={city.id}>
              <circle
                cx={city.x}
                cy={city.y}
                r={selected ? 15 : 12}
                fill="#f8f5ef"
                stroke="#453221"
                strokeWidth="3"
                onClick={() => onSelectCity(city.id)}
                className="city-hitbox"
              />
              <circle cx={city.x} cy={city.y} r={selected ? 7 : 5} fill="#5b4633" opacity="0.85" />
              {station ? (
                <rect
                  x={city.x - 8}
                  y={city.y - 8}
                  width="16"
                  height="16"
                  rx="4"
                  fill={playerColorPalette[game.players.find((player) => player.id === station.playerId)?.color ?? "harbor-blue"]}
                  stroke="#fff8ec"
                  strokeWidth="2"
                />
              ) : null}
              <text
                x={city.x + labelDx}
                y={city.y + labelDy}
                textAnchor={labelAnchor}
                className="board-label"
              >
                {city.label ?? city.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
