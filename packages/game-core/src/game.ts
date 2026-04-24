import { shuffleWithSeed } from "./random.js";
import {
  type CityDef,
  type GameAction,
  type GameSetup,
  type GameState,
  type MapConfig,
  type PlayerState,
  type RouteClaim,
  type RouteDef,
  type StationPlacement,
  type TicketDef,
  type TrainCard,
  type TrainCardColor,
  type TrainCardFace,
  trainCardColors
} from "./types.js";

const playerColors: PlayerState["color"][] = [
  "harbor-blue",
  "signal-red",
  "path-green",
  "ferry-gold"
];

const routeScoreTable: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15
};

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function appendLog(state: GameState, message: string): void {
  state.log = [...state.log, message].slice(-18);
}

function buildTrainDeck(): TrainCard[] {
  const deck: TrainCard[] = [];
  let counter = 0;
  for (const color of trainCardColors) {
    for (let index = 0; index < 12; index += 1) {
      deck.push({ id: `card-${counter++}`, color });
    }
  }
  for (let index = 0; index < 14; index += 1) {
    deck.push({ id: `card-${counter++}`, color: "locomotive" });
  }
  return deck;
}

function drawCardFromDeck(state: GameState): TrainCard {
  if (state.trainDeck.length === 0) {
    invariant(state.discardPile.length > 0, "No train cards left to draw.");
    const shuffled = shuffleWithSeed(state.discardPile, state.rngState);
    state.rngState = shuffled.nextState;
    state.trainDeck = shuffled.value;
    state.discardPile = [];
  }

  const card = state.trainDeck.shift();
  invariant(card, "Expected a train card.");
  return card;
}

function normalizeMarket(state: GameState): void {
  while (state.market.length < 5 && (state.trainDeck.length > 0 || state.discardPile.length > 0)) {
    state.market.push(drawCardFromDeck(state));
  }

  let safety = 0;
  while (state.market.filter((card) => card.color === "locomotive").length >= 3 && state.market.length === 5) {
    state.discardPile.push(...state.market);
    state.market = [];
    while (state.market.length < 5 && (state.trainDeck.length > 0 || state.discardPile.length > 0)) {
      state.market.push(drawCardFromDeck(state));
    }
    safety += 1;
    if (safety > 5) {
      break;
    }
  }
}

function countCards(hand: TrainCard[], color: TrainCardFace): number {
  return hand.filter((card) => card.color === color).length;
}

function canPay(hand: TrainCard[], color: TrainCardColor, totalCost: number, minimumLocomotives = 0): boolean {
  const matching = countCards(hand, color);
  const locomotives = countCards(hand, "locomotive");
  return locomotives >= minimumLocomotives && matching + locomotives >= totalCost;
}

function consumeCards(hand: TrainCard[], color: TrainCardColor, totalCost: number, minimumLocomotives = 0): { hand: TrainCard[]; spent: TrainCardFace[] } {
  const nextHand = [...hand];
  const spent: TrainCardFace[] = [];
  let locomotivesToSpend = minimumLocomotives;

  while (locomotivesToSpend > 0) {
    const index = nextHand.findIndex((card) => card.color === "locomotive");
    invariant(index >= 0, "Not enough locomotives.");
    nextHand.splice(index, 1);
    spent.push("locomotive");
    locomotivesToSpend -= 1;
  }

  let remaining = totalCost - spent.length;
  while (remaining > 0) {
    const matchIndex = nextHand.findIndex((card) => card.color === color);
    if (matchIndex >= 0) {
      nextHand.splice(matchIndex, 1);
      spent.push(color);
      remaining -= 1;
      continue;
    }

    const locoIndex = nextHand.findIndex((card) => card.color === "locomotive");
    invariant(locoIndex >= 0, "Not enough cards to pay.");
    nextHand.splice(locoIndex, 1);
    spent.push("locomotive");
    remaining -= 1;
  }

  return { hand: nextHand, spent };
}

function getPlayer(state: GameState): PlayerState {
  return state.players[state.activePlayerIndex];
}

function getRoute(config: MapConfig, routeId: string): RouteDef {
  const route = config.routes.find((item) => item.id === routeId);
  invariant(route, `Unknown route: ${routeId}`);
  return route;
}

