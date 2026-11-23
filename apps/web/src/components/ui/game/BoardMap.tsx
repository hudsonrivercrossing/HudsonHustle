import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { getCityName, type MapConfig } from "@hudson-hustle/game-core";
import { labelAnchorPoint, pathLength, pathNormal, pointAlong, routePath, routeSpaces, type BoardBackdrop, type BoardPoint2, type SnapshotVisuals } from "@hudson-hustle/game-data";
import { ColorMark, colorMarkInk } from "./ColorMark";
import { TRACK_CELLS, TRACK_MARGIN, placeTokens, trackCell } from "./scoreTrack";

function buildPathD(points: BoardPoint2[], closed = false): string {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return closed ? `${path} Z` : path;
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
  /** Draws the score track around the board with one marker per player. Left out, the board has no frame. */
  scores?: Array<{ playerId: string; score: number }>;
  onSelectRoute: (routeId: string, position?: { x: number; y: number }) => void;
  onSelectCity: (cityId: string, position?: { x: number; y: number }) => void;
  /** False for a board that is only looked at, as in a replay: nothing on it takes focus or clicks. */
  interactive?: boolean;
}

const ARROWS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 }
};

/** The nearest target lying in the direction of an arrow key, preferring ones straight ahead. */
function nextTarget<T extends { id: string; x: number; y: number }>(targets: T[], from: T, direction: { dx: number; dy: number }): T | null {
  let best: T | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const target of targets) {
    if (target.id === from.id) continue;
    const ahead = (target.x - from.x) * direction.dx + (target.y - from.y) * direction.dy;
    const aside = Math.abs((target.x - from.x) * direction.dy) + Math.abs((target.y - from.y) * direction.dx);
    if (ahead <= 0 || aside > ahead * 1.5) continue;
    const cost = ahead + aside * 2;
    if (cost < bestCost) {
      best = target;
      bestCost = cost;
    }
  }
  return best;
}

