// The "hard" bot. The standard bot also plans its tickets through its own network, but this one
// plans them together: it weighs which tickets are worth their trains, saves cards for the routes
// the plan needs, borrows a rival's link with a station when that is the way to finish a ticket,
// builds toward the longest path with its spare trains, and spends its last turn on whatever
// scores most.
import { trainCardColors, type GameAction, type RouteDef, type TrainCardColor, type TrainCardFace } from "./types.js";
import type { PublicPlayerState } from "./multiplayer.js";
import {
  canDrawCard,
  combinations,
  countHand,
  drawBlindOrLastResort,
  findShortestPath,
  getAvailableRoutes,
  type BotDecisionContext,
  type SeatTicket
} from "./bot-shared.js";
import { longestTrail, paymentSpend, routePoints, scoreTickets, stationCost as ruleStationCost } from "./rules.js";


const tuning = {
  /** Path cost of borrowing a rival's route through a station, in train-lengths. */
  borrowCost: 5,
  /** Trains the opening ticket choice may commit to. The rest is slack for detours. */
  openingTrainBudget: 20,
  /** What one train of ticket path costs when weighing tickets against each other. */
  ticketTrainPrice: 0.45,
  /** A rival with this few trains can end the game on their next claim. */
  rivalNearEnd: 6,
  /** Draw new tickets only with at least this many trains left to build them. */
  ticketDrawMinTrains: 8,
  /** Stop drawing tickets once this many are held. */
  ticketDrawMaxHeld: 7,
  /** Off-plan routes shorter than this are not worth a turn while tickets are unfinished. */
  spareClaimMinLength: 3,
  /** What one more train on the longest path is worth, in points, while that bonus is in reach. */
  longestPathTrainValue: 1.5,
  /** The longest-path bonus counts as in reach while no rival's path is this much longer. */
  longestPathReach: 8
};

type CardCounts = Map<TrainCardFace, number>;

interface Board {
  context: BotDecisionContext;
  me: PublicPlayerState;
  counts: CardCounts;
  ownRoutes: RouteDef[];
  openRoutes: RouteDef[];
  openIds: Set<string>;
  rivalRoutes: RouteDef[];
  rivalIds: Set<string>;
  stationOwnerByCity: Map<string, string>;
  /** True when this is certainly the bot's last turn. */
  closing: boolean;
  /** True when a rival could end the game before the bot's turn after next. */
  rivalNearEnd: boolean;
  /** The bot's longest continuous path, and the longest any rival has. */
  longestPath: number;
  rivalLongestPath: number;
}

interface StationStep {
  cityId: string;
  ticketId: string;
}

interface Plan {
  /** Open routes still to claim, most important first. */
  claims: RouteDef[];
  /** Stations still to build so that a planned borrow counts. */
  stations: StationStep[];
  /** Tickets the plan gives up on: no path, no trains, or not worth the stations. */
  deadTickets: SeatTicket[];
  /** Tickets with claims still to make, by ticket id. */
  openClaimsByTicket: Map<string, number>;
  trains: number;
}

export function chooseHardAction(context: BotDecisionContext): GameAction | null {
  const board = readBoard(context);
  if (!board) {
    return null;
  }
  const { game, privateState } = context;

  if (game.phase === "initialTickets") {
    return { type: "select_initial_tickets", keptTicketIds: chooseTickets(board, 2) };
  }
  if (game.phase === "ticketChoice") {
    return { type: "keep_drawn_tickets", keptTicketIds: chooseTickets(board, 1) };
  }
  if (game.phase !== "main") {
    return null;
  }

  const plan = planTickets(board, privateState.tickets, board.me.trainsLeft - 1);
  if (game.turn.stage === "idle") {
    const action =
      (board.closing ? chooseClosingAction(board) : null) ??
      choosePlannedStep(board, plan) ??
      chooseTicketDraw(board, plan) ??
      chooseSpareClaim(board, plan);
    if (action) {
      return action;
    }
    if (!canDrawCard(game)) {
      // Nothing to draw: any route the hand can pay for beats the ticket and station last resorts.
      const claim = chooseAnyClaim(board);
      if (claim) {
        return claim;
      }
    }
  }
  return chooseDraw(board, plan);
}