function getAvailableClaimColors(state: GameState, config: MapConfig, playerId: string, routeId: string): TrainCardColor[] {
  const route = getRoute(config, routeId);
  const player = state.players.find((item) => item.id === playerId);
  invariant(player, "Unknown player.");

  if (!isRouteOpen(state, config, route)) {
    return [];
  }

  if (player.trainsLeft < route.length) {
    return [];
  }

  const candidateColors = route.color === "gray" ? [...trainCardColors] : [route.color];
  return candidateColors.filter((color) => canPay(player.hand, color, route.length, route.locomotiveCost ?? 0));
}

function isRouteOpen(state: GameState, config: MapConfig, route: RouteDef): boolean {
  if (state.routeClaims.some((claim) => claim.routeId === route.id)) {
    return false;
  }

  if (route.twinGroup && state.players.length <= 3) {
    const twinIds = config.routes.filter((item) => item.twinGroup === route.twinGroup).map((item) => item.id);
    return !state.routeClaims.some((claim) => twinIds.includes(claim.routeId));
  }

  return true;
}

function hasOpenRoute(state: GameState, config: MapConfig): boolean {
  return config.routes.some((route) => isRouteOpen(state, config, route));
}

function drawTickets(state: GameState, count: number, bucket: "regular" | "long"): TicketDef[] {
  const source = bucket === "long" ? state.longTickets : state.regularTickets;
  const drawn: TicketDef[] = [];
  while (drawn.length < count && source.length > 0) {
    const ticket = source.shift();
    if (ticket) {
      drawn.push(ticket);
    }
  }
  return drawn;
}

function cityLookup(config: MapConfig): Map<string, CityDef> {
  return new Map(config.cities.map((city) => [city.id, city]));
}

function buildAdjacency(routeClaims: RouteClaim[], config: MapConfig): Map<string, Array<{ to: string; routeId: string; length: number }>> {
  const adjacency = new Map<string, Array<{ to: string; routeId: string; length: number }>>();

  const push = (from: string, to: string, routeId: string, length: number) => {
    const entry = adjacency.get(from) ?? [];
    entry.push({ to, routeId, length });
    adjacency.set(from, entry);
  };

  for (const claim of routeClaims) {
    const route = getRoute(config, claim.routeId);
    push(route.from, route.to, route.id, route.length);
    push(route.to, route.from, route.id, route.length);
  }

  return adjacency;
}