/** Enter or Space on a route or station opens its panel, anchored to the element's centre. */
function activateFromKeyboard(event: KeyboardEvent<SVGElement>, activate: (position: { x: number; y: number }) => void): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  const box = event.currentTarget.getBoundingClientRect();
  activate({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
}

/**
 * The board. It is memoised: the table re-renders every second while a turn timer runs, and the
 * board, with its hundred-odd train cars, only needs to when the game or the selection changes.
 */
export const BoardMap = memo(function BoardMap({
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
  scores,
  onSelectRoute,
  onSelectCity,
  interactive = true
}: BoardMapProps): JSX.Element {
  // The board is one stop in the tab order. Inside it the arrow keys move between stations and
  // routes by where they are on the map, and Enter or Space opens the one in focus.
  const navTargets = useMemo(
    () => [
      ...config.cities.map((city) => ({ id: `city:${city.id}`, x: city.x, y: city.y })),
      ...config.routes.map((route) => {
        const path = routePath(route, config);
        return { id: `route:${route.id}`, ...pointAlong(path, pathLength(path) / 2) };
      })
    ],
    [config]
  );
  const [navId, setNavId] = useState(() => navTargets[0]?.id ?? "");
  const svgRef = useRef<SVGSVGElement>(null);
  const moveFocus = (event: KeyboardEvent<SVGSVGElement>) => {
    const direction = ARROWS[event.key];
    const from = navTargets.find((target) => target.id === navId);
    if (!direction || !from) return;
    event.preventDefault();
    const next = nextTarget(navTargets, from, direction);
    if (next) {
      setNavId(next.id);
      svgRef.current?.querySelector<SVGElement>(`[data-nav-id="${next.id}"]`)?.focus();
    }
  };
  /** What makes a route or station reachable: one of them holds the tab stop, the rest wait for the arrows. */
  const navProps = (id: string) =>
    interactive ? { tabIndex: navId === id ? 0 : -1, role: "button", "data-nav-id": id, onFocus: () => setNavId(id) } : { "aria-hidden": true };

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
  const frame = scores ? TRACK_MARGIN : 0;
  const tokens = scores ? placeTokens(scores, boardWidth, boardHeight) : [];

  // Routes claimed since this board was first drawn: their trains are set down one by one.
  // Claims already on the board when it appears are not replayed.
  const knownClaims = useRef<Set<string> | null>(null);
  const [freshRouteIds, setFreshRouteIds] = useState<string[]>([]);
  const claimKey = game.routeClaims.map((claim) => claim.routeId).join("|");
  useEffect(() => {
    const current = game.routeClaims.map((claim) => claim.routeId);
    if (knownClaims.current === null) {
      knownClaims.current = new Set(current);
      return;
    }
    const added = current.filter((routeId) => !knownClaims.current!.has(routeId));
    knownClaims.current = new Set(current);
    if (added.length === 0) {
      return;
    }
    setFreshRouteIds(added);
    const timeout = window.setTimeout(() => setFreshRouteIds([]), 1200);
    return () => window.clearTimeout(timeout);
  }, [claimKey]);

  return (
    <div className="board-shell">
      <svg
        ref={svgRef}
        className={`board-map board-map--${backdropMode}${interactive ? "" : " board-map--static"}`}
        viewBox={`${-frame} ${-frame} ${boardWidth + frame * 2} ${boardHeight + frame * 2}`}
        role="group"
        aria-label={interactive ? "Board map. Arrow keys move between stations and routes; Enter opens one." : "Board map"}
        onKeyDown={interactive ? moveFocus : undefined}
      >
        {scores ? (
          <g className="score-track" aria-hidden="true">
            <rect x={-frame} y={-frame} width={boardWidth + frame * 2} height={boardHeight + frame * 2} rx="18" className="score-track__frame" />
            {Array.from({ length: TRACK_CELLS }, (_, index) => {
              const cell = trackCell(index, boardWidth, boardHeight);
              const milestone = index % 5 === 0;
              return (
                <g key={index}>
                  <rect
                    x={cell.x + 1.5}
                    y={cell.y + 1.5}
                    width={cell.width - 3}
                    height={cell.height - 3}
                    rx="5"
                    className={milestone ? "score-track__cell score-track__cell--milestone" : "score-track__cell"}
                  />
                  {milestone ? (
                    <text x={cell.x + cell.width / 2} y={cell.y + cell.height / 2} className="score-track__number">
                      {index}
                    </text>
                  ) : (
                    <circle cx={cell.x + cell.width / 2} cy={cell.y + cell.height / 2} r="2.4" className="score-track__tick" />
                  )}
                </g>
              );
            })}
          </g>
        ) : null}
        <rect x="0" y="0" width={boardWidth} height={boardHeight} rx={scores ? 4 : 12} fill="#d9c8a6" />

        {backdropOpacityScale > 0 && backdrop.image ? (
          <image
            href={backdrop.image.href}
            x="0"
            y="0"
            width={boardWidth}
            height={boardHeight}
            preserveAspectRatio={backdrop.image.preserveAspectRatio ?? "none"}
            opacity={backdrop.image.opacity ?? 1}
            className="basemap-image"
          />
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

        {backdropOpacityScale > 0
          ? backdrop.landmarks?.map((landmark) => {
              const opacity = (landmark.opacity ?? 1) * backdropOpacityScale;
              if ("bounds" in landmark && landmark.bounds) {
                const { bounds } = landmark;
                return (
                  <rect
                    key={landmark.id}
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx="10"
                    className={`basemap-landmark basemap-landmark--${landmark.kind}`}
                    style={{ opacity }}
                  />
                );
              }
              if ("point" in landmark && landmark.point) {
                const { point } = landmark;
                return (
                  <g
                    key={landmark.id}
                    className={`basemap-landmark basemap-landmark--${landmark.kind}`}
                    style={{ opacity }}
                  >
                    <circle cx={point.x} cy={point.y} r="10" />
                    {landmark.label ? (
                      <text x={point.x + 14} y={point.y + 4} className="basemap-landmark__label">
                        {landmark.label}
                      </text>
                    ) : null}
                  </g>
                );
              }
              return null;
            })
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
          const pathPoints = routePath(route, config);
          const pathD = buildPathD(pathPoints);
          const totalLength = pathLength(pathPoints);
          const segments = routeSpaces(route, config).map((space) => ({ pathD: buildPathD(space.points), midPoint: space.mid, jointPoint: space.joint }));
          const claim = game.routeClaims.find((item) => item.routeId === route.id);
          const claimedByViewer = claim?.playerId === claimViewerPlayerId;
          const claimingPlayer = claim ? game.players.find((player) => player.id === claim.playerId) : null;
          const stroke = claim
            ? playerPalette[game.players.find((player) => player.id === claim.playerId)?.color ?? "harbor-blue"]
            : route.color === "gray"
              ? "#7e7463"
              : cardPalette[route.color];
          const selected = selectedRouteId === route.id;
          const middlePoint = pointAlong(pathPoints, totalLength / 2);
          const direction = pathNormal(pathPoints, totalLength / 2);
          const markerX = middlePoint.x + direction.nx * 18;
          const markerY = middlePoint.y + direction.ny * 18;
          const fillOpacity = claim ? 0.95 : 0.9;
          // An open route of a named colour carries that colour's shape on every space.
          const marked = !claim && route.color !== "gray";
          const ownerBadge = claimingPlayer?.name.trim().charAt(0).toUpperCase() ?? "";
          // V5 Sector Cable: dark jacket → color core → inner dark hairline → brass rivets between segments
          const jacketStroke = claim ? (claimedByViewer ? "rgba(40,32,22,0.9)" : "rgba(40,30,22,0.7)") : "rgba(40,30,22,0.55)";
          const innerHairlineStroke = "rgba(20,15,10,0.4)";
          const claimStitchStroke = claimedByViewer ? "rgba(255, 251, 236, 0.98)" : "rgba(255, 247, 236, 0.22)";
          const claimStitchWidth = claimedByViewer ? 4.6 : 3;
          const claimStitchDasharray = claimedByViewer ? "3.4 5.6" : "2 8.2";
          const claimStitchDashoffset = claimedByViewer ? 0 : 1.4;
          const tieCount = claim ? Math.floor(totalLength / 10) : 0;

          return (
            <g key={route.id} data-route-id={route.id}>
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
                <g
                  key={`${route.id}-${index}`}
                  className={freshRouteIds.includes(route.id) ? "route-car route-car--landing" : "route-car"}
                  style={freshRouteIds.includes(route.id) ? { animationDelay: `${index * 45}ms` } : undefined}
                >
                  {/* Pale halo, so a dark route still reads on a dark part of the map */}
                  {claim ? null : <path d={segment.pathD} fill="none" className="route-halo" strokeLinecap="round" strokeLinejoin="round" />}
                  {/* Outer dark cable jacket */}
                  <path
                    d={segment.pathD}
                    fill="none"
                    stroke={jacketStroke}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Color core */}
                  <path
                    d={segment.pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={fillOpacity}
                  />
                  {marked ? (
                    <g
                      transform={`translate(${segment.midPoint.x} ${segment.midPoint.y}) scale(0.82)`}
                      className={`route-mark route-mark--${colorMarkInk(route.color)}`}
                    >
                      <ColorMark color={route.color} />
                    </g>
                  ) : (
                    <path d={segment.pathD} fill="none" stroke={innerHairlineStroke} strokeWidth={1.8} strokeLinecap="butt" />
                  )}
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
                  {/* Brass rivet between this segment and the next */}
                  {segment.jointPoint ? (
                    <g>
                      <circle
                        cx={segment.jointPoint.x}
                        cy={segment.jointPoint.y}
                        r={3.6}
                        fill="#3a2e22"
                        stroke="#9a8060"
                        strokeWidth={1}
                      />
                      <circle
                        cx={segment.jointPoint.x - 0.8}
                        cy={segment.jointPoint.y - 0.8}
                        r={1.1}
                        fill="rgba(220, 200, 160, 0.55)"
                      />
                    </g>
                  ) : null}
                </g>
              ))}

              {claim ? (
                Array.from({ length: tieCount }, (_, i) => {
                  const dist = 6 + i * 10;
                  if (dist > totalLength - 6) return null;
                  const pt = pointAlong(pathPoints, dist);
                  const dir = pathNormal(pathPoints, dist);
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
                onKeyDown={(event) => activateFromKeyboard(event, (position) => onSelectRoute(route.id, position))}
                {...navProps(`route:${route.id}`)}
                aria-label={[
                  `${getCityName(config, route.from)} to ${getCityName(config, route.to)}`,
                  `${route.length} train${route.length === 1 ? "" : "s"}`,
                  route.color === "gray" ? "any color" : route.color,
                  route.type === "normal" ? null : (config.typeLabelOverrides?.[route.type] ?? route.type),
                  claimingPlayer ? `claimed by ${claimingPlayer.name}` : "open"
                ]
                  .filter(Boolean)
                  .join(", ")}
                aria-pressed={selectedRouteId === route.id}
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
          const labelPoint = labelAnchorPoint(city);
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
              {/* A wider, unseen target under the station, so a finger does not have to land on a 12-unit dot. */}
              <circle cx={city.x} cy={city.y} r="24" className="city-touch" onClick={(event) => onSelectCity(city.id, { x: event.clientX, y: event.clientY })} />
              <circle
                cx={city.x}
                cy={city.y}
                r={highlighted ? 17 : selected ? 15 : 12}
                fill="#f8f5ef"
                stroke="#453221"
                strokeWidth="3"
                onClick={(event) => onSelectCity(city.id, { x: event.clientX, y: event.clientY })}
                onKeyDown={(event) => activateFromKeyboard(event, (position) => onSelectCity(city.id, position))}
                {...navProps(`city:${city.id}`)}
                aria-label={`${city.name} station${station ? ", station built" : ""}`}
                aria-pressed={selected}
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
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={labelAnchor}
                className={highlighted ? "board-label board-label--highlighted" : "board-label"}
              >
                {city.label ?? city.name}
              </text>
            </g>
          );
        })}
        {tokens.map((token) => {
          const player = game.players.find((item) => item.id === token.playerId);
          return (
            <g key={token.playerId} className="score-token" style={{ transform: `translate(${token.x}px, ${token.y}px)` }}>
              <title>{player?.name}</title>
              <circle r="13" className="score-token__disc" fill={player ? playerPalette[player.color] : "#f0d78e"} />
              <text className="score-token__label" dy="4.5">
                {token.laps > 0 ? `+${token.laps * TRACK_CELLS}` : player?.name.trim().charAt(0).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      {scores ? (
        <ul className="visually-hidden">
          {scores.map(({ playerId, score }) => (
            <li key={playerId}>
              {game.players.find((item) => item.id === playerId)?.name}: {score} points
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