function readBoard(context: BotDecisionContext): Board | null {
  const { config, game, privateState } = context;
  const me = game.players.find((player) => player.id === privateState.playerId);
  if (!me) {
    return null;
  }
  const routeById = new Map(config.routes.map((route) => [route.id, route]));
  const ownRoutes: RouteDef[] = [];
  const rivalRoutes: RouteDef[] = [];
  for (const claim of game.routeClaims) {
    const route = routeById.get(claim.routeId);
    if (route) {
      (claim.playerId === me.id ? ownRoutes : rivalRoutes).push(route);
    }
  }
  const openRoutes = getAvailableRoutes(config, game);
  const rivalLongestPath = Math.max(
    0,
    ...game.players
      .filter((player) => player.id !== me.id)
      .map((player) => {
        const ids = new Set(game.routeClaims.filter((claim) => claim.playerId === player.id).map((claim) => claim.routeId));
        return longestTrail(rivalRoutes.filter((route) => ids.has(route.id)));
      })
  );
  return {
    context,
    me,
    counts: countHand(privateState.hand),
    ownRoutes,
    openRoutes,
    openIds: new Set(openRoutes.map((route) => route.id)),
    rivalRoutes,
    rivalIds: new Set(rivalRoutes.map((route) => route.id)),
    stationOwnerByCity: new Map(game.stations.map((station) => [station.cityId, station.playerId])),
    closing: game.finalRoundRemaining !== null,
    rivalNearEnd: game.players.some((player) => player.id !== me.id && player.trainsLeft <= tuning.rivalNearEnd),
    longestPath: longestTrail(ownRoutes),
    rivalLongestPath
  };
}

// ---------------------------------------------------------------------------------------------
// Planning

/**
 * Routes each unfinished ticket, dearest first, over owned routes (free), routes already planned
 * (free), open routes (their length) and rival routes a station could borrow (a flat price).
 */
