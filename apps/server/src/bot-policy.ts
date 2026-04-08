import {
  trainCardColors,
  type GameAction,
  type MapConfig,
  type PublicGameState,
  type RouteDef,
  type SeatPrivateState,
  type TrainCard,
  type TrainCardColor
} from "@hudson-hustle/game-core";

export interface BotDecisionContext {
  config: MapConfig;
  game: PublicGameState;
  privateState: SeatPrivateState;
}

interface PathEdge {
  route: RouteDef;
  to: string;
}

export function chooseBotAction(context: BotDecisionContext): GameAction {
  if (context.game.phase === "initialTickets") {
    return {
      type: "select_initial_tickets",
      keptTicketIds: [...context.privateState.pendingTickets]
        .sort((left, right) => right.points - left.points || left.id.localeCompare(right.id))
        .slice(0, 2)
        .map((ticket) => ticket.id)
    };
  }

  if (context.game.phase === "ticketChoice") {
    return {
      type: "keep_drawn_tickets",
      keptTicketIds: [...context.privateState.pendingTickets]
        .sort((left, right) => right.points - left.points || left.id.localeCompare(right.id))
        .slice(0, 1)
        .map((ticket) => ticket.id)
    };
  }

  if (context.game.phase !== "main") {
    throw new Error(`Unsupported bot phase: ${context.game.phase}`);
  }

  const targetPath = chooseTargetPath(context);
  if (context.game.turn.stage === "idle") {
    const claim = chooseTicketAlignedClaim(context, targetPath) ?? chooseFallbackClaim(context);
    if (claim) {
      return claim;
    }
  }

  return chooseDrawAction(context, targetPath);
}

function chooseTargetPath(context: BotDecisionContext): RouteDef[] {
  const availableRoutes = getAvailableRoutes(context.config, context.game);
  const incompleteTickets = [...context.privateState.tickets]
    .filter((ticket) => !isTicketCompleted(context, ticket.from, ticket.to))
    .sort((left, right) => right.points - left.points || left.id.localeCompare(right.id));

  for (const ticket of incompleteTickets) {
    const path = findShortestPath(context.config, availableRoutes, ticket.from, ticket.to);
    if (path.length > 0) {
      return path;
    }
  }

  return [];
}

function chooseTicketAlignedClaim(context: BotDecisionContext, targetPath: RouteDef[]): GameAction | null {
  for (const route of targetPath) {
    if (route.type === "tunnel") {
      continue;
    }
    const color = chooseAffordableColor(route, context.privateState.hand);
    if (color) {
      return {
        type: "claim_route",
        routeId: route.id,
        color
      };
    }
  }

  return null;
}

function chooseFallbackClaim(context: BotDecisionContext): GameAction | null {
  const candidates = getAvailableRoutes(context.config, context.game)
    .filter((route) => route.type !== "tunnel")
    .map((route) => ({ route, color: chooseAffordableColor(route, context.privateState.hand) }))
    .filter((candidate): candidate is { route: RouteDef; color: TrainCardColor } => candidate.color !== null)
    .sort((left, right) => {
      const score = right.route.length - left.route.length;
      return score !== 0 ? score : left.route.id.localeCompare(right.route.id);
    });

  if (candidates.length === 0) {
    return null;
  }

  return {
    type: "claim_route",
    routeId: candidates[0].route.id,
    color: candidates[0].color
  };
}

function chooseDrawAction(context: BotDecisionContext, targetPath: RouteDef[]): GameAction {
  const desiredColors = getDesiredColors(targetPath, context.privateState.hand);
  const marketIndex = context.game.market.findIndex((card, index) => {
    if (context.game.turn.drawsTaken === 1 && card.color === "locomotive") {
      return false;
    }
    return card.color !== "locomotive" && desiredColors.includes(card.color as TrainCardColor);
  });

  if (marketIndex >= 0) {
    return {
      type: "draw_card",
      source: "market",
      marketIndex
    };
  }

  if (context.game.turn.drawsTaken === 0) {
    const locomotiveIndex = context.game.market.findIndex((card) => card.color === "locomotive");
    if (locomotiveIndex >= 0 && desiredColors.length > 0) {
      return {
        type: "draw_card",
        source: "market",
        marketIndex: locomotiveIndex
      };
    }
  }

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

  throw new Error("No legal bot draw action is available.");
}

