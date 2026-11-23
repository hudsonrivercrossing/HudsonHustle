import { parseGameAction } from "./actions.js";
import { shuffleWithSeed } from "./random.js";
import { canPay, canTakeMarketCard, isRouteOpen, longestPath, paymentSpend, routePoints, scoreTickets, stationCost } from "./rules.js";
import {
  type CityDef,
  type GameAction,
  type GameEvent,
  type GameEventInput,
  type GameMove,
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

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const VISIBLE_LOG_LENGTH = 18;

function appendLog(state: GameState, message: string): void {
  state.logSequence = (state.logSequence ?? state.log.length) + 1;
  state.log = [...state.log, message].slice(-VISIBLE_LOG_LENGTH);
}

const RECENT_EVENT_LIMIT = 32;

function recordEvent(state: GameState, event: GameEventInput): void {
  const events = state.events ?? [];
  const seq = (events.at(-1)?.seq ?? 0) + 1;
  state.events = [...events, { ...event, seq } as GameEvent].slice(-RECENT_EVENT_LIMIT);
  // A game saved before moves were recorded has no list to extend; replay falls back to the final board.
  if (state.moves && isMove(event)) {
    state.moves = [...state.moves, event];
  }
}

function isMove(event: GameEventInput): event is GameMove {
  return (
    event.type === "route_claimed" ||
    event.type === "station_built" ||
    event.type === "tickets_kept" ||
    event.type === "card_drawn" ||
    event.type === "tunnel_failed"
  );
}

/** Events with a sequence number above `lastSeenSeq`, oldest first. */
export function getEventsSince(game: { events?: GameEvent[] }, lastSeenSeq: number): GameEvent[] {
  return (game.events ?? []).filter((event) => event.seq > lastSeenSeq);
}

/**
 * Log entries appended after `lastSeenSequence`. Comparing `log.length` cannot do this:
 * the log is trimmed, so its length stops growing once it is full.
 */
export function getLogEntriesSince(game: { log: string[]; logSequence?: number }, lastSeenSequence: number): string[] {
  const added = (game.logSequence ?? game.log.length) - lastSeenSequence;
  return added > 0 ? game.log.slice(-Math.min(added, game.log.length)) : [];
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

function consumeCards(hand: TrainCard[], color: TrainCardColor, totalCost: number, minimumLocomotives = 0): { hand: TrainCard[]; spent: TrainCardFace[] } {
  const colored = hand.filter((card) => card.color === color).length;
  const locomotives = hand.filter((card) => card.color === "locomotive").length;
  const spend = paymentSpend(colored, locomotives, totalCost, minimumLocomotives);
  invariant(spend, "Not enough cards to pay.");

  const nextHand = [...hand];
  const take = (face: TrainCardFace, count: number) => {
    for (let taken = 0; taken < count; taken += 1) {
      nextHand.splice(nextHand.findIndex((card) => card.color === face), 1);
    }
    return Array.from({ length: count }, () => face);
  };
  // Required locomotives first, then the colour, then locomotives for the rest: the order they reach the discard pile.
  const spent = [...take("locomotive", minimumLocomotives), ...take(color, spend.colored), ...take("locomotive", spend.locomotives - minimumLocomotives)];
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

  if (!isRouteOpen(route, state.routeClaims, state.players.length, config)) {
    return [];
  }

  if (player.trainsLeft < route.length) {
    return [];
  }

  const candidateColors = route.color === "gray" ? [...trainCardColors] : [route.color];
  return candidateColors.filter((color) => canPay(player.hand, color, route.length, route.locomotiveCost ?? 0));
}

/** Whether the active player can do anything at all at the start of their turn. */
function hasLegalAction(state: GameState, config: MapConfig): boolean {
  const player = getPlayer(state);
  if (state.trainDeck.length + state.discardPile.length + state.market.length > 0 || state.regularTickets.length > 0) {
    return true;
  }
  const cost = stationCost(config.settings.stationsPerPlayer, player.stationsLeft);
  const canBuildStation =
    player.stationsLeft > 0 &&
    state.stations.length < config.cities.length &&
    trainCardColors.some((color) => canPay(player.hand, color, cost, 0));
  return canBuildStation || config.routes.some((route) => getAvailableClaimColors(state, config, player.id, route.id).length > 0);
}

function hasOpenRoute(state: GameState, config: MapConfig): boolean {
  return config.routes.some((route) => isRouteOpen(route, state.routeClaims, state.players.length, config));
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

function evaluateTickets(player: PlayerState, state: GameState, config: MapConfig): { total: number; completed: string[]; failed: string[] } {
  const { total, completedIds } = scoreTickets(config, state.routeClaims, state.stations, player.id, player.tickets);
  return {
    total,
    completed: player.tickets.filter((ticket) => completedIds.has(ticket.id)).map((ticket) => ticket.id),
    failed: player.tickets.filter((ticket) => !completedIds.has(ticket.id)).map((ticket) => ticket.id)
  };
}

/** Which of a player's tickets count as connected right now, by the same rule the final scoring uses:
 * their own routes, plus one rival route borrowed through each station they have built. */
export function getTicketProgress(state: GameState, config: MapConfig, playerId: string): Array<{ ticket: TicketDef; completed: boolean }> {
  const player = state.players.find((entry) => entry.id === playerId);
  invariant(player, "Unknown player.");
  const completed = new Set(evaluateTickets(player, state, config).completed);

  return player.tickets.map((ticket) => ({ ticket, completed: completed.has(ticket.id) }));
}

function finishGame(state: GameState, config: MapConfig): GameState {
  const nextState = structuredClone(state) as GameState;
  nextState.phase = "gameOver";
  nextState.turn.stage = "idle";
  nextState.turn.summary = "Game over.";

  const longestByPlayer = new Map<string, number>();
  for (const player of nextState.players) {
    longestByPlayer.set(player.id, longestPath(config, nextState.routeClaims, player.id));
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
  recordEvent(nextState, { type: "game_over" });
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
    recordEvent(state, { type: "final_round_triggered", playerId: player.id });
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
    log: ["Game setup complete."],
    logSequence: 1,
    events: [],
    moves: []
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

export function reduceGame(state: GameState, untrustedAction: GameAction, config: MapConfig): GameState {
  const action = parseGameAction(untrustedAction);
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
      recordEvent(nextState, { type: "tickets_kept", playerId: player.id, count: kept.length, initial: true });

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
        invariant(canTakeMarketCard(nextState.turn, nextState.market[action.marketIndex]), "You cannot take a face-up locomotive as your second draw.");
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
      // Log, summary and event are all readable by every player, so a blind draw never names its color.
      const drawDescription =
        action.source === "market" ? `${player.name} took a face-up ${drawn.color} card.` : `${player.name} drew a card from the deck.`;
      nextState.turn.summary = drawDescription;

      if (action.source === "market" && drawn.color === "locomotive") {
        nextState.turn.tookFaceUpLocomotive = true;
      }

      // When players hold nearly every card there may be nothing left for a second draw.
      // The draw then ends after one card instead of leaving the turn impossible to finish.
      const secondCardExists =
        nextState.trainDeck.length + nextState.discardPile.length > 0 || nextState.market.some((card) => card.color !== "locomotive");
      if (nextState.turn.tookFaceUpLocomotive || nextState.turn.drawsTaken >= 2 || !secondCardExists) {
        beginAwaitingHandoff(nextState, `${player.name} finished drawing cards.`);
      }

      appendLog(nextState, drawDescription);
      recordEvent(
        nextState,
        action.source === "market"
          ? { type: "card_drawn", playerId: player.id, source: "market", color: drawn.color }
          : { type: "card_drawn", playerId: player.id, source: "deck" }
      );
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
        // Late in a game the deck and discard pile can both be empty because players hold the cards.
        // Then fewer than three are revealed (possibly none) and only those can add to the cost.
        // Revealed cards reach the discard pile only after the reveal, so a reshuffle during it
        // cannot turn the same card over twice.
        const revealedCards: TrainCard[] = [];
        for (let index = 0; index < 3 && nextState.trainDeck.length + nextState.discardPile.length > 0; index += 1) {
          const card = drawCardFromDeck(nextState);
          revealedCards.push(card);
          tunnelReveal.push(card.color);
          if (card.color === action.color || card.color === "locomotive") {
            tunnelExtraCost += 1;
          }
        }
        nextState.discardPile.push(...revealedCards);
        nextState.turn.latestTunnelReveal = tunnelReveal;
        if (!canPay(player.hand, action.color, route.length + tunnelExtraCost, route.locomotiveCost ?? 0)) {
          beginAwaitingHandoff(nextState, `${player.name} could not cover the tunnel surcharge.`);
          appendLog(nextState, `${player.name} failed to claim ${route.id} after a tunnel reveal.`);
          recordEvent(nextState, { type: "tunnel_failed", playerId: player.id, routeId: route.id, tunnel: { cards: tunnelReveal, extraCost: tunnelExtraCost } });
          return nextState;
        }
      } else {
        nextState.turn.latestTunnelReveal = [];
      }

      const payment = consumeCards(player.hand, action.color, route.length + tunnelExtraCost, route.locomotiveCost ?? 0);
      player.hand = payment.hand;
      player.score += routePoints(route.length);
      player.trainsLeft -= route.length;
      nextState.discardPile.push(
        ...payment.spent.map((color, index) => ({
          id: `spent-${route.id}-${index}-${nextState.logSequence ?? nextState.log.length}`,
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
      beginAwaitingHandoff(nextState, `${player.name} claimed ${getCityName(config, route.from)} → ${getCityName(config, route.to)}.`);
      appendLog(nextState, `${player.name} claimed ${route.id} for ${routePoints(route.length)} points.`);
      recordEvent(nextState, {
        type: "route_claimed",
        playerId: player.id,
        routeId: route.id,
        points: routePoints(route.length),
        ...(route.type === "tunnel" ? { tunnel: { cards: tunnelReveal, extraCost: tunnelExtraCost } } : {})
      });
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
      recordEvent(nextState, { type: "tickets_drawn", playerId: player.id, count: player.pendingTickets.length });
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
      recordEvent(nextState, { type: "tickets_kept", playerId: player.id, count: kept.length, initial: false });
      return nextState;
    }
    case "build_station": {
      invariant(nextState.phase === "main", "You cannot build a station right now.");
      invariant(nextState.turn.stage === "idle", "Building a station uses your full turn.");
      invariant(player.stationsLeft > 0, "No stations left.");
      invariant(!nextState.stations.some((station) => station.cityId === action.cityId), "A station already exists in that city.");
      invariant(config.cities.some((city) => city.id === action.cityId), "Unknown city.");

      const cost = stationCost(config.settings.stationsPerPlayer, player.stationsLeft);
      invariant(canPay(player.hand, action.color, cost, 0), "You cannot afford that station.");
      const payment = consumeCards(player.hand, action.color, cost, 0);
      player.hand = payment.hand;
      player.stationsLeft -= 1;
      nextState.discardPile.push(
        ...payment.spent.map((color, index) => ({
          id: `station-${action.cityId}-${index}-${nextState.logSequence ?? nextState.log.length}`,
          color
        }))
      );
      nextState.stations.push({
        cityId: action.cityId,
        playerId: player.id
      });
      beginAwaitingHandoff(nextState, `${player.name} built a station in ${getCityName(config, action.cityId)}.`);
      appendLog(nextState, `${player.name} built a station in ${action.cityId}.`);
      recordEvent(nextState, { type: "station_built", playerId: player.id, cityId: action.cityId });
      return nextState;
    }
    case "advance_turn": {
      invariant(nextState.turn.stage === "awaitingHandoff", "The current turn is not ready to advance.");
      nextState.turn.latestTunnelReveal = [];

      // Normally this runs once. It repeats only to pass over players who cannot do anything at all,
      // which happens when nearly every card is in hands; if that is everyone, the game is over.
      for (let passed = 0; ; passed += 1) {
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

        if (hasLegalAction(nextState, config)) {
          break;
        }
        if (passed + 1 >= nextState.players.length) {
          appendLog(nextState, "No player has a legal move left.");
          return finishGame(nextState, config);
        }
        appendLog(nextState, `${nextState.players[nextState.activePlayerIndex].name} has no legal move and passes.`);
      }

      appendLog(nextState, `${nextState.players[nextState.activePlayerIndex].name}'s turn started.`);
      recordEvent(nextState, { type: "turn_started", playerId: nextState.players[nextState.activePlayerIndex].id });
      return nextState;
    }
  }
}

export function getAffordableRouteColors(state: GameState, config: MapConfig, routeId: string): TrainCardColor[] {
  return getAvailableClaimColors(state, config, getPlayer(state).id, routeId);
}

export function getAffordableStationColors(state: GameState, config: MapConfig): TrainCardColor[] {
  const player = getPlayer(state);
  const cost = stationCost(config.settings.stationsPerPlayer, player.stationsLeft);
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