function planTickets(board: Board, tickets: SeatTicket[], trainBudget: number): Plan {
  const { config, game } = board.context;
  const { completedIds } = scoreTickets(config, game.routeClaims, game.stations, board.me.id, tickets);
  const unfinished = tickets
    .filter((ticket) => !completedIds.has(ticket.id))
    .sort((left, right) => right.points - left.points || left.id.localeCompare(right.id));

  const ownIds = new Set(board.ownRoutes.map((route) => route.id));
  const plannedClaims = new Map<string, { route: RouteDef; weight: number }>();
  const plannedBorrowIds = new Set<string>();
  const stationCitiesInUse = new Set<string>();
  const plan: Plan = { claims: [], stations: [], deadTickets: [], openClaimsByTicket: new Map(), trains: 0 };

  const stationCityFor = (route: RouteDef, taken: Set<string>): string | null => {
    const ends = [route.from, route.to];
    return (
      ends.find((city) => board.stationOwnerByCity.get(city) === board.me.id && !taken.has(city)) ??
      (board.me.stationsLeft > 0 ? ends.find((city) => !board.stationOwnerByCity.has(city) && !taken.has(city)) : undefined) ??
      null
    );
  };
  const borrowable = board.rivalRoutes.filter((route) => stationCityFor(route, stationCitiesInUse) !== null);
  const routeCost = (route: RouteDef): number => {
    if (ownIds.has(route.id) || plannedClaims.has(route.id) || plannedBorrowIds.has(route.id)) {
      return 0;
    }
    if (board.rivalIds.has(route.id)) {
      return tuning.borrowCost;
    }
    return route.length + (route.type === "tunnel" ? 1 : 0) + (route.locomotiveCost ?? 0) * 0.5;
  };

  for (const ticket of unfinished) {
    const banned = new Set<string>();
    let planned = false;
    for (let attempt = 0; attempt < 4 && !planned; attempt += 1) {
      const edges = [...board.ownRoutes, ...board.openRoutes, ...borrowable].filter((route) => !banned.has(route.id));
      const path = findShortestPath(config, edges, ticket.from, ticket.to, routeCost);
      if (path.length === 0) {
        break;
      }
      const newClaims = path.filter((route) => board.openIds.has(route.id) && !plannedClaims.has(route.id));
      const newBorrows = path.filter((route) => board.rivalIds.has(route.id) && !plannedBorrowIds.has(route.id));

      const taken = new Set(stationCitiesInUse);
      const stationCities: string[] = [];
      const unplaceable = newBorrows.find((route) => {
        const city = stationCityFor(route, taken);
        if (city) {
          taken.add(city);
          stationCities.push(city);
        }
        return city === null;
      });
      const toBuild = stationCities.filter((city) => !board.stationOwnerByCity.has(city));
      const overStationLimit = plan.stations.length + toBuild.length > board.me.stationsLeft;
      const notWorthStations = toBuild.length > 0 && ticket.points * 2 <= toBuild.length * config.settings.stationValue;
      if (unplaceable || overStationLimit || notWorthStations) {
        // Try again without the borrow that failed; a longer path over open routes may exist.
        banned.add((unplaceable ?? newBorrows.at(-1))!.id);
        continue;
      }

      const trains = newClaims.reduce((total, route) => total + route.length, 0);
      if (plan.trains + trains > trainBudget) {
        break;
      }

      for (const route of path) {
        if (board.openIds.has(route.id)) {
          const entry = plannedClaims.get(route.id) ?? { route, weight: 0 };
          entry.weight += ticket.points;
          plannedClaims.set(route.id, entry);
        }
      }
      newBorrows.forEach((route) => plannedBorrowIds.add(route.id));
      stationCities.forEach((city) => stationCitiesInUse.add(city));
      toBuild.forEach((cityId) => plan.stations.push({ cityId, ticketId: ticket.id }));
      plan.openClaimsByTicket.set(ticket.id, path.filter((route) => board.openIds.has(route.id)).length);
      plan.trains += trains;
      planned = true;
    }
    if (!planned) {
      plan.deadTickets.push(ticket);
    }
  }

  plan.claims = [...plannedClaims.values()]
    .sort((left, right) => right.weight - left.weight || right.route.length - left.route.length || left.route.id.localeCompare(right.route.id))
    .map((entry) => entry.route);
  return plan;
}

/** Keeps the ticket set worth most after paying for the trains and stations its plan needs. */
function chooseTickets(board: Board, minimumKept: number): string[] {
  const { privateState, game } = board.context;
  const offered = privateState.pendingTickets;
  const opening = game.phase === "initialTickets";
  const trainBudget = Math.min(board.me.trainsLeft - 1, opening ? tuning.openingTrainBudget : board.me.trainsLeft - 1);
  const ticketPrice = board.rivalNearEnd ? tuning.ticketTrainPrice * 3 : tuning.ticketTrainPrice;

  let best: { ids: string[]; value: number } | null = null;
  for (let size = Math.min(minimumKept, offered.length); size <= offered.length; size += 1) {
    for (const kept of combinations(offered, size)) {
      const tickets = [...privateState.tickets, ...kept];
      const plan = planTickets(board, tickets, trainBudget);
      const dead = new Set(plan.deadTickets.map((ticket) => ticket.id));
      const ticketValue = tickets.reduce((total, ticket) => total + (dead.has(ticket.id) ? -ticket.points : ticket.points), 0);
      const value = ticketValue - plan.trains * ticketPrice - plan.stations.length * board.context.config.settings.stationValue;
      const ids = kept.map((ticket) => ticket.id).sort((left, right) => left.localeCompare(right));
      if (!best || value > best.value || (value === best.value && ids.join("|").localeCompare(best.ids.join("|")) < 0)) {
        best = { ids, value };
      }
    }
  }
  return best?.ids ?? offered.map((ticket) => ticket.id);
}

// ---------------------------------------------------------------------------------------------
// Paying

function canPay(counts: CardCounts, color: TrainCardColor, total: number, minimumLocomotives: number): boolean {
  return paymentSpend(counts.get(color) ?? 0, counts.get("locomotive") ?? 0, total, minimumLocomotives) !== null;
}

