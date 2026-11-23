import { trainCardColors, type GameAction, type MapConfig, type RouteDef, type TrainCard, type TrainCardColor } from "./types.js";
import { chooseHardAction } from "./bot-hard.js";
import {
  canAffordRoute,
  canDrawCard,
  combinations,
  countHand,
  drawBlindOrLastResort,
  findShortestPath,
  getAvailableRoutes,
  plainRouteCost,
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
  tickets: Set<SeatTicket>;
}

/** With this many cards and still nothing on its ticket to build, the easy bot builds something anyway. */
const EASY_HAND_LIMIT = 12;

const standardTuning = {
  /** While tickets are unfinished, cards are saved for them until the hand is this big. */
  handLimit: 18,
  /** With every ticket settled, the hand is spent on any route once it is this big. */
  settledHandLimit: 8,
  /** With every ticket settled, routes this long are built as soon as the hand can pay for them. */
  spareMinLength: 3,
  /** More tickets are drawn while at least this many trains are left... */
  ticketDrawMinTrains: 4,
  /** ...and fewer than this many tickets are held. */
  ticketDrawMaxHeld: 8,
  /** How much a ticket's points count against the trains its path costs when choosing tickets. */
  ticketPointWeight: 2,
  drawnTicketPointWeight: 12,
  ticketTrainWeight: 3
};

export function chooseBotAction(context: BotDecisionContext): GameAction {
  const difficulty = context.difficulty ?? "standard";
  if (difficulty === "easy") {
    return chooseEasyAction(context);
  }
  // The hard bot plans from its own seat; without one it has nothing to plan and plays standard.
  return (difficulty === "hard" ? chooseHardAction(context) : null) ?? chooseStandardAction(context);
}

/**
 * A beginner. It acts every turn, but short-sightedly: it keeps three opening tickets (one more
 * than it can comfortably build), draws only from the deck, works on one ticket at a time, and
 * builds the smallest route it can pay for whenever that ticket is done or its hand has filled up.
 * It never builds a station, and never thinks about the longest route or the end of the game.
 */
function chooseEasyAction(context: BotDecisionContext): GameAction {
  const { game, privateState } = context;
  if (game.phase === "initialTickets") {
    return { type: "select_initial_tickets", keptTicketIds: chooseCheapestTickets(privateState.pendingTickets, 3) };
  }
  if (game.phase === "ticketChoice") {
    return { type: "keep_drawn_tickets", keptTicketIds: chooseCheapestTickets(privateState.pendingTickets, 1) };
  }
  if (game.phase !== "main") {
    throw new Error(`Unsupported bot phase: ${game.phase}`);
  }

  if (game.turn.stage === "idle") {
    const demand = focusOnDearestTicket(buildRouteDemand(context));
    // With no ticket route left to build, or a hand too big to keep growing, any route will do.
    const anyRouteWillDo = demand.length === 0 || privateState.hand.length >= EASY_HAND_LIMIT || !canDrawCard(game);
    const claim = chooseTicketAlignedClaim(context, demand) ?? (anyRouteWillDo ? chooseShortestClaim(context) : null);
    if (claim) {
      return claim;
    }
  }
  return drawBlindOrLastResort(context);
}

/** Only the dearest unfinished ticket that can still be built gets any attention. */
function focusOnDearestTicket(demand: RouteDemand[]): RouteDemand[] {
  const tickets = new Map(demand.flatMap((entry) => [...entry.tickets].map((ticket) => [ticket.id, ticket] as const)));
  const dearest = [...tickets.values()].sort((left, right) => right.points - left.points || left.id.localeCompare(right.id))[0];
  return dearest ? demand.filter((entry) => entry.ticketIds.has(dearest.id)) : [];
}

