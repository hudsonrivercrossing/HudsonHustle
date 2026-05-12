import type { MapConfig, RouteDef } from "@hudson-hustle/game-core";
import type { BoardBackdrop, SnapshotVisuals } from "@hudson-hustle/game-data";

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
  backdrop: BoardBackdrop;
  backdropMode: SnapshotVisuals["backdropMode"];
  boardLabelMode: SnapshotVisuals["boardLabelMode"];
  cardPalette: Record<string, string>;
  playerPalette: Record<string, string>;
  viewerPlayerId?: string | null;
  game: {
    players: Array<{ id: string; name: string; color: string }>;
    activePlayerIndex: number;
    routeClaims: Array<{ routeId: string; playerId: string }>;
    stations: Array<{ cityId: string; playerId: string }>;
  };
  selectedRouteId: string | null;
  selectedCityId: string | null;
  highlightedCityIds?: string[];
  onSelectRoute: (routeId: string, position?: { x: number; y: number }) => void;
  onSelectCity: (cityId: string, position?: { x: number; y: number }) => void;
}

export function BoardMap({
  config,
  backdrop,
  backdropMode,
  boardLabelMode,
  cardPalette,
  playerPalette,
  viewerPlayerId,
  game,
  selectedRouteId,
  selectedCityId,
  highlightedCityIds = [],
  onSelectRoute,
  onSelectCity
}: BoardMapProps): JSX.Element {
  const activePlayerId = game.players[game.activePlayerIndex]?.id;
  const claimViewerPlayerId = viewerPlayerId ?? activePlayerId;
  const boardWidth = 1200;
  const boardHeight = 900;
  const backdropOpacityScale = {
    full: 1,
    muted: 0.58,
    minimal: 0.32,
    none: 0
  }[backdropMode];
  const shorelineOpacityScale = {
    full: 1,
    muted: 0.72,
    minimal: 0.42,
    none: 0
  }[backdropMode];
  const regionLabels =
    boardLabelMode === "station-only"
      ? []
      : boardLabelMode === "minimal-region-labels"
        ? backdrop.regionLabels.filter((label) => label.id !== "new-jersey")
        : backdrop.regionLabels;
  const regionLabelClassSuffix = boardLabelMode === "minimal-region-labels" ? " region-label--minimal" : "";
  const highlightedCitySet = new Set(highlightedCityIds);

  return (
    <div className="board-shell">
      <svg
        className={`board-map board-map--${backdropMode}`}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        role="img"
        aria-label="Hudson Hustle board map"
      >
        <defs>
          <pattern id="transit-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.8" fill="rgba(74, 55, 36, 0.30)" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={boardWidth} height={boardHeight} rx="12" fill="#d9c8a6" />

        {backdropOpacityScale > 0 ? (
          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="url(#transit-grid)" rx="12" style={{ pointerEvents: "none" }} />
        ) : null}

        {backdropOpacityScale > 0
          ? backdrop.waterAreas.map((area) => (
              <path
                key={area.id}
                d={buildPathD(area.points, true)}
                className="water-body"
                style={{ opacity: (area.opacity ?? 1) * backdropOpacityScale }}
              />
            ))
          : null}

        {backdropOpacityScale > 0
          ? backdrop.landAreas.map((area) => (
              <path
                key={area.id}
                d={buildPathD(area.points, true)}
                className="landform"
                style={{ opacity: (area.opacity ?? 1) * backdropOpacityScale }}
              />
            ))
          : null}

        {shorelineOpacityScale > 0
          ? backdrop.shorelines.map((line) => (
              <path
                key={line.id}
                d={buildPathD(line.points)}
                className="shoreline"
                style={{ opacity: shorelineOpacityScale }}
              />
            ))
          : null}

        {regionLabels.map((label) => (
          <text
            key={label.id}
            x={label.point.x}
            y={label.point.y}
            className={`region-label${backdropMode === "muted" ? " region-label--muted" : regionLabelClassSuffix}${label.vertical ? " region-label--vertical" : ""}`.trim()}
          >
            {label.text}
          </text>
        ))}

        {config.routes.map((route) => {
          const pathPoints = getPathPoints(route, config);
          const pathD = buildPathD(pathPoints);
          const totalLength = getPathLength(pathPoints);
          const segments = getSegments(route, pathPoints);
          const claim = game.routeClaims.find((item) => item.routeId === route.id);
          const claimedByViewer = claim?.playerId === claimViewerPlayerId;
          const claimingPlayer = claim ? game.players.find((player) => player.id === claim.playerId) : null;
          const stroke = claim
            ? playerPalette[game.players.find((player) => player.id === claim.playerId)?.color ?? "harbor-blue"]
            : route.color === "gray"
              ? "#7e7463"
              : cardPalette[route.color];
          const selected = selectedRouteId === route.id;
          const middlePoint = getPointAlongPath(pathPoints, totalLength / 2);
          const direction = getPathDirection(pathPoints, totalLength / 2);
          const markerX = middlePoint.x + direction.nx * 18;
          const markerY = middlePoint.y + direction.ny * 18;
          const fillOpacity = claim ? 0.96 : 0.82;
          const ownerBadge = claimingPlayer?.name.trim().charAt(0).toUpperCase() ?? "";
          const backplateFill = claim ? (claimedByViewer ? "#f0d78e" : "#493728") : "#fff2d7";
          const claimStitchStroke = claimedByViewer ? "rgba(255, 251, 236, 0.98)" : "rgba(255, 247, 236, 0.22)";
          const claimStitchWidth = claimedByViewer ? 4.6 : 3;
          const claimStitchDasharray = claimedByViewer ? "3.4 5.6" : "2 8.2";
          const claimStitchDashoffset = claimedByViewer ? 0 : 1.4;
          const tieCount = claim ? Math.floor(totalLength / 10) : 0;

          return (
            <g key={route.id}>
              {selected ? (
                <path d={pathD} className="route-selection" fill="none" />
              ) : null}

              <path
                d={pathD}
                fill="none"
                className="route-railbed"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

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
                      stroke={claimStitchStroke}
                      strokeWidth={claimStitchWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={claimStitchDasharray}
                      strokeDashoffset={claimStitchDashoffset}
                    />
                  ) : null}
                </g>
              ))}

              {claim ? (
                Array.from({ length: tieCount }, (_, i) => {
                  const dist = 6 + i * 10;
                  if (dist > totalLength - 6) return null;
                  const pt = getPointAlongPath(pathPoints, dist);
                  const dir = getPathDirection(pathPoints, dist);
                  const tieLen = 14;
                  return (
                    <line
                      key={`tie-${route.id}-${i}`}
                      x1={pt.x + dir.nx * tieLen / 2}
                      y1={pt.y + dir.ny * tieLen / 2}
                      x2={pt.x - dir.nx * tieLen / 2}
                      y2={pt.y - dir.ny * tieLen / 2}
                      className="route-cross-tie"
                    />
                  );
                })
              ) : null}

              {route.type === "tunnel" && !claim ? (
                <g className="route-tunnel-marker" transform={`translate(${middlePoint.x} ${middlePoint.y})`}>
                  <rect x="-6" y="-3" width="12" height="6" rx="3" fill="none" stroke="rgba(100, 80, 60, 0.25)" strokeWidth="1.5" strokeDasharray="2 2" />
                </g>
              ) : null}

              {route.type === "ferry" && !claim ? (
                <g className="route-ferry-marker" transform={`translate(${middlePoint.x} ${middlePoint.y})`}>
                  <path d="M -5 0 Q 0 -4, 5 0 Q 0 4, -5 0 Z" fill="none" stroke="rgba(80, 130, 160, 0.35)" strokeWidth="1.5" />
                </g>
              ) : null}

              {claim ? (
                <g transform={`translate(${markerX} ${markerY - 18})`} data-testid={`route-claim-${route.id}`}>
                  <circle
                    r="11"
                    className="claim-badge"
                    fill={claimingPlayer ? playerPalette[claimingPlayer.color] : "#f0d78e"}
                  />
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
                onClick={(event) => onSelectRoute(route.id, { x: event.clientX, y: event.clientY })}
                className="route-hitbox"
                data-testid={`route-hitbox-${route.id}`}
                fill="none"
              />
            </g>
          );
        })}

        {config.cities.map((city) => {
          const station = game.stations.find((item) => item.cityId === city.id);
          const selected = selectedCityId === city.id;
          const highlighted = highlightedCitySet.has(city.id);
          const labelDx = city.labelDx ?? 14;
          const labelDy = city.labelDy ?? -14;
          const labelAnchor = city.labelAnchor ?? "start";
          return (
            <g key={city.id} className={highlighted ? "city-node city-node--highlighted" : "city-node"}>
              {highlighted ? (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r="25"
                  className="city-highlight-ring"
                />
              ) : null}
              <circle
                cx={city.x}
                cy={city.y}
                r={highlighted ? 17 : selected ? 15 : 12}
                fill="#f8f5ef"
                stroke="#453221"
                strokeWidth="3"
                onClick={(event) => onSelectCity(city.id, { x: event.clientX, y: event.clientY })}
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
                  fill={playerPalette[game.players.find((player) => player.id === station.playerId)?.color ?? "harbor-blue"]}
                  stroke="#fff8ec"
                  strokeWidth="2"
                />
              ) : null}
              <text
                x={city.x + labelDx}
                y={city.y + labelDy}
                textAnchor={labelAnchor}
                className={highlighted ? "board-label board-label--highlighted" : "board-label"}
              >
                {city.label ?? city.name}
              </text>
            </g>
          );
        })}

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
      </svg>
    </div>
  );
}
