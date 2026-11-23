// The rules as plain questions with plain answers. The reducer applies them, the bots plan with them,
// and the table and the server ask them, so a rule is written once and every part of the game agrees.
import type { MapConfig, RouteDef, TrainCard, TrainCardColor } from "./types.js";

// ---------------------------------------------------------------------------------------------
// Points

/** Points for claiming a route, by its length in spaces. */
export const ROUTE_POINTS: Readonly<Record<number, number>> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };

export function routePoints(length: number): number {
  return ROUTE_POINTS[length] ?? length * 2;
}

/** Cards a player's next station costs: one for the first, two for the second, and so on. */
export function stationCost(stationsPerPlayer: number, stationsLeft: number): number {
  return stationsPerPlayer - stationsLeft + 1;
}

// ---------------------------------------------------------------------------------------------
// Routes

/**
 * Whether a route can still be claimed. With two or three players, claiming one route of a twin
 * pair closes the other.
 */
export function isRouteOpen(route: RouteDef, routeClaims: ReadonlyArray<{ routeId: string }>, playerCount: number, config: MapConfig): boolean {
  if (routeClaims.some((claim) => claim.routeId === route.id)) {
    return false;
  }
  if (route.twinGroup && playerCount <= 3) {
    const twinIds = config.routes.filter((item) => item.twinGroup === route.twinGroup).map((item) => item.id);
    return !routeClaims.some((claim) => twinIds.includes(claim.routeId));
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Paying

/**
 * The cards a payment takes from a hand holding `colored` cards of the chosen colour and
 * `locomotives` wild cards, or null if the hand cannot pay. The required locomotives go first,
 * then the colour, then locomotives for whatever is still owed.
 */
export function paymentSpend(colored: number, locomotives: number, totalCost: number, minimumLocomotives = 0): { colored: number; locomotives: number } | null {
  if (locomotives < minimumLocomotives || colored + locomotives < totalCost) {
    return null;
  }
  const afterRequired = Math.max(0, totalCost - minimumLocomotives);
  const coloredSpent = Math.min(colored, afterRequired);
  return { colored: coloredSpent, locomotives: minimumLocomotives + (afterRequired - coloredSpent) };
}

export function canPay(hand: ReadonlyArray<TrainCard>, color: TrainCardColor, totalCost: number, minimumLocomotives = 0): boolean {
  let colored = 0;
  let locomotives = 0;
  for (const card of hand) {
    if (card.color === color) colored += 1;
    else if (card.color === "locomotive") locomotives += 1;
  }
  return paymentSpend(colored, locomotives, totalCost, minimumLocomotives) !== null;
}

// ---------------------------------------------------------------------------------------------
// Drawing

interface DrawTurn {
  stage: string;
  drawsTaken: number;
  tookFaceUpLocomotive: boolean;
}

/** How many more cards the active player may draw this turn. */
export function drawsRemaining(game: { phase: string; turn: DrawTurn }): number {
  if (game.phase !== "main") {
    return 0;
  }
  if (game.turn.stage === "idle") {
    return 2;
  }
  return game.turn.stage === "drawing" && game.turn.drawsTaken === 1 && !game.turn.tookFaceUpLocomotive ? 1 : 0;
}

/** A face-up locomotive may be taken only as the first card of a turn. */
export function canTakeMarketCard(turn: { drawsTaken: number }, card: { color: string }): boolean {
  return !(turn.drawsTaken === 1 && card.color === "locomotive");
}

// ---------------------------------------------------------------------------------------------
// Final scoring

interface ScoredTicket {
  id: string;
  from: string;
  to: string;
  points: number;
}

/**
 * A player's ticket result: their own routes connect cities, and each station they built may borrow
 * one rival route touching its city. The combination of borrowed routes that scores best counts.
 */
export function scoreTickets(
  config: MapConfig,
  routeClaims: ReadonlyArray<{ routeId: string; playerId: string }>,
  stations: ReadonlyArray<{ cityId: string; playerId: string }>,
  playerId: string,
  tickets: ReadonlyArray<ScoredTicket>
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

/** Length in trains of the longest continuous path over `routes` that uses no route twice. */
export function longestTrail(routes: ReadonlyArray<RouteDef>): number {
  const edgesByCity = new Map<string, Array<{ index: number; to: string; length: number }>>();
  routes.forEach((route, index) => {
    edgesByCity.set(route.from, [...(edgesByCity.get(route.from) ?? []), { index, to: route.to, length: route.length }]);
    edgesByCity.set(route.to, [...(edgesByCity.get(route.to) ?? []), { index, to: route.from, length: route.length }]);
  });
  const used = routes.map(() => false);
  let best = 0;
  const walk = (city: string, total: number): void => {
    best = Math.max(best, total);
    for (const edge of edgesByCity.get(city) ?? []) {
      if (!used[edge.index]) {
        used[edge.index] = true;
        walk(edge.to, total + edge.length);
        used[edge.index] = false;
      }
    }
  };
  for (const city of edgesByCity.keys()) {
    walk(city, 0);
  }
  return best;
}

/** The longest continuous path a player has built. */
export function longestPath(config: MapConfig, routeClaims: ReadonlyArray<{ routeId: string; playerId: string }>, playerId: string): number {
  const owned = routeClaims
    .filter((claim) => claim.playerId === playerId)
    .map((claim) => config.routes.find((route) => route.id === claim.routeId))
    .filter((route): route is RouteDef => route !== undefined);
  return longestTrail(owned);
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
