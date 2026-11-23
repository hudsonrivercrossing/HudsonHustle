// Helpers every bot tier uses: reading the board, path finding, ticket scoring and the
// last-resort moves that keep a bot from ever being left without a legal action.
import {
  trainCardColors,
  type GameAction,
  type MapConfig,
  type RouteClaim,
  type RouteDef,
  type StationPlacement,
  type TrainCard,
  type TrainCardColor
} from "./types.js";
import type { PublicGameState, SeatPrivateState } from "./multiplayer.js";

export const botDifficulties = ["easy", "standard", "hard"] as const;
export type BotDifficulty = (typeof botDifficulties)[number];

export interface BotDecisionContext {
  config: MapConfig;
  game: PublicGameState;
  privateState: SeatPrivateState;
  /** Which tier decides. Absent means "standard". */
  difficulty?: BotDifficulty;
}

export type SeatTicket = SeatPrivateState["tickets"][number];

interface PathEdge {
  route: RouteDef;
  to: string;
}

export function combinations<T>(items: T[], size: number): T[][] {
  if (size <= 0 || size > items.length) {
    return [];
  }
  if (size === 1) {
    return items.map((item) => [item]);
  }

  const result: T[][] = [];
  for (let index = 0; index <= items.length - size; index += 1) {
    const head = items[index]!;
    for (const tail of combinations(items.slice(index + 1), size - 1)) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

export function countHand(hand: TrainCard[]): Map<TrainCard["color"], number> {
  const counts = new Map<TrainCard["color"], number>();
  for (const card of hand) {
    counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  }
  return counts;
}

export function canAffordRoute(route: RouteDef, color: TrainCardColor, hand: TrainCard[]): boolean {
  const counts = countHand(hand);
  const colored = counts.get(color) ?? 0;
  const locomotives = counts.get("locomotive") ?? 0;
  const baseNeed = route.length;
  const locoNeed = route.locomotiveCost ?? 0;
  if (locomotives < locoNeed) {
    return false;
  }
  const usableLocomotives = locomotives;
  return colored + usableLocomotives >= baseNeed;
}

export function getAvailableRoutes(config: MapConfig, game: PublicGameState): RouteDef[] {
  const claimedRouteIds = new Set(game.routeClaims.map((claim) => claim.routeId));
  const blockedTwinGroups =
    game.players.length <= 3
      ? new Set(
          game.routeClaims
            .map((claim) => config.routes.find((route) => route.id === claim.routeId)?.twinGroup ?? null)
            .filter((group): group is string => group !== null)
        )
      : new Set<string>();

  return config.routes.filter((route) => {
    if (claimedRouteIds.has(route.id)) {
      return false;
    }
    if (route.twinGroup && blockedTwinGroups.has(route.twinGroup)) {
      return false;
    }
    return true;
  });
}

/** What a route costs when planning a path: its length, plus a little for a tunnel's possible surcharge. */
export function plainRouteCost(route: RouteDef): number {
  return route.length + (route.type === "tunnel" ? 2 : 0);
}

export function findShortestPath(
  config: MapConfig,
  routes: RouteDef[],
  from: string,
  to: string,
  routeCost: (route: RouteDef) => number = plainRouteCost
): RouteDef[] {
  const adjacency = new Map<string, PathEdge[]>();
  for (const route of routes) {
    adjacency.set(route.from, [...(adjacency.get(route.from) ?? []), { route, to: route.to }]);
    adjacency.set(route.to, [...(adjacency.get(route.to) ?? []), { route, to: route.from }]);
  }

  const distances = new Map<string, number>(config.cities.map((city) => [city.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, { city: string; route: RouteDef }>();
  const queue = new Set(config.cities.map((city) => city.id));
  distances.set(from, 0);

  while (queue.size > 0) {
    const current = [...queue].sort((left, right) => (distances.get(left) ?? Number.POSITIVE_INFINITY) - (distances.get(right) ?? Number.POSITIVE_INFINITY))[0];
    if (!current || distances.get(current) === Number.POSITIVE_INFINITY) {
      break;
    }
    queue.delete(current);
    if (current === to) {
      break;
    }
    for (const edge of adjacency.get(current) ?? []) {
      if (!queue.has(edge.to)) {
        continue;
      }
      const candidateDistance = (distances.get(current) ?? Number.POSITIVE_INFINITY) + routeCost(edge.route);
      if (candidateDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidateDistance);
        previous.set(edge.to, { city: current, route: edge.route });
      }
    }
  }

  if (!previous.has(to)) {
    return [];
  }

  const path: RouteDef[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = previous.get(cursor);
    if (!step) {
      return [];
    }
    path.unshift(step.route);
    cursor = step.city;
  }
  return path;
}

export function chooseAnyAffordableStation(context: BotDecisionContext): GameAction | null {
  const self = context.game.players.find((player) => player.id === context.privateState.playerId);
  if (context.game.turn.stage !== "idle" || !self || self.stationsLeft <= 0) {
    return null;
  }
  const city = context.config.cities.find((candidate) => !context.game.stations.some((station) => station.cityId === candidate.id));
  if (!city) {
    return null;
  }
  const cost = context.config.settings.stationsPerPlayer - self.stationsLeft + 1;
  const locomotives = context.privateState.hand.filter((card) => card.color === "locomotive").length;
  const color = trainCardColors.find(
    (candidate) => context.privateState.hand.filter((card) => card.color === candidate).length + locomotives >= cost
  );
  return color ? { type: "build_station", cityId: city.id, color } : null;
}

/** Whether the active player may take any train card right now. */
export function canDrawCard(game: PublicGameState): boolean {
  return (
    game.trainDeckCount > 0 ||
    game.discardCount > 0 ||
    game.market.some((card) => !(game.turn.drawsTaken === 1 && card.color === "locomotive"))
  );
}

/**
 * A draw that needs no judgement, then the moves that stay legal when no card can be drawn at all.
 * Every tier ends here, so a bot always has an action in any state the rules can reach.
 */
export function drawBlindOrLastResort(context: BotDecisionContext): GameAction {
  if (context.game.trainDeckCount > 0 || context.game.discardCount > 0) {
    return {
      type: "draw_card",
      source: "deck"
    };
  }

  const firstLegalMarketIndex = context.game.market.findIndex((card) => {
    return !(context.game.turn.drawsTaken === 1 && card.color === "locomotive");
  });

  if (firstLegalMarketIndex >= 0) {
    return {
      type: "draw_card",
      source: "market",
      marketIndex: firstLegalMarketIndex
    };
  }

  // No card can be taken anywhere. New tickets are the one action that needs none.
  if (context.game.turn.stage === "idle" && context.game.regularTicketsCount > 0) {
    return { type: "draw_tickets" };
  }

  // Last resort: a station needs only cards in hand.
  const station = chooseAnyAffordableStation(context);
  if (station) {
    return station;
  }

  throw new Error("No legal bot action is available.");
}

/**
 * The ticket result the end-of-game scoring would give: each of the player's stations may borrow
 * one rival route touching its city, and the best combination counts.
 */
export function scoreTickets(
  config: MapConfig,
  routeClaims: RouteClaim[],
  stations: StationPlacement[],
  playerId: string,
  tickets: SeatTicket[]
): { total: number; completedIds: Set<string> } {
  const routeById = new Map(config.routes.map((route) => [route.id, route]));
  const owned: RouteDef[] = [];
  const rival: RouteDef[] = [];
  for (const claim of routeClaims) {
    const route = routeById.get(claim.routeId);
    if (route) {
      (claim.playerId === playerId ? owned : rival).push(route);
    }
  }
  const borrowChoices = stations
    .filter((station) => station.playerId === playerId)
    .map((station) => [null, ...rival.filter((route) => route.from === station.cityId || route.to === station.cityId)]);

  let best = { total: Number.NEGATIVE_INFINITY, completedIds: new Set<string>() };
  const visit = (index: number, borrowed: RouteDef[]): void => {
    if (index < borrowChoices.length) {
      for (const choice of borrowChoices[index]!) {
        visit(index + 1, choice ? [...borrowed, choice] : borrowed);
      }
      return;
    }
    const reach = connectedCities([...owned, ...borrowed]);
    let total = 0;
    const completedIds = new Set<string>();
    for (const ticket of tickets) {
      if (ticket.from === ticket.to || (reach.get(ticket.from) !== undefined && reach.get(ticket.from) === reach.get(ticket.to))) {
        total += ticket.points;
        completedIds.add(ticket.id);
      } else {
        total -= ticket.points;
      }
    }
    if (total > best.total) {
      best = { total, completedIds };
    }
  };
  visit(0, []);
  return best;
}

/** Labels every city touched by `routes` with the id of its connected group. */
function connectedCities(routes: RouteDef[]): Map<string, string> {
  const parent = new Map<string, string>();
  const find = (city: string): string => {
    let root = city;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    return root;
  };
  for (const route of routes) {
    for (const city of [route.from, route.to]) {
      if (!parent.has(city)) {
        parent.set(city, city);
      }
    }
    parent.set(find(route.from), find(route.to));
  }
  return new Map([...parent.keys()].map((city) => [city, find(city)]));
}