/** Cards a claim should have in hand before trying: a tunnel may ask for more than its length. */
function cardsWanted(board: Board, route: RouteDef): number {
  const deckCanReveal = board.context.game.trainDeckCount + board.context.game.discardCount > 0;
  const cautious = route.type === "tunnel" && deckCanReveal && !board.closing && !board.rivalNearEnd;
  return route.length + (cautious ? 1 : 0);
}

/**
 * Sets cards aside for `routes` in order and reports what is left over and what is still missing.
 * Colored routes are served first so a gray route does not eat the cards a colored one needs.
 */
function reserveCards(board: Board, routes: RouteDef[]): { spare: CardCounts; missing: Map<TrainCardFace, number>; shortBy: Map<string, number> } {
  const spare: CardCounts = new Map(board.counts);
  const missing = new Map<TrainCardFace, number>();
  const shortBy = new Map<string, number>();
  const take = (face: TrainCardFace, wanted: number): number => {
    const taken = Math.min(spare.get(face) ?? 0, wanted);
    spare.set(face, (spare.get(face) ?? 0) - taken);
    return taken;
  };
  const ordered = [...routes.filter((route) => route.color !== "gray"), ...routes.filter((route) => route.color === "gray")];
  for (const route of ordered) {
    const wanted = cardsWanted(board, route);
    const locomotivesOwed = route.locomotiveCost ?? 0;
    const locomotivesShort = locomotivesOwed - take("locomotive", locomotivesOwed);
    const color = route.color === "gray" ? largestPile(spare) : route.color;
    let rest = wanted - locomotivesOwed;
    rest -= take(color, rest);
    rest -= take("locomotive", rest);
    if (locomotivesShort > 0) {
      missing.set("locomotive", (missing.get("locomotive") ?? 0) + locomotivesShort);
    }
    if (rest > 0) {
      missing.set(color, (missing.get(color) ?? 0) + rest);
    }
    shortBy.set(route.id, rest + locomotivesShort);
  }
  return { spare, missing, shortBy };
}

function largestPile(counts: CardCounts): TrainCardColor {
  return [...trainCardColors].sort((left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0) || left.localeCompare(right))[0]!;
}

/**
 * The color to pay for `route` with, or null when it cannot be paid. Prefers cards no other
 * planned route is waiting for, then fewer locomotives, then the smallest pile that is enough.
 */
function choosePaymentColor(board: Board, route: RouteDef, otherPlanned: RouteDef[], cards: number): TrainCardColor | null {
  if (board.me.trainsLeft < route.length) {
    return null;
  }
  const locomotivesOwed = route.locomotiveCost ?? 0;
  if (route.color !== "gray") {
    return canPay(board.counts, route.color, cards, locomotivesOwed) ? route.color : null;
  }
  const { spare } = reserveCards(board, otherPlanned.filter((other) => other.id !== route.id));
  const options = trainCardColors
    .filter((color) => canPay(board.counts, color, cards, locomotivesOwed))
    .map((color) => ({
      color,
      usesReserved: canPay(spare, color, cards, locomotivesOwed) ? 0 : 1,
      locomotives: Math.max(locomotivesOwed, cards - (board.counts.get(color) ?? 0)),
      pile: board.counts.get(color) ?? 0
    }))
    .sort(
      (left, right) =>
        left.usesReserved - right.usesReserved ||
        left.locomotives - right.locomotives ||
        left.pile - right.pile ||
        left.color.localeCompare(right.color)
    );
  return options[0]?.color ?? null;
}

function stationCost(board: Board): number {
  return ruleStationCost(board.context.config.settings.stationsPerPlayer, board.me.stationsLeft);
}

function chooseStationColor(board: Board, counts: CardCounts = board.counts): TrainCardColor | null {
  if (board.me.stationsLeft <= 0) {
    return null;
  }
  const cost = stationCost(board);
  const options = trainCardColors
    .filter((color) => canPay(counts, color, cost, 0))
    .sort((left, right) => {
      const leftLocomotives = Math.max(0, cost - (counts.get(left) ?? 0));
      const rightLocomotives = Math.max(0, cost - (counts.get(right) ?? 0));
      return leftLocomotives - rightLocomotives || (counts.get(right) ?? 0) - (counts.get(left) ?? 0) || left.localeCompare(right);
    });
  return options[0] ?? null;
}