function canReach(adjacency: Map<string, Array<{ to: string; routeId: string; length: number }>>, from: string, to: string): boolean {
  if (from === to) {
    return true;
  }

  const queue = [from];
  const visited = new Set<string>([from]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edges = adjacency.get(current) ?? [];
    for (const edge of edges) {
      if (edge.to === to) {
        return true;
      }
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }

  return false;
}

function enumerateStationOptions(playerId: string, stations: StationPlacement[], routeClaims: RouteClaim[], config: MapConfig): RouteClaim[][] {
  const playerStations = stations.filter((station) => station.playerId === playerId);
  const candidateLists = playerStations.map((station) => {
    const edges = routeClaims.filter((claim) => {
      if (claim.playerId === playerId) {
        return false;
      }
      const route = getRoute(config, claim.routeId);
      return route.from === station.cityId || route.to === station.cityId;
    });
    return [null, ...edges];
  });

  const results: RouteClaim[][] = [];

  const visit = (index: number, picked: RouteClaim[]) => {
    if (index >= candidateLists.length) {
      results.push([...picked]);
      return;
    }

    for (const option of candidateLists[index]) {
      if (option) {
        picked.push(option);
      }
      visit(index + 1, picked);
      if (option) {
        picked.pop();
      }
    }
  };

  visit(0, []);
  return results.length > 0 ? results : [[]];
}

function evaluateTickets(player: PlayerState, state: GameState, config: MapConfig): { total: number; completed: string[]; failed: string[] } {
  const ownedRoutes = state.routeClaims.filter((claim) => claim.playerId === player.id);
  const stationOptions = enumerateStationOptions(player.id, state.stations, state.routeClaims, config);
  let bestTotal = Number.NEGATIVE_INFINITY;
  let bestCompleted: string[] = [];
  let bestFailed: string[] = [];

  for (const option of stationOptions) {
    const adjacency = buildAdjacency([...ownedRoutes, ...option], config);
    let total = 0;
    const completed: string[] = [];
    const failed: string[] = [];

    for (const ticket of player.tickets) {
      if (canReach(adjacency, ticket.from, ticket.to)) {
        total += ticket.points;
        completed.push(ticket.id);
      } else {
        total -= ticket.points;
        failed.push(ticket.id);
      }
    }

    if (total > bestTotal) {
      bestTotal = total;
      bestCompleted = completed;
      bestFailed = failed;
    }
  }

  return { total: bestTotal, completed: bestCompleted, failed: bestFailed };
}

export function getTicketProgress(state: GameState, config: MapConfig, playerId: string): Array<{ ticket: TicketDef; completed: boolean }> {
  const player = state.players.find((entry) => entry.id === playerId);
  invariant(player, "Unknown player.");
  const ownedRoutes = state.routeClaims.filter((claim) => claim.playerId === player.id);
  const adjacency = buildAdjacency(ownedRoutes, config);

  return player.tickets.map((ticket) => ({
    ticket,
    completed: canReach(adjacency, ticket.from, ticket.to)
  }));
}

function longestRouteLength(playerId: string, state: GameState, config: MapConfig): number {
  const claims = state.routeClaims.filter((claim) => claim.playerId === playerId);
  const adjacency = buildAdjacency(claims, config);
  const routeLengths = new Map<string, number>();
  for (const claim of claims) {
    const route = getRoute(config, claim.routeId);
    routeLengths.set(route.id, route.length);
  }

  let best = 0;

  const dfs = (cityId: string, usedEdges: Set<string>, totalLength: number): void => {
    best = Math.max(best, totalLength);
    const edges = adjacency.get(cityId) ?? [];
    for (const edge of edges) {
      if (usedEdges.has(edge.routeId)) {
        continue;
      }
      usedEdges.add(edge.routeId);
      dfs(edge.to, usedEdges, totalLength + (routeLengths.get(edge.routeId) ?? 0));
      usedEdges.delete(edge.routeId);
    }
  };

  for (const city of config.cities) {
    dfs(city.id, new Set<string>(), 0);
  }

  return best;
}

function finishGame(state: GameState, config: MapConfig): GameState {
  const nextState = structuredClone(state) as GameState;
  nextState.phase = "gameOver";
  nextState.turn.stage = "idle";
  nextState.turn.summary = "Game over.";

  const longestByPlayer = new Map<string, number>();
  for (const player of nextState.players) {
    longestByPlayer.set(player.id, longestRouteLength(player.id, nextState, config));
  }
  const longestWinningLength = Math.max(...longestByPlayer.values(), 0);

  for (const player of nextState.players) {
    const ticketResult = evaluateTickets(player, nextState, config);
    const stationBonus = player.stationsLeft * config.settings.stationValue;
    const playerLongest = longestByPlayer.get(player.id) ?? 0;
    const longestBonus = playerLongest === longestWinningLength && longestWinningLength > 0 ? config.settings.longestRouteBonus : 0;
    player.score += ticketResult.total + stationBonus + longestBonus;
    player.endgame = {
      ticketDelta: ticketResult.total,
      completedTicketIds: ticketResult.completed,
      failedTicketIds: ticketResult.failed,
      stationBonus,
      longestRouteLength: playerLongest,
      longestRouteBonus: longestBonus
    };
  }

  appendLog(nextState, "Final scoring complete.");
  return nextState;
}

function beginAwaitingHandoff(state: GameState, summary: string): void {
  state.turn.stage = "awaitingHandoff";
  state.turn.drawsTaken = 0;
  state.turn.tookFaceUpLocomotive = false;
  state.turn.summary = summary;
}

function maybeTriggerFinalRound(state: GameState, config: MapConfig, player: PlayerState): void {
  if (state.finalRoundRemaining === null && (player.trainsLeft <= 2 || !hasOpenRoute(state, config))) {
    state.finalRoundRemaining = state.players.length - 1;
    state.finalRoundTriggeredBy = player.id;
    appendLog(state, `${player.name} triggered the final round.`);
  }
}

export function startGame(config: MapConfig, setup: GameSetup): GameState {
  invariant(setup.playerNames.length >= 2 && setup.playerNames.length <= 4, "Hudson Hustle supports 2-4 players.");
  const seed = (setup.seed ?? Date.now()) >>> 0;
  const shuffledTrainDeck = shuffleWithSeed(buildTrainDeck(), seed);
  const longTickets = shuffleWithSeed(
    config.tickets.filter((ticket) => ticket.bucket === "long"),
    shuffledTrainDeck.nextState
  );
  const regularTickets = shuffleWithSeed(
    config.tickets.filter((ticket) => ticket.bucket === "regular"),
    longTickets.nextState
  );

  const state: GameState = {
    version: 1,
    mapId: config.id,
    players: setup.playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      color: playerColors[index],
      hand: [],
      tickets: [],
      pendingTickets: [],
      score: 0,
      trainsLeft: config.settings.trainsPerPlayer,
      stationsLeft: config.settings.stationsPerPlayer
    })),
    activePlayerIndex: 0,
    phase: "initialTickets",
    routeClaims: [],
    stations: [],
    trainDeck: shuffledTrainDeck.value,
    discardPile: [],
    market: [],
    regularTickets: regularTickets.value,
    longTickets: longTickets.value,
    discardedTickets: [],
    turn: {
      stage: "idle",
      drawsTaken: 0,
      tookFaceUpLocomotive: false,
      summary: null,
      latestTunnelReveal: []
    },
    rngState: regularTickets.nextState,
    finalRoundRemaining: null,
    finalRoundTriggeredBy: null,
    log: ["Game setup complete."]
  };

  for (const player of state.players) {
    for (let index = 0; index < 4; index += 1) {
      player.hand.push(drawCardFromDeck(state));
    }
  }

  normalizeMarket(state);

  for (const player of state.players) {
    player.pendingTickets = [...drawTickets(state, 1, "long"), ...drawTickets(state, 3, "regular")];
  }

  return state;
}