/** Beginners shy away from the big tickets: the ones worth least look the easiest. */
function chooseCheapestTickets(tickets: SeatTicket[], keepCount: number): string[] {
  return [...tickets]
    .sort((left, right) => left.points - right.points || left.id.localeCompare(right.id))
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

/**
 * A steady player: keeps two opening tickets it has the trains for, plans each one through the
 * routes it already owns, builds along those plans and saves its cards for them. Once its tickets
 * are settled it draws more, whether or not there is time left to build them. It does not use
 * stations, reserve cards between routes, cushion tunnels, chase the longest route or time the
 * end of the game; those are the hard bot's edge.
 */
function chooseStandardAction(context: BotDecisionContext): GameAction {
  if (context.game.phase === "initialTickets") {
    return {
      type: "select_initial_tickets",
      keptTicketIds: chooseTicketSet(context.config, context.config.routes, plainRouteCost, context.privateState.pendingTickets, 2, ownTrainsLeft(context), standardTuning.ticketPointWeight)
    };
  }

  if (context.game.phase === "ticketChoice") {
    const network = readNetwork(context);
    return {
      type: "keep_drawn_tickets",
      keptTicketIds: chooseTicketSet(context.config, network.routes, network.cost, context.privateState.pendingTickets, 1, ownTrainsLeft(context), standardTuning.drawnTicketPointWeight)
    };
  }

  if (context.game.phase !== "main") {
    throw new Error(`Unsupported bot phase: ${context.game.phase}`);
  }

  const demand = buildRouteDemand(context);
  if (context.game.turn.stage === "idle") {
    const settled = demand.length === 0;
    const aligned = chooseTicketAlignedClaim(context, demand, true);
    if (!aligned && settled && wantsMoreTickets(context)) {
      return { type: "draw_tickets" };
    }
    // Off-plan routes only once the tickets are settled, and then only ones worth saving up for,
    // unless the hand is full or nothing can be drawn.
    const handLimit = settled ? standardTuning.settledHandLimit : standardTuning.handLimit;
    const mustBuild = context.privateState.hand.length >= handLimit || !canDrawCard(context.game);
    const spareMinLength = mustBuild ? 1 : settled ? standardTuning.spareMinLength : Number.POSITIVE_INFINITY;
    const claim = aligned ?? chooseFallbackClaim(context, demand, spareMinLength);
    if (claim) {
      return claim;
    }
  }

  return chooseDrawAction(context, demand);
}

/** With its tickets settled and a few trains left, the standard bot asks for more. */
function wantsMoreTickets(context: BotDecisionContext): boolean {
  return (
    context.game.regularTicketsCount > 0 &&
    ownTrainsLeft(context) >= standardTuning.ticketDrawMinTrains &&
    context.privateState.tickets.length < standardTuning.ticketDrawMaxHeld
  );
}

function ownTrainsLeft(context: BotDecisionContext): number {
  return context.game.players.find((player) => player.id === context.privateState.playerId)?.trainsLeft ?? Number.POSITIVE_INFINITY;
}

/** The routes a seat can plan over: open ones at their price, its own for nothing. */
function readNetwork(context: BotDecisionContext): { routes: RouteDef[]; open: RouteDef[]; ownIds: Set<string>; cost: (route: RouteDef) => number } {
  const ownIds = new Set(
    context.game.routeClaims.filter((claim) => claim.playerId === context.privateState.playerId).map((claim) => claim.routeId)
  );
  const open = getAvailableRoutes(context.config, context.game);
  return {
    routes: open.concat(context.config.routes.filter((route) => ownIds.has(route.id))),
    open,
    ownIds,
    cost: (route) => (ownIds.has(route.id) ? 0 : plainRouteCost(route))
  };
}

function chooseTicketSet(
  config: MapConfig,
  routes: RouteDef[],
  routeCost: (route: RouteDef) => number,
  tickets: SeatTicket[],
  keepCount: number,
  trainBudget: number,
  pointWeight: number
): string[] {
  const plans = buildTicketPlans(config, routes, routeCost, tickets);
  const selections = combinations(plans, keepCount);

  const bestSelection = selections
    .map((selection) => ({
      selection,
      score: scoreTicketSelection(selection, routeCost, trainBudget, pointWeight)
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

/**
 * The open routes the seat's unfinished tickets still need, most wanted first. A ticket with no
 * path left, or one that needs more trains than the seat has, asks for nothing.
 */
function buildRouteDemand(context: BotDecisionContext): RouteDemand[] {
  const network = readNetwork(context);
  const incompleteTickets = context.privateState.tickets.filter((ticket) => !isTicketCompleted(context, ticket.from, ticket.to));
  const plans = buildTicketPlans(context.config, network.routes, network.cost, incompleteTickets);
  const demandByRoute = new Map<string, RouteDemand>();
  const trainsLeft = ownTrainsLeft(context);

  for (const plan of plans) {
    const ticketWeight = Math.max(1, plan.ticket.points) * 14;
    // Routes the seat already owns are part of the path but need no building.
    const toBuild = plan.path.filter((route) => !network.ownIds.has(route.id));
    if (toBuild.reduce((total, route) => total + route.length, 0) > trainsLeft) {
      // Not enough trains left to finish this ticket: stop working on it.
      continue;
    }
    for (const [index, route] of toBuild.entries()) {
      const progressBonus = Math.max(1, toBuild.length - index) * 3;
      const tunnelPenalty = route.type === "tunnel" ? 10 : 0;
      const routeValue = ticketWeight + route.length * 4 + progressBonus - tunnelPenalty;
      const current = demandByRoute.get(route.id) ?? {
        route,
        score: 0,
        ticketIds: new Set<string>(),
        tickets: new Set<SeatTicket>()
      };
      current.score += routeValue;
      current.ticketIds.add(plan.ticket.id);
      current.tickets.add(plan.ticket);
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

function chooseTicketAlignedClaim(context: BotDecisionContext, demand: RouteDemand[], keepLocomotives = false): GameAction | null {
  const trainsLeft = context.game.players[context.game.activePlayerIndex]?.trainsLeft ?? 0;
  // Locomotives another planned route cannot be built without are not spent as wild cards.
  const handFor = (route: RouteDef): TrainCard[] => {
    if (!keepLocomotives || route.locomotiveCost) {
      return context.privateState.hand;
    }
    let owed = Math.max(0, ...demand.filter((entry) => entry.route.id !== route.id).map((entry) => entry.route.locomotiveCost ?? 0));
    return context.privateState.hand.filter((card) => card.color !== "locomotive" || owed-- <= 0);
  };
  const candidates = demand
    .map((entry) => ({
      route: entry.route,
      score: entry.score + entry.ticketIds.size * 18,
      color: chooseAffordableColor(entry.route, handFor(entry.route), trainsLeft)
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

function chooseFallbackClaim(context: BotDecisionContext, demand: RouteDemand[], minLength: number): GameAction | null {
  const fallbackBonus = new Map(demand.map((entry) => [entry.route.id, entry.score]));
  const candidates = getAvailableRoutes(context.config, context.game)
    .filter((route) => route.length >= minLength)
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
  // A planned route that must be paid partly in locomotives makes a face-up one worth the whole draw.
  const locomotivesHeld = countHand(context.privateState.hand).get("locomotive") ?? 0;
  const owesLocomotives = demand.some((entry) => (entry.route.locomotiveCost ?? 0) > locomotivesHeld);
  const marketCandidates = context.game.market
    .map((card, marketIndex) => ({
      card,
      marketIndex,
      score:
        card.color === "locomotive"
          ? context.game.turn.drawsTaken === 0
            ? highestColorScore(desiredColors) * (owesLocomotives ? 1.5 : 0.9)
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

function buildTicketPlans(
  config: MapConfig,
  routes: RouteDef[],
  routeCost: (route: RouteDef) => number,
  tickets: SeatTicket[]
): TicketPlan[] {
  return [...tickets]
    .map((ticket) => {
      const path = findShortestPath(config, routes, ticket.from, ticket.to, routeCost);
      return {
        ticket,
        path,
        pathCost: path.reduce((total, route) => total + routeCost(route), 0),
        cityIds: new Set(path.flatMap((route) => [route.from, route.to]))
      };
    })
    .sort((left, right) => right.ticket.points - left.ticket.points || left.ticket.id.localeCompare(right.ticket.id));
}

function scoreTicketSelection(
  selection: TicketPlan[],
  routeCost: (route: RouteDef) => number,
  trainBudget: number,
  pointWeight: number
): number {
  if (selection.some((plan) => plan.path.length === 0)) {
    return Number.NEGATIVE_INFINITY;
  }

  // Tickets that together need more trains than the seat has cannot all be finished.
  const toBuild = new Map(selection.flatMap((plan) => plan.path.filter((route) => routeCost(route) > 0).map((route) => [route.id, route.length] as const)));
  const trains = [...toBuild.values()].reduce((total, length) => total + length, 0);
  let score = trains > trainBudget ? -1000 * (trains - trainBudget) : 0;
  const routeCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const plan of selection) {
    score += plan.ticket.points * pointWeight;
    score -= plan.pathCost * standardTuning.ticketTrainWeight;

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
