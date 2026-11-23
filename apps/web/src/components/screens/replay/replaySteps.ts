import { getCityName, type GameMove, type GameState, type MapConfig, type RouteClaim, type StationPlacement } from "@hudson-hustle/game-core";

/** The board as it stood after one move, plus what to say about that move. */
export interface ReplayStep {
  caption: string;
  playerId: string | null;
  routeClaims: RouteClaim[];
  stations: StationPlacement[];
  /** Points from claimed routes so far, by player. Tickets and bonuses are only scored at the end. */
  routePoints: Record<string, number>;
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

/** Step 0 is the empty board; each later step adds one route or station. */
export function buildReplaySteps(game: GameState, config: MapConfig): ReplayStep[] {
  const nameOf = (playerId: string) => game.players.find((player) => player.id === playerId)?.name ?? "A player";
  const routePoints: Record<string, number> = Object.fromEntries(game.players.map((player) => [player.id, 0]));
  const routeClaims: RouteClaim[] = [];
  const stations: StationPlacement[] = [];
  const steps: ReplayStep[] = [{ caption: "The board before the first move.", playerId: null, routeClaims: [], stations: [], routePoints: { ...routePoints } }];

  for (const move of movesOf(game)) {
    let caption: string;
    if (move.type === "route_claimed") {
      const claim = game.routeClaims.find((entry) => entry.routeId === move.routeId);
      const route = config.routes.find((entry) => entry.id === move.routeId);
      if (!claim || !route) {
        continue;
      }
      routeClaims.push(claim);
      routePoints[move.playerId] = (routePoints[move.playerId] ?? 0) + move.points;
      const ends = `${getCityName(config, route.from)} → ${getCityName(config, route.to)}`;
      caption = move.points > 0 ? `${nameOf(move.playerId)} claimed ${ends} for ${move.points}.` : `${nameOf(move.playerId)} claimed ${ends}.`;
    } else {
      const station = game.stations.find((entry) => entry.cityId === move.cityId);
      if (!station) {
        continue;
      }
      stations.push(station);
      caption = `${nameOf(move.playerId)} built a station in ${getCityName(config, move.cityId)}.`;
    }
    steps.push({ caption, playerId: move.playerId, routeClaims: [...routeClaims], stations: [...stations], routePoints: { ...routePoints } });
  }
  return steps;
}
