import { trainCardColors, type GameAction, type MapConfig, type RouteDef, type TrainCard, type TrainCardColor } from "./types.js";
import type { PublicGameState } from "./multiplayer.js";
import { chooseHardAction } from "./bot-hard.js";
import {
  canAffordRoute,
  canDrawCard,
  combinations,
  countHand,
  drawBlindOrLastResort,
  findShortestPath,
  getAvailableRoutes,
  type BotDecisionContext,
  type SeatTicket
} from "./bot-shared.js";

export { botDifficulties, type BotDecisionContext, type BotDifficulty } from "./bot-shared.js";

interface TicketPlan {
  ticket: SeatTicket;
  path: RouteDef[];
  pathCost: number;
  cityIds: Set<string>;
}

interface RouteDemand {
  route: RouteDef;
  score: number;
  ticketIds: Set<string>;
}

/** Above this many cards even the easy bot stops waiting for its ticket routes and builds something. */
const EASY_HAND_LIMIT = 12;

export function chooseBotAction(context: BotDecisionContext): GameAction {
  const difficulty = context.difficulty ?? "standard";
  if (difficulty === "easy") {
    return chooseEasyAction(context);
  }
  // The hard bot plans from its own seat; without one it has nothing to plan and plays standard.
  return (difficulty === "hard" ? chooseHardAction(context) : null) ?? chooseStandardAction(context);
}

/**
 * A beginner: keeps three opening tickets, always the ones worth most, draws only from the deck,
 * builds along its tickets, and lets about every other turn it could have built on go by.
 */
function chooseEasyAction(context: BotDecisionContext): GameAction {
  const { config, game, privateState } = context;
  if (game.phase === "initialTickets") {
    return { type: "select_initial_tickets", keptTicketIds: chooseDearestTickets(privateState.pendingTickets, 3) };
  }
  if (game.phase === "ticketChoice") {
    return { type: "keep_drawn_tickets", keptTicketIds: chooseDearestTickets(privateState.pendingTickets, 1) };
  }
  if (game.phase !== "main") {
    throw new Error(`Unsupported bot phase: ${game.phase}`);
  }

  if (game.turn.stage === "idle") {
    const demand = buildRouteDemand(context);
    // Variety without randomness: the same state always hesitates, different states do not.
    const hesitates = canDrawCard(game) && stateNumber(context) % 2 === 0;
    // With no ticket route left to build, or a hand too big to keep growing, any route will do.
    const anyRouteWillDo = demand.length === 0 || privateState.hand.length >= EASY_HAND_LIMIT || !canDrawCard(game);
    const claim = hesitates ? null : chooseTicketAlignedClaim(context, demand) ?? (anyRouteWillDo ? chooseShortestClaim(context) : null);
    if (claim) {
      return claim;
    }
  }
  return drawBlindOrLastResort(context);
}

/** A number that differs from one game state to the next but is always the same for the same state. */
function stateNumber(context: BotDecisionContext): number {
  const { game, privateState } = context;
  const mixed = game.logSequence * 31 + privateState.hand.length * 17 + game.routeClaims.length * 13 + game.trainDeckCount * 7 + game.discardCount * 3;
  return (mixed ^ (mixed >>> 3)) >>> 0;
}

/** Beginners go for the big numbers: the tickets worth most, whatever they take to build. */
function chooseDearestTickets(tickets: SeatTicket[], keepCount: number): string[] {
  return [...tickets]
    .sort((left, right) => right.points - left.points || left.id.localeCompare(right.id))
    .slice(0, keepCount)
    .map((ticket) => ticket.id);
}

/** The smallest route the hand can pay for: cheap to take, and worth little. */
function chooseShortestClaim(context: BotDecisionContext): GameAction | null {
  const trainsLeft = context.game.players[context.game.activePlayerIndex]?.trainsLeft ?? 0;
  const candidates = getAvailableRoutes(context.config, context.game)
    .map((route) => ({ route, color: chooseAffordableColor(route, context.privateState.hand, trainsLeft) }))
    .filter((candidate): candidate is { route: RouteDef; color: TrainCardColor } => candidate.color !== null)
    .sort((left, right) => left.route.length - right.route.length || left.route.id.localeCompare(right.route.id));
  return candidates[0] ? { type: "claim_route", routeId: candidates[0].route.id, color: candidates[0].color } : null;
}