// ---------------------------------------------------------------------------------------------
// Turn choices

/** The bot's longest path once `route` is added to its network. */
function longestPathWith(board: Board, route: RouteDef): number {
  const touchesNetwork = board.ownRoutes.some((own) => [own.from, own.to].some((city) => city === route.from || city === route.to));
  return touchesNetwork ? longestTrail([...board.ownRoutes, route]) : Math.max(board.longestPath, route.length);
}

/** What a route outside the plan is worth: its points, plus its reach toward the longest-path bonus. */
function spareValue(board: Board, route: RouteDef): number {
  const points = routePoints(route.length);
  if (board.rivalLongestPath - board.longestPath > tuning.longestPathReach) {
    return points;
  }
  return points + (longestPathWith(board, route) - board.longestPath) * tuning.longestPathTrainValue;
}

function wouldEndOwnGame(board: Board, route: RouteDef): boolean {
  return board.me.trainsLeft - route.length <= 2;
}

/** Claims the most important planned route it can pay for, or builds a planned station. */
function choosePlannedStep(board: Board, plan: Plan): GameAction | null {
  for (const route of plan.claims) {
    const color = choosePaymentColor(board, route, plan.claims, cardsWanted(board, route));
    if (!color) {
      continue;
    }
    // Using the last trains ends the bot's own game, so a station it still needs comes first.
    if (wouldEndOwnGame(board, route) && plan.stations.length > 0 && !board.closing) {
      continue;
    }
    return { type: "claim_route", routeId: route.id, color };
  }

  const { spare } = reserveCards(board, plan.claims);
  for (const step of plan.stations) {
    const completesTicket = (plan.openClaimsByTicket.get(step.ticketId) ?? 0) === 0;
    const color = completesTicket || board.rivalNearEnd ? chooseStationColor(board) : chooseStationColor(board, spare);
    if (color) {
      return { type: "build_station", cityId: step.cityId, color };
    }
  }
  return null;
}

/** With every ticket settled and trains to spare, more tickets are the best source of points. */
function chooseTicketDraw(board: Board, plan: Plan): GameAction | null {
  const { game, privateState } = board.context;
  const settled = plan.claims.length === 0 && plan.stations.length === 0;
  const roomToBuild = board.me.trainsLeft >= tuning.ticketDrawMinTrains && !board.rivalNearEnd && !board.closing;
  if (settled && roomToBuild && game.regularTicketsCount > 0 && privateState.tickets.length < tuning.ticketDrawMaxHeld) {
    return { type: "draw_tickets" };
  }
  return null;
}

/** A route outside the plan, paid for with cards and trains the plan does not need. */
function chooseSpareClaim(board: Board, plan: Plan): GameAction | null {
  const settled = plan.claims.length === 0 && plan.stations.length === 0;
  const planned = new Set(plan.claims.map((route) => route.id));
  const { spare } = reserveCards(board, plan.claims);
  const spareBoard: Board = settled ? board : { ...board, counts: spare };

  const options = board.openRoutes
    .filter((route) => !planned.has(route.id))
    .filter((route) => settled || (route.length >= tuning.spareClaimMinLength && board.me.trainsLeft - plan.trains - route.length >= 1 && !wouldEndOwnGame(board, route)))
    .map((route) => ({ route, color: choosePaymentColor(spareBoard, route, [], cardsWanted(board, route)) }))
    .filter((option): option is { route: RouteDef; color: TrainCardColor } => option.color !== null)
    .map((option) => ({ ...option, value: spareValue(board, option.route) }))
    .sort((left, right) => right.value - left.value || left.route.id.localeCompare(right.route.id));
  return options[0] ? { type: "claim_route", routeId: options[0].route.id, color: options[0].color } : null;
}

function chooseAnyClaim(board: Board): GameAction | null {
  for (const route of [...board.openRoutes].sort((left, right) => right.length - left.length || left.id.localeCompare(right.id))) {
    const color = choosePaymentColor(board, route, [], route.length);
    if (color) {
      return { type: "claim_route", routeId: route.id, color };
    }
  }
  return null;
}