function getDesiredColors(targetPath: RouteDef[], hand: TrainCard[]): TrainCardColor[] {
  const seen = new Set<TrainCardColor>();
  const desired: TrainCardColor[] = [];
  const dominant = dominantHandColor(hand);

  for (const route of targetPath) {
    if (route.color === "gray") {
      if (dominant && !seen.has(dominant)) {
        seen.add(dominant);
        desired.push(dominant);
      }
      continue;
    }
    if (!seen.has(route.color)) {
      seen.add(route.color);
      desired.push(route.color);
    }
  }

  return desired;
}

function dominantHandColor(hand: TrainCard[]): TrainCardColor | null {
  const counts = new Map<TrainCardColor, number>();
  for (const card of hand) {
    if (card.color === "locomotive") {
      continue;
    }
    counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
}

function chooseAffordableColor(route: RouteDef, hand: TrainCard[]): TrainCardColor | null {
  if (route.color !== "gray") {
    return canAffordRoute(route, route.color, hand) ? route.color : null;
  }

  const candidates = trainCardColors
    .filter((color) => canAffordRoute(route, color, hand))
    .sort((left, right) => {
      const leftWaste = paymentWaste(route, left, hand);
      const rightWaste = paymentWaste(route, right, hand);
      return leftWaste - rightWaste || left.localeCompare(right);
    });

  return candidates[0] ?? null;
}

function paymentWaste(route: RouteDef, color: TrainCardColor, hand: TrainCard[]): number {
  const counts = countHand(hand);
  const colored = counts.get(color) ?? 0;
  const locomotives = counts.get("locomotive") ?? 0;
  const baseNeed = route.length;
  const locoNeed = route.locomotiveCost ?? 0;
  const extraLocosUsed = Math.max(0, baseNeed - colored);
  const totalLocosUsed = Math.max(locoNeed, extraLocosUsed);
  return totalLocosUsed + Math.max(0, colored - baseNeed);
}

function canAffordRoute(route: RouteDef, color: TrainCardColor, hand: TrainCard[]): boolean {
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

function countHand(hand: TrainCard[]): Map<TrainCard["color"], number> {
  const counts = new Map<TrainCard["color"], number>();
  for (const card of hand) {
    counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  }
  return counts;
}

function isTicketCompleted(context: BotDecisionContext, from: string, to: string): boolean {
  const claimedRouteIds = new Set(
    context.game.routeClaims
      .filter((claim) => claim.playerId === context.privateState.playerId)
      .map((claim) => claim.routeId)
  );
  const adjacency = new Map<string, string[]>();

  for (const route of context.config.routes) {
    if (!claimedRouteIds.has(route.id)) {
      continue;
    }
    adjacency.set(route.from, [...(adjacency.get(route.from) ?? []), route.to]);
    adjacency.set(route.to, [...(adjacency.get(route.to) ?? []), route.from]);
  }

  const queue = [from];
  const visited = new Set<string>(queue);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) {
      return true;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next)) {
        continue;
      }
      visited.add(next);
      queue.push(next);
    }
  }

  return false;
}

function getAvailableRoutes(config: MapConfig, game: PublicGameState): RouteDef[] {
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

function findShortestPath(config: MapConfig, routes: RouteDef[], from: string, to: string): RouteDef[] {
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
      const candidateDistance =
        (distances.get(current) ?? Number.POSITIVE_INFINITY) +
        edge.route.length +
        (edge.route.type === "tunnel" ? 2 : 0);
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