export function reduceGame(state: GameState, action: GameAction, config: MapConfig): GameState {
  const nextState = structuredClone(state) as GameState;
  const player = getPlayer(nextState);

  switch (action.type) {
    case "select_initial_tickets": {
      invariant(nextState.phase === "initialTickets", "Initial ticket selection is already complete.");
      invariant(player.pendingTickets.length === 4, "Expected pending initial tickets.");
      invariant(action.keptTicketIds.length >= 2, "Keep at least two tickets.");
      const kept = player.pendingTickets.filter((ticket) => action.keptTicketIds.includes(ticket.id));
      invariant(kept.length === action.keptTicketIds.length, "Unknown ticket selection.");
      player.tickets.push(...kept);
      nextState.discardedTickets.push(...player.pendingTickets.filter((ticket) => !action.keptTicketIds.includes(ticket.id)));
      player.pendingTickets = [];
      appendLog(nextState, `${player.name} locked in starting tickets.`);

      const nextPendingIndex = nextState.players.findIndex((candidate) => candidate.pendingTickets.length > 0);
      if (nextPendingIndex >= 0) {
        nextState.activePlayerIndex = nextPendingIndex;
        nextState.turn.summary = "Starting tickets chosen.";
      } else {
        nextState.phase = "main";
        nextState.activePlayerIndex = 0;
        nextState.turn.summary = "All players are ready.";
      }

      return nextState;
    }
    case "draw_card": {
      invariant(nextState.phase === "main", "You cannot draw cards right now.");
      invariant(nextState.turn.stage === "idle" || nextState.turn.stage === "drawing", "Finish the current turn first.");
      if (action.source === "market") {
        invariant(typeof action.marketIndex === "number", "Market draw requires an index.");
        invariant(action.marketIndex >= 0 && action.marketIndex < nextState.market.length, "Invalid market index.");
        invariant(!(nextState.turn.drawsTaken === 1 && nextState.market[action.marketIndex]?.color === "locomotive"), "You cannot take a face-up locomotive as your second draw.");
      }

      let drawn: TrainCard;
      if (action.source === "deck") {
        drawn = drawCardFromDeck(nextState);
      } else {
        drawn = nextState.market.splice(action.marketIndex!, 1)[0];
        normalizeMarket(nextState);
      }

      player.hand.push(drawn);
      nextState.turn.stage = "drawing";
      nextState.turn.drawsTaken += 1;
      nextState.turn.summary = `${player.name} drew ${drawn.color}.`;

      if (action.source === "market" && drawn.color === "locomotive") {
        nextState.turn.tookFaceUpLocomotive = true;
      }

      if (nextState.turn.tookFaceUpLocomotive || nextState.turn.drawsTaken >= 2) {
        beginAwaitingHandoff(nextState, `${player.name} finished drawing cards.`);
      }

      appendLog(nextState, `${player.name} drew a ${drawn.color} card.`);
      return nextState;
    }
    case "claim_route": {
      invariant(nextState.phase === "main", "You cannot claim routes right now.");
      invariant(nextState.turn.stage === "idle", "Claiming a route uses your full turn.");
      const route = getRoute(config, action.routeId);
      invariant(!nextState.routeClaims.some((claim) => claim.routeId === route.id), "This route is already claimed.");

      if (route.twinGroup && nextState.players.length <= 3) {
        const twinIds = config.routes.filter((item) => item.twinGroup === route.twinGroup).map((item) => item.id);
        invariant(!nextState.routeClaims.some((claim) => twinIds.includes(claim.routeId)), "Only one of these parallel routes is available in a 2-3 player game.");
      }

      const expectedColor = route.color === "gray" ? action.color : route.color;
      invariant(expectedColor === action.color, "This route requires a different color.");
      invariant(player.trainsLeft >= route.length, "You do not have enough trains left for that route.");
      invariant(canPay(player.hand, action.color, route.length, route.locomotiveCost ?? 0), "You cannot afford that route.");

      let tunnelExtraCost = 0;
      const tunnelReveal: TrainCardFace[] = [];
      if (route.type === "tunnel") {
        for (let index = 0; index < 3; index += 1) {
          const card = drawCardFromDeck(nextState);
          nextState.discardPile.push(card);
          tunnelReveal.push(card.color);
          if (card.color === action.color || card.color === "locomotive") {
            tunnelExtraCost += 1;
          }
        }
        nextState.turn.latestTunnelReveal = tunnelReveal;
        if (!canPay(player.hand, action.color, route.length + tunnelExtraCost, route.locomotiveCost ?? 0)) {
          beginAwaitingHandoff(nextState, `${player.name} could not cover the tunnel surcharge.`);
          appendLog(nextState, `${player.name} failed to claim ${route.id} after a tunnel reveal.`);
          return nextState;
        }
      } else {
        nextState.turn.latestTunnelReveal = [];
      }

      const payment = consumeCards(player.hand, action.color, route.length + tunnelExtraCost, route.locomotiveCost ?? 0);
      player.hand = payment.hand;
      player.score += routeScoreTable[route.length] ?? route.length * 2;
      player.trainsLeft -= route.length;
      nextState.discardPile.push(
        ...payment.spent.map((color, index) => ({
          id: `spent-${route.id}-${index}-${nextState.log.length}`,
          color
        }))
      );
      nextState.routeClaims.push({
        routeId: route.id,
        playerId: player.id,
        colorUsed: action.color,
        cardsSpent: payment.spent,
        tunnelExtraCost
      });
      maybeTriggerFinalRound(nextState, config, player);
      beginAwaitingHandoff(nextState, `${player.name} claimed ${route.id}.`);
      appendLog(nextState, `${player.name} claimed ${route.id} for ${routeScoreTable[route.length] ?? route.length * 2} points.`);
      return nextState;
    }
    case "draw_tickets": {
      invariant(nextState.phase === "main", "You cannot draw tickets right now.");
      invariant(nextState.turn.stage === "idle", "Finish the current turn first.");
      player.pendingTickets = drawTickets(nextState, 3, "regular");
      invariant(player.pendingTickets.length > 0, "No tickets left to draw.");
      nextState.phase = "ticketChoice";
      nextState.turn.summary = `${player.name} is choosing tickets.`;
      appendLog(nextState, `${player.name} drew ${player.pendingTickets.length} tickets.`);
      return nextState;
    }
    case "cancel_ticket_draw": {
      invariant(nextState.phase === "ticketChoice", "There is no ticket draw to cancel.");
      invariant(player.pendingTickets.length > 0, "There are no pending tickets to return.");
      nextState.regularTickets = [...player.pendingTickets, ...nextState.regularTickets];
      player.pendingTickets = [];
      nextState.phase = "main";
      nextState.turn.summary = null;
      appendLog(nextState, `${player.name} put back newly drawn tickets.`);
      return nextState;
    }
    case "keep_drawn_tickets": {
      invariant(nextState.phase === "ticketChoice", "There are no pending ticket choices.");
      invariant(action.keptTicketIds.length >= 1, "Keep at least one ticket.");
      const kept = player.pendingTickets.filter((ticket) => action.keptTicketIds.includes(ticket.id));
      invariant(kept.length === action.keptTicketIds.length, "Unknown ticket selection.");
      player.tickets.push(...kept);
      nextState.discardedTickets.push(...player.pendingTickets.filter((ticket) => !action.keptTicketIds.includes(ticket.id)));
      player.pendingTickets = [];
      nextState.phase = "main";
      beginAwaitingHandoff(nextState, `${player.name} kept ${kept.length} new tickets.`);
      return nextState;
    }
    case "build_station": {
      invariant(nextState.phase === "main", "You cannot build a station right now.");
      invariant(nextState.turn.stage === "idle", "Building a station uses your full turn.");
      invariant(player.stationsLeft > 0, "No stations left.");
      invariant(!nextState.stations.some((station) => station.cityId === action.cityId), "A station already exists in that city.");
      invariant(config.cities.some((city) => city.id === action.cityId), "Unknown city.");

      const cost = config.settings.stationsPerPlayer - player.stationsLeft + 1;
      invariant(canPay(player.hand, action.color, cost, 0), "You cannot afford that station.");
      const payment = consumeCards(player.hand, action.color, cost, 0);
      player.hand = payment.hand;
      player.stationsLeft -= 1;
      nextState.discardPile.push(
        ...payment.spent.map((color, index) => ({
          id: `station-${action.cityId}-${index}-${nextState.log.length}`,
          color
        }))
      );
      nextState.stations.push({
        cityId: action.cityId,
        playerId: player.id
      });
      beginAwaitingHandoff(nextState, `${player.name} built a station in ${action.cityId}.`);
      appendLog(nextState, `${player.name} built a station in ${action.cityId}.`);
      return nextState;
    }
    case "advance_turn": {
      invariant(nextState.turn.stage === "awaitingHandoff", "The current turn is not ready to advance.");
      nextState.turn.latestTunnelReveal = [];

      if (nextState.finalRoundRemaining === 0) {
        return finishGame(nextState, config);
      }

      nextState.activePlayerIndex = (nextState.activePlayerIndex + 1) % nextState.players.length;
      nextState.turn = {
        stage: "idle",
        drawsTaken: 0,
        tookFaceUpLocomotive: false,
        summary: null,
        latestTunnelReveal: []
      };

      if (nextState.finalRoundRemaining !== null && nextState.finalRoundRemaining > 0) {
        nextState.finalRoundRemaining -= 1;
      }

      appendLog(nextState, `${nextState.players[nextState.activePlayerIndex].name}'s turn started.`);
      return nextState;
    }
  }
}

