import { getCityName, type GameMove, type GameState, type MapConfig, type RouteClaim, type StationPlacement } from "@hudson-hustle/game-core";

/** The board as it stood after one move, plus what to say about that move. */
export interface ReplayStep {
  /** "board" steps change the map; "hand" steps are card draws and ticket choices. */
  kind: "start" | "board" | "hand";
  caption: string;
  playerId: string | null;
  routeClaims: RouteClaim[];
  stations: StationPlacement[];
  /** Points from claimed routes so far, by player. Tickets and bonuses are only scored at the end. */
  routePoints: Record<string, number>;
  /** Train cards taken so far, by player. */
  cardsDrawn: Record<string, number>;
  /** Tickets kept so far, by player. Which tickets stays private until the final scoring. */
  ticketsKept: Record<string, number>;
}

export interface ReplayOptions {
  /** Leave out card draws and ticket choices, keeping only the moves that change the map. */
  boardOnly?: boolean;
}

/**
 * Games saved before moves were recorded only know the final board. For those the order of
 * claims and of stations is right, but stations are shown after all routes.
 */
function movesOf(game: GameState): GameMove[] {
  if (game.moves) {
    return game.moves;
  }
  return [
    ...game.routeClaims.map((claim): GameMove => ({ type: "route_claimed", playerId: claim.playerId, routeId: claim.routeId, points: 0 })),
    ...game.stations.map((station): GameMove => ({ type: "station_built", playerId: station.playerId, cityId: station.cityId }))
  ];
}

const faceLabel = (face: string) => (face === "locomotive" ? "locomotive" : `${face} card`);

/** Step 0 is the empty board; each later step is one public move. */
export function buildReplaySteps(game: GameState, config: MapConfig, options: ReplayOptions = {}): ReplayStep[] {
  const nameOf = (playerId: string) => game.players.find((player) => player.id === playerId)?.name ?? "A player";
  const zero = () => Object.fromEntries(game.players.map((player) => [player.id, 0])) as Record<string, number>;
  const routePoints = zero();
  const cardsDrawn = zero();
  const ticketsKept = zero();
  const routeClaims: RouteClaim[] = [];
  const stations: StationPlacement[] = [];
  const snapshot = (kind: ReplayStep["kind"], caption: string, playerId: string | null): ReplayStep => ({
    kind,
    caption,
    playerId,
    routeClaims: [...routeClaims],
    stations: [...stations],
    routePoints: { ...routePoints },
    cardsDrawn: { ...cardsDrawn },
    ticketsKept: { ...ticketsKept }
  });
  const steps: ReplayStep[] = [snapshot("start", "The board before the first move.", null)];
  const endsOf = (routeId: string) => {
    const route = config.routes.find((entry) => entry.id === routeId);
    return route ? `${getCityName(config, route.from)} → ${getCityName(config, route.to)}` : null;
  };

  for (const move of movesOf(game)) {
    const name = nameOf(move.playerId);
    let kind: ReplayStep["kind"] = "hand";
    let caption: string;
    if (move.type === "route_claimed") {
      const claim = game.routeClaims.find((entry) => entry.routeId === move.routeId);
      const ends = endsOf(move.routeId);
      if (!claim || !ends) {
        continue;
      }
      routeClaims.push(claim);
      routePoints[move.playerId] = (routePoints[move.playerId] ?? 0) + move.points;
      kind = "board";
      caption = move.points > 0 ? `${name} claimed ${ends} for ${move.points}.` : `${name} claimed ${ends}.`;
    } else if (move.type === "station_built") {
      const station = game.stations.find((entry) => entry.cityId === move.cityId);
      if (!station) {
        continue;
      }
      stations.push(station);
      kind = "board";
      caption = `${name} built a station in ${getCityName(config, move.cityId)}.`;
    } else if (move.type === "card_drawn") {
      cardsDrawn[move.playerId] = (cardsDrawn[move.playerId] ?? 0) + 1;
      caption = move.source === "market" ? `${name} took a face-up ${faceLabel(move.color)}.` : `${name} drew a card from the deck.`;
    } else if (move.type === "tickets_kept") {
      ticketsKept[move.playerId] = (ticketsKept[move.playerId] ?? 0) + move.count;
      const tickets = move.count === 1 ? "1 ticket" : `${move.count} tickets`;
      caption = move.initial ? `${name} kept ${tickets} to start.` : `${name} drew tickets and kept ${move.count}.`;
    } else {
      caption = `${name} tried the tunnel ${endsOf(move.routeId) ?? "route"} and could not pay the extra cost.`;
    }
    if (kind === "hand" && options.boardOnly) {
      continue;
    }
    steps.push(snapshot(kind, caption, move.playerId));
  }
  return steps;
}
