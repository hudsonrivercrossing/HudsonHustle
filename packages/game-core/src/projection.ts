import { chooseBotAction, type BotDifficulty } from "./bot-policy.js";
import { getCurrentPlayer, reduceGame } from "./game.js";
import type { PublicGameState, SeatPrivateState } from "./multiplayer.js";
import type { GameAction, GameState, MapConfig, TicketDef, TrainCard } from "./types.js";

/** What every player at the table may see. */
export function toPublicGameState(game: GameState): PublicGameState {
  return {
    version: game.version,
    mapId: game.mapId,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      trainsLeft: player.trainsLeft,
      stationsLeft: player.stationsLeft,
      handCount: player.hand.length,
      ticketCount: player.tickets.length,
      pendingTicketCount: player.pendingTickets.length,
      endgame: player.endgame
    })),
    activePlayerIndex: game.activePlayerIndex,
    phase: game.phase,
    routeClaims: game.routeClaims,
    stations: game.stations,
    market: game.market,
    discardCount: game.discardPile.length,
    trainDeckCount: game.trainDeck.length,
    regularTicketsCount: game.regularTickets.length,
    longTicketsCount: game.longTickets.length,
    discardedTicketsCount: game.discardedTickets.length,
    turn: game.turn,
    finalRoundRemaining: game.finalRoundRemaining,
    finalRoundTriggeredBy: game.finalRoundTriggeredBy,
    log: game.log,
    logSequence: game.logSequence,
    events: game.events,
    moves: game.moves
  };
}

/** What only the player in `seatId` may see. */
export function toPrivateState(game: GameState, playerId: string, seatId: string): SeatPrivateState | null {
  const player = game.players.find((entry) => entry.id === playerId);
  if (!player) {
    return null;
  }
  return {
    seatId,
    playerId,
    hand: player.hand,
    tickets: player.tickets,
    pendingTickets: player.pendingTickets
  };
}

function hiddenCards(owner: string, count: number): TrainCard[] {
  return Array.from({ length: count }, (_, index) => ({ id: `hidden-${owner}-${index}`, color: "locomotive" as const }));
}

function hiddenTickets(playerId: string, count: number): TicketDef[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `hidden-ticket-${playerId}-${index}`,
    from: "hidden",
    to: "hidden",
    points: 0,
    bucket: "regular"
  }));
}

/**
 * Rebuilds a GameState from one player's view so the same selectors work for an online seat.
 * Everything the viewer may not see (other hands and tickets, the decks) becomes placeholders with the right counts.
 */
export function fromPlayerView(game: PublicGameState, privateState: SeatPrivateState | null): GameState {
  return {
    version: game.version,
    mapId: game.mapId,
    players: game.players.map((player) => {
      const isViewer = privateState?.playerId === player.id;
      return {
        id: player.id,
        name: player.name,
        color: player.color,
        hand: isViewer ? privateState.hand : hiddenCards(`hand-${player.id}`, player.handCount),
        tickets: isViewer ? privateState.tickets : hiddenTickets(player.id, player.ticketCount),
        pendingTickets: isViewer ? privateState.pendingTickets : hiddenTickets(player.id, player.pendingTicketCount),
        score: player.score,
        trainsLeft: player.trainsLeft,
        stationsLeft: player.stationsLeft,
        endgame: player.endgame
      };
    }),
    activePlayerIndex: game.activePlayerIndex,
    phase: game.phase,
    routeClaims: game.routeClaims,
    stations: game.stations,
    trainDeck: hiddenCards("deck", game.trainDeckCount),
    discardPile: hiddenCards("discard", game.discardCount),
    market: game.market,
    regularTickets: [],
    longTickets: [],
    discardedTickets: [],
    turn: game.turn,
    rngState: 0,
    finalRoundRemaining: game.finalRoundRemaining,
    finalRoundTriggeredBy: game.finalRoundTriggeredBy,
    log: game.log,
    logSequence: game.logSequence,
    events: game.events,
    moves: game.moves
  };
}

/** The bot's move for the active player, decided from that player's view only. */
export function chooseBotActionForActivePlayer(game: GameState, config: MapConfig, difficulty: BotDifficulty = "standard"): GameAction {
  const player = getCurrentPlayer(game);
  const privateState = toPrivateState(game, player.id, `seat-${game.activePlayerIndex + 1}`);
  if (!privateState) {
    throw new Error("Active player is missing from the game.");
  }
  return chooseBotAction({ config, game: toPublicGameState(game), privateState, difficulty });
}

/**
 * Plays consecutive bot turns, ending each one, until a human is active, the game ends,
 * or `maxSteps` actions were taken. `difficultyOf` says which tier plays each bot seat.
 */
export function runBotTurns(
  game: GameState,
  config: MapConfig,
  isBot: (playerId: string) => boolean,
  maxSteps = 8,
  difficultyOf: (playerId: string) => BotDifficulty = () => "standard"
): { state: GameState; actions: GameAction[] } {
  let state = game;
  const actions: GameAction[] = [];
  while (actions.length < maxSteps && state.phase !== "gameOver" && isBot(getCurrentPlayer(state).id)) {
    const action = chooseBotActionForActivePlayer(state, config, difficultyOf(getCurrentPlayer(state).id));
    state = reduceGame(state, action, config);
    if (state.turn.stage === "awaitingHandoff") {
      state = reduceGame(state, { type: "advance_turn" }, config);
    }
    actions.push(action);
  }
  return { state, actions };
}
