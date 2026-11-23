import type { GameState, MapConfig } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const PHASES = ["initialTickets", "main", "ticketChoice", "gameOver"];

/**
 * Turns something read back from storage into a game state, or null if it is not one this build can
 * continue. Storage is the one place a game state arrives untyped, so this is where its shape is
 * checked and where fields that older saves lack are filled in, once, for everything downstream.
 */
export function restoreGameState(input: unknown): GameState | null {
  if (!isRecord(input) || input.version !== 1 || typeof input.mapId !== "string" || !PHASES.includes(input.phase as string)) {
    return null;
  }
  const { players, activePlayerIndex, turn, log } = input;
  const lists = [input.routeClaims, input.stations, input.trainDeck, input.discardPile, input.market, input.regularTickets, input.longTickets, log];
  if (!Array.isArray(players) || players.length < 2 || lists.some((list) => !Array.isArray(list))) {
    return null;
  }
  if (typeof activePlayerIndex !== "number" || !players[activePlayerIndex] || !isRecord(turn) || typeof turn.stage !== "string") {
    return null;
  }
  const playersOk = players.every(
    (player) =>
      isRecord(player) &&
      typeof player.id === "string" &&
      typeof player.name === "string" &&
      Array.isArray(player.hand) &&
      Array.isArray(player.tickets) &&
      Array.isArray(player.pendingTickets) &&
      typeof player.trainsLeft === "number" &&
      typeof player.stationsLeft === "number"
  );
  if (!playersOk) {
    return null;
  }

  const state = input as unknown as GameState;
  return {
    ...state,
    // Saves from before the running log count and the event list existed.
    logSequence: typeof input.logSequence === "number" ? input.logSequence : state.log.length,
    events: Array.isArray(input.events) ? state.events : []
  };
}

/** Whether every route and station a game refers to exists on a map, so the board can draw it. */
export function gameFitsMap(game: GameState, config: MapConfig): boolean {
  return (
    game.mapId === config.id &&
    game.routeClaims.every((claim) => config.routes.some((route) => route.id === claim.routeId)) &&
    game.stations.every((station) => config.cities.some((city) => city.id === station.cityId))
  );
}