function chooseStandardAction(context: BotDecisionContext): GameAction {
  if (context.game.phase === "initialTickets") {
    return {
      type: "select_initial_tickets",
      keptTicketIds: chooseTicketSet(context.config, context.config.routes, context.privateState.pendingTickets, 2)
    };
  }

  if (context.game.phase === "ticketChoice") {
    return {
      type: "keep_drawn_tickets",
      keptTicketIds: chooseTicketSet(
        context.config,
        getTicketChoiceRoutes(context.config, context.game, context.privateState.playerId),
        context.privateState.pendingTickets,
        1
      )
    };
  }

  if (context.game.phase !== "main") {
    throw new Error(`Unsupported bot phase: ${context.game.phase}`);
  }

  const demand = buildRouteDemand(context);
  if (context.game.turn.stage === "idle") {
    const claim = chooseTicketAlignedClaim(context, demand) ?? chooseFallbackClaim(context, demand);
    if (claim) {
      return claim;
    }
  }

  return chooseDrawAction(context, demand);
}

function chooseTicketSet(config: MapConfig, routes: RouteDef[], tickets: SeatTicket[], keepCount: number): string[] {
  const plans = buildTicketPlans(config, routes, tickets);
  const selections = combinations(plans, keepCount);

  const bestSelection = selections
    .map((selection) => ({
      selection,
      score: scoreTicketSelection(selection)
    }))
    .sort((left, right) => {
      const score = right.score - left.score;
      if (score !== 0) {
        return score;
      }
      return ticketIdKey(left.selection).localeCompare(ticketIdKey(right.selection));
    })[0]?.selection;

  return (bestSelection ?? plans)
    .map((plan) => plan.ticket.id)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, keepCount);
}

function buildRouteDemand(context: BotDecisionContext): RouteDemand[] {
  const availableRoutes = getAvailableRoutes(context.config, context.game);
  const incompleteTickets = context.privateState.tickets.filter((ticket) => !isTicketCompleted(context, ticket.from, ticket.to));
  const plans = buildTicketPlans(context.config, availableRoutes, incompleteTickets);
  const demandByRoute = new Map<string, RouteDemand>();

  for (const plan of plans) {
    const ticketWeight = Math.max(1, plan.ticket.points) * 14;
    for (const [index, route] of plan.path.entries()) {
      const progressBonus = Math.max(1, plan.path.length - index) * 3;
      const tunnelPenalty = route.type === "tunnel" ? 10 : 0;
      const routeValue = ticketWeight + route.length * 4 + progressBonus - tunnelPenalty;
      const current = demandByRoute.get(route.id) ?? {
        route,
        score: 0,
        ticketIds: new Set<string>()
      };
      current.score += routeValue;
      current.ticketIds.add(plan.ticket.id);
      demandByRoute.set(route.id, current);
    }
  }

  return [...demandByRoute.values()].sort((left, right) => {
    const score = right.score - left.score;
    if (score !== 0) {
      return score;
    }
    const ticketCoverage = right.ticketIds.size - left.ticketIds.size;
    if (ticketCoverage !== 0) {
      return ticketCoverage;
    }
    const length = right.route.length - left.route.length;
    return length !== 0 ? length : left.route.id.localeCompare(right.route.id);
  });
}