/**
 * The last turn: tries every claim and every station the hand can pay for and takes the one
 * that adds most to the final score. Returns null when nothing adds anything.
 */
function chooseClosingAction(board: Board): GameAction | null {
  const { config, game, privateState } = board.context;
  const ticketTotal = (claims = game.routeClaims, stations = game.stations): number =>
    scoreTickets(config, claims, stations, board.me.id, privateState.tickets).total;
  const before = ticketTotal();
  const longestBonus = (length: number): number => (length > 0 && length >= board.rivalLongestPath ? config.settings.longestRouteBonus : 0);
  const deckCanReveal = game.trainDeckCount + game.discardCount > 0;
  let best: { action: GameAction; gain: number } | null = null;
  const consider = (action: GameAction, gain: number): void => {
    if (gain > 0 && (!best || gain > best.gain)) {
      best = { action, gain };
    }
  };

  for (const route of board.openRoutes) {
    const color = choosePaymentColor(board, route, [], route.length);
    if (!color) {
      continue;
    }
    const claim = { routeId: route.id, playerId: board.me.id, colorUsed: color, cardsSpent: [], tunnelExtraCost: 0 };
    const gain =
      (routePoints(route.length)) +
      ticketTotal([...game.routeClaims, claim]) -
      before +
      longestBonus(longestPathWith(board, route)) -
      longestBonus(board.longestPath);
    // A tunnel can ask for up to three more cards; without that cushion it may fail.
    const cushion = (board.counts.get(color) ?? 0) + (board.counts.get("locomotive") ?? 0) - route.length;
    const tunnelOdds = route.type !== "tunnel" || !deckCanReveal ? 1 : [0.45, 0.85, 0.98][cushion] ?? 1;
    consider({ type: "claim_route", routeId: route.id, color }, gain * tunnelOdds);
  }

  const stationColor = chooseStationColor(board);
  if (stationColor) {
    const cities = new Set(board.rivalRoutes.flatMap((route) => [route.from, route.to]));
    for (const cityId of [...cities].sort((left, right) => left.localeCompare(right))) {
      if (board.stationOwnerByCity.has(cityId)) {
        continue;
      }
      const gain = ticketTotal(game.routeClaims, [...game.stations, { cityId, playerId: board.me.id }]) - before - config.settings.stationValue;
      consider({ type: "build_station", cityId, color: stationColor }, gain);
    }
  }
  return (best as { action: GameAction; gain: number } | null)?.action ?? null;
}

/** Takes the face-up card the plan is waiting for, otherwise draws blind. */
function chooseDraw(board: Board, plan: Plan): GameAction {
  const { game } = board.context;
  const targets = plan.claims.length > 0 ? plan.claims : chooseSpareTargets(board);
  const { missing, shortBy } = reserveCards(board, targets);
  const oneCardFromAClaim = [...shortBy.values()].some((short) => short === 1);

  const wanted = game.market
    .map((card, marketIndex) => {
      const need = missing.get(card.color) ?? 0;
      if (card.color !== "locomotive") {
        return { marketIndex, score: need > 0 ? 10 - Math.min(need, 5) : 0 };
      }
      // A face-up locomotive costs the whole draw, so it must be worth two cards.
      if (game.turn.drawsTaken > 0) {
        return { marketIndex, score: 0 };
      }
      return { marketIndex, score: need > 0 ? 9.5 : oneCardFromAClaim ? 8.9 : 0 };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.marketIndex - right.marketIndex);

  if (wanted[0]) {
    return { type: "draw_card", source: "market", marketIndex: wanted[0].marketIndex };
  }
  return drawBlindOrLastResort(board.context);
}

/** With no ticket left to build, collect for the open routes that score most. */
function chooseSpareTargets(board: Board): RouteDef[] {
  return board.openRoutes
    .filter((route) => route.length <= board.me.trainsLeft)
    .map((route) => ({ route, value: spareValue(board, route) }))
    .sort((left, right) => right.value - left.value || left.route.id.localeCompare(right.route.id))
    .slice(0, 2)
    .map((entry) => entry.route);
}
