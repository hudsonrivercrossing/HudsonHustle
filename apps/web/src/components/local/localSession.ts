import {
  gameFitsMap,
  getCurrentPlayer,
  reduceGame,
  restoreGameState,
  runBotTurns,
  startGame,
  type BotDifficulty,
  type GameAction,
  type GameState
} from "@hudson-hustle/game-core";
import { getHudsonHustleMapByConfigId } from "@hudson-hustle/game-data";
import { storageGet, storageRemove, storageSet } from "../shared/safeStorage";
import { botPlayerIdsFromSavedGame, botPlayerIdsFromSeatIds, configIdForSavedMap, LOCAL_SAVE_KEY, type LocalStartSetup, type VisibilityMode } from "./localGame.utils";
import { readLocalSaveMeta, saveLocalSaveMeta } from "./localSetupStorage";

/**
 * One pass-and-play game and everything that goes with it: which map, which seats are bots, the turn
 * timer, and whether the screen is showing a hand or waiting for the next player to take the laptop.
 * Every change returns a new session; nothing here touches React.
 */
export interface LocalSession {
  game: GameState;
  configId: string;
  botPlayerIds: string[];
  botDifficulty: BotDifficulty;
  turnTimeLimitSeconds: number;
  /** "handoff" covers private cards until the next player says they are ready. */
  visibility: VisibilityMode;
  /** What the last player did, shown to the next one at the handover. */
  previousTurnSummary: string | null;
}

function mapFor(session: Pick<LocalSession, "configId">) {
  return getHudsonHustleMapByConfigId(session.configId);
}

/** A screen showing a finished game hides nothing; otherwise a change of player needs a handover. */
function visibilityAfter(game: GameState): VisibilityMode {
  return game.phase === "gameOver" ? "visible" : "handoff";
}

export function isBotTurn(session: LocalSession): boolean {
  return session.game.phase !== "gameOver" && session.botPlayerIds.includes(getCurrentPlayer(session.game).id);
}

export function startSession(setup: LocalStartSetup): LocalSession {
  return {
    game: startGame(getHudsonHustleMapByConfigId(setup.configId), { playerNames: setup.playerNames }),
    configId: setup.configId,
    botPlayerIds: botPlayerIdsFromSeatIds(setup.botSeatIds),
    botDifficulty: setup.botDifficulty,
    turnTimeLimitSeconds: setup.turnTimeLimitSeconds,
    visibility: "visible",
    previousTurnSummary: null
  };
}

/** A new game for the same table: same players, bots, map and timer. */
export function rematchSession(session: LocalSession): LocalSession {
  return {
    ...session,
    game: startGame(mapFor(session), { playerNames: session.game.players.map((player) => player.name) }),
    visibility: "visible",
    previousTurnSummary: null
  };
}

/** Applies a player's action. Throws, as the rules do, when the action is not allowed. */
export function actInSession(session: LocalSession, action: GameAction): LocalSession {
  const game = reduceGame(session.game, action, mapFor(session));
  if (game.phase === "gameOver") {
    return { ...session, game, visibility: "visible" };
  }
  // Choosing starting tickets passes straight to the next player, whose tickets are now on screen.
  // After any other action the same player stays in front of the screen and ends the turn themselves.
  if (action.type === "select_initial_tickets") {
    return { ...session, game, visibility: "handoff", previousTurnSummary: null };
  }
  return { ...session, game };
}

/** Ends the finished turn and covers private cards for the handover. */
export function passLaptop(session: LocalSession): LocalSession {
  const game = reduceGame(session.game, { type: "advance_turn" }, mapFor(session));
  return { ...session, game, visibility: visibilityAfter(game), previousTurnSummary: session.game.turn.summary };
}

/** Plays every bot turn that is due, stopping at the next human or the end of the game. */
export function playBotTurns(session: LocalSession): LocalSession {
  const { state: game } = runBotTurns(
    session.game,
    mapFor(session),
    (playerId) => session.botPlayerIds.includes(playerId),
    undefined,
    () => session.botDifficulty
  );
  return { ...session, game, visibility: visibilityAfter(game), previousTurnSummary: `${getCurrentPlayer(session.game).name} (bot) played.` };
}

export function showHand(session: LocalSession): LocalSession {
  return { ...session, visibility: "visible" };
}

// ---------------------------------------------------------------------------------------------
// Saving. The game and its settings are two records for historical reasons; they are always
// written and cleared together here, so they cannot drift apart.

export function saveSession(session: LocalSession): void {
  storageSet(LOCAL_SAVE_KEY, JSON.stringify(session.game));
  saveLocalSaveMeta({
    configId: session.configId,
    botPlayerIds: session.botPlayerIds,
    botDifficulty: session.botDifficulty,
    turnTimeLimitSeconds: session.turnTimeLimitSeconds
  });
}

export function clearSavedSession(): void {
  storageRemove(LOCAL_SAVE_KEY);
  saveLocalSaveMeta(null);
}

/**
 * The saved game, ready to continue, or null. A save this build cannot continue (another save
 * version, a broken record, a map it no longer has) is thrown away so it cannot fail again.
 */
export function readSavedSession(): LocalSession | null {
  const raw = storageGet(LOCAL_SAVE_KEY);
  if (!raw) {
    return null;
  }
  const session = sessionFromStored(raw);
  if (!session) {
    clearSavedSession();
  }
  return session;
}

function sessionFromStored(raw: string): LocalSession | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const game = restoreGameState(parsed);
  if (!game) {
    return null;
  }
  // Saves made before the settings record existed fall back to guessing from the map and the names.
  const meta = readLocalSaveMeta();
  const configId = meta?.configId ?? configIdForSavedMap(game.mapId);
  if (!mapExists(configId) || !gameFitsMap(game, getHudsonHustleMapByConfigId(configId))) {
    return null;
  }
  return {
    game,
    configId,
    botPlayerIds: meta?.botPlayerIds ?? botPlayerIdsFromSavedGame(game),
    botDifficulty: meta?.botDifficulty ?? "standard",
    turnTimeLimitSeconds: meta?.turnTimeLimitSeconds ?? 0,
    // Whoever reopens the laptop may not be the player whose hand was last on screen.
    visibility: visibilityAfter(game),
    previousTurnSummary: null
  };
}

function mapExists(configId: string): boolean {
  try {
    getHudsonHustleMapByConfigId(configId);
    return true;
  } catch {
    return false;
  }
}