function chooseTicketAlignedClaim(context: BotDecisionContext, demand: RouteDemand[]): GameAction | null {
  const candidates = demand
    .map((entry) => ({
      route: entry.route,
      score: entry.score + entry.ticketIds.size * 18,
      color: chooseAffordableColor(entry.route, context.privateState.hand, context.game.players[context.game.activePlayerIndex]?.trainsLeft ?? 0)
    }))
    .filter((candidate): candidate is { route: RouteDef; score: number; color: TrainCardColor } => candidate.color !== null)
    .sort((left, right) => {
      const score = right.score - left.score;
      if (score !== 0) {
        return score;
      }
      const length = right.route.length - left.route.length;
      return length !== 0 ? length : left.route.id.localeCompare(right.route.id);
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

function chooseFallbackClaim(context: BotDecisionContext, demand: RouteDemand[]): GameAction | null {
  const fallbackBonus = new Map(demand.map((entry) => [entry.route.id, entry.score]));
  const candidates = getAvailableRoutes(context.config, context.game)
    .map((route) => ({
      route,
      color: chooseAffordableColor(route, context.privateState.hand, context.game.players[context.game.activePlayerIndex]?.trainsLeft ?? 0),
      score: (fallbackBonus.get(route.id) ?? route.length * 2) - (route.type === "tunnel" ? 10 : 0)
    }))
    .filter((candidate): candidate is { route: RouteDef; color: TrainCardColor; score: number } => candidate.color !== null)
    .sort((left, right) => {
      const score = right.score - left.score;
      if (score !== 0) {
        return score;
      }
      const length = right.route.length - left.route.length;
      return length !== 0 ? length : left.route.id.localeCompare(right.route.id);
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

function chooseDrawAction(context: BotDecisionContext, demand: RouteDemand[]): GameAction {
  const desiredColors = getDesiredColorScores(context, demand);
  const marketCandidates = context.game.market
    .map((card, marketIndex) => ({
      card,
      marketIndex,
      score:
        card.color === "locomotive"
          ? context.game.turn.drawsTaken === 0
            ? highestColorScore(desiredColors) * 0.9
            : Number.NEGATIVE_INFINITY
          : desiredColors.get(card.color as TrainCardColor) ?? 0
    }))
    .filter((candidate) => !(context.game.turn.drawsTaken === 1 && candidate.card.color === "locomotive"))
    .sort((left, right) => {
      const score = right.score - left.score;
      if (score !== 0) {
        return score;
      }
      return left.marketIndex - right.marketIndex;
    });

  if ((marketCandidates[0]?.score ?? 0) > 0) {
    return {
      type: "draw_card",
      source: "market",
      marketIndex: marketCandidates[0]!.marketIndex
    };
  }

  return drawBlindOrLastResort(context);
}

function getDesiredColorScores(context: BotDecisionContext, demand: RouteDemand[]): Map<TrainCardColor, number> {
  const scores = new Map<TrainCardColor, number>();
  const dominant = dominantHandColor(context.privateState.hand);
  const counts = countHand(context.privateState.hand);

  for (const entry of demand) {
    if (entry.route.type === "tunnel") {
      continue;
    }

    if (entry.route.color === "gray") {
      const grayColor = choosePreferredGrayColor(entry.route, context.privateState.hand, dominant);
      if (grayColor) {
        const deficit = Math.max(1, entry.route.length - (counts.get(grayColor) ?? 0));
        scores.set(grayColor, (scores.get(grayColor) ?? 0) + entry.score / deficit);
      }
      continue;
    }

    const deficit = Math.max(1, entry.route.length - (counts.get(entry.route.color) ?? 0));
    scores.set(entry.route.color, (scores.get(entry.route.color) ?? 0) + entry.score / deficit);
  }

  return scores;
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

function chooseAffordableColor(route: RouteDef, hand: TrainCard[], trainsLeft: number): TrainCardColor | null {
  if (trainsLeft < route.length) {
    return null;
  }

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

function choosePreferredGrayColor(route: RouteDef, hand: TrainCard[], dominant: TrainCardColor | null): TrainCardColor | null {
  const counts = countHand(hand);
  const candidates = trainCardColors
    .map((color) => ({
      color,
      colored: counts.get(color) ?? 0,
      waste: paymentWaste(route, color, hand)
    }))
    .sort((left, right) => {
      const count = right.colored - left.colored;
      if (count !== 0) {
        return count;
      }
      const waste = left.waste - right.waste;
      if (waste !== 0) {
        return waste;
      }
      if (dominant) {
        if (left.color === dominant && right.color !== dominant) {
          return -1;
        }
        if (right.color === dominant && left.color !== dominant) {
          return 1;
        }
      }
      return left.color.localeCompare(right.color);
    });

  return candidates[0]?.color ?? dominant;
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

function buildTicketPlans(config: MapConfig, routes: RouteDef[], tickets: SeatTicket[]): TicketPlan[] {
  return [...tickets]
    .map((ticket) => {
      const path = findShortestPath(config, routes, ticket.from, ticket.to);
      return {
        ticket,
        path,
        pathCost: path.reduce((total, route) => total + route.length + (route.type === "tunnel" ? 2 : 0), 0),
        cityIds: new Set(path.flatMap((route) => [route.from, route.to]))
      };
    })
    .sort((left, right) => right.ticket.points - left.ticket.points || left.ticket.id.localeCompare(right.ticket.id));
}

function scoreTicketSelection(selection: TicketPlan[]): number {
  if (selection.some((plan) => plan.path.length === 0)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  const routeCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const plan of selection) {
    score += plan.ticket.points * 12;
    score -= plan.pathCost * 3;

    for (const route of plan.path) {
      routeCounts.set(route.id, (routeCounts.get(route.id) ?? 0) + 1);
    }
    for (const cityId of plan.cityIds) {
      cityCounts.set(cityId, (cityCounts.get(cityId) ?? 0) + 1);
    }
  }

  for (const count of routeCounts.values()) {
    if (count > 1) {
      score += (count - 1) * 24;
    }
  }

  for (const count of cityCounts.values()) {
    if (count > 1) {
      score += (count - 1) * 5;
    }
  }

  return score;
}

function ticketIdKey(selection: TicketPlan[]): string {
  return selection
    .map((plan) => plan.ticket.id)
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

function highestColorScore(scores: Map<TrainCardColor, number>): number {
  return [...scores.values()].sort((left, right) => right - left)[0] ?? 0;
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

function getTicketChoiceRoutes(config: MapConfig, game: PublicGameState, playerId: string | null): RouteDef[] {
  if (!playerId) {
    return getAvailableRoutes(config, game);
  }

  const claimedByPlayer = new Set(
    game.routeClaims.filter((claim) => claim.playerId === playerId).map((claim) => claim.routeId)
  );

  return getAvailableRoutes(config, game).concat(config.routes.filter((route) => claimedByPlayer.has(route.id)));
}
