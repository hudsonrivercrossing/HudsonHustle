import { type BotDifficulty, type GameState } from "@hudson-hustle/game-core";
import {
  hudsonHustleCurrentConfigId,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId
} from "@hudson-hustle/game-data";
import { storageGet, storageRemove } from "../shared/safeStorage";

export const AVATAR_NAMES = [
  "Conductor", "Milo", "Engineer", "Rosa", "Switchman",
  "Jack", "Dispatcher", "Lily", "Caboose", "Nellie"
];

export const LOCAL_SAVE_KEY = "hudson-hustle-save-v1";

export type VisibilityMode = "visible" | "handoff";
export type LocalStartSetup = {
  playerNames: string[];
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
  configId: string;
  turnTimeLimitSeconds: number;
};

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function shuffleAvatars(seed: string, count: number): string[] {
  const rng = seededRandom(seed);
  const pool = [...AVATAR_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether a stored value is a game this build can resume: the current save version, the fields the table
 * reads on its first render, and only routes and stations that exist on a map this build still ships.
 */
export function isRestorableGame(value: unknown): value is GameState {
  if (!isRecord(value) || value.version !== 1 || typeof value.mapId !== "string" || typeof value.phase !== "string") {
    return false;
  }
  const { players, routeClaims, stations, market, activePlayerIndex } = value;
  if (!Array.isArray(players) || players.length < 2 || !Array.isArray(routeClaims) || !Array.isArray(stations) || !Array.isArray(market)) {
    return false;
  }
  if (typeof activePlayerIndex !== "number" || !players[activePlayerIndex]) {
    return false;
  }
  const playersOk = players.every(
    (player) => isRecord(player) && typeof player.id === "string" && typeof player.name === "string" && Array.isArray(player.hand) && Array.isArray(player.tickets)
  );
  if (!playersOk) {
    return false;
  }
  const maps = hudsonHustleReleasedConfigs
    .map((config) => getHudsonHustleMapByConfigId(config.configId))
    .filter((map) => map.id === value.mapId);
  return maps.some(
    (map) =>
      routeClaims.every((claim) => isRecord(claim) && map.routes.some((route) => route.id === claim.routeId)) &&
      stations.every((station) => isRecord(station) && map.cities.some((city) => city.id === station.cityId))
  );
}

/** The saved local game, or null. A save this build cannot resume is thrown away so it cannot fail again. */
export function readSavedGame(): GameState | null {
  const raw = storageGet(LOCAL_SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRestorableGame(parsed)) {
      return parsed;
    }
  } catch {
    // Falls through to discarding the save.
  }
  storageRemove(LOCAL_SAVE_KEY);
  return null;
}

export function configIdForSavedMap(mapId: string): string {
  return (
    hudsonHustleReleasedConfigs.find(
      (config) => getHudsonHustleMapByConfigId(config.configId).id === mapId
    )?.configId ?? hudsonHustleCurrentConfigId
  );
}

export function botPlayerIdsFromSeatIds(botSeatIds: string[]): string[] {
  return botSeatIds.map((seatId) => `player-${seatId.replace("seat-", "")}`);
}

export function botPlayerIdsFromSavedGame(game: GameState): string[] {
  return game.players
    .filter((player) => /^Bot\s+\d+/i.test(player.name))
    .map((player) => player.id);
}