export function getAffordableRouteColors(state: GameState, config: MapConfig, routeId: string): TrainCardColor[] {
  return getAvailableClaimColors(state, config, getPlayer(state).id, routeId);
}

export function getAffordableStationColors(state: GameState, config: MapConfig): TrainCardColor[] {
  const player = getPlayer(state);
  const cost = config.settings.stationsPerPlayer - player.stationsLeft + 1;
  return trainCardColors.filter((color) => canPay(player.hand, color, cost, 0));
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return getPlayer(state);
}

export function getCityName(config: MapConfig, cityId: string): string {
  return cityLookup(config).get(cityId)?.name ?? cityId;
}

export function summarizeEndgame(player: PlayerState, config: MapConfig): string[] {
  if (!player.endgame) {
    return [];
  }

  const ticketById = new Map(config.tickets.map((ticket) => [ticket.id, ticket]));
  return [
    `Ticket delta: ${player.endgame.ticketDelta >= 0 ? "+" : ""}${player.endgame.ticketDelta}`,
    `Unused stations: +${player.endgame.stationBonus}`,
    `Longest route: ${player.endgame.longestRouteLength} trains`,
    `Longest route bonus: +${player.endgame.longestRouteBonus}`,
    `Completed tickets: ${player.endgame.completedTicketIds.map((id) => ticketById.get(id)?.id ?? id).join(", ") || "none"}`,
    `Failed tickets: ${player.endgame.failedTicketIds.map((id) => ticketById.get(id)?.id ?? id).join(", ") || "none"}`
  ];
}
