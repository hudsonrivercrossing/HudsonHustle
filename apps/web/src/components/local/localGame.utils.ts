import { type BotDifficulty, type GameState } from "@hudson-hustle/game-core";
import {
  hudsonHustleCurrentConfigId,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId
} from "@hudson-hustle/game-data";

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

export function formatFaceLabel(face: string): string {
  return face
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function readSavedGame(): GameState | null {
  const raw = window.localStorage.getItem(LOCAL_SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
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
