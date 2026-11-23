import { storageGet, storageRemove, storageSet } from "../shared/safeStorage";
import { botDifficulties, type BotDifficulty } from "@hudson-hustle/game-core";

const LAST_SETUP_KEY = "hudson-hustle-local-setup-v1";
const SAVE_META_KEY = "hudson-hustle-save-meta-v1";
const MAX_NAME_LENGTH = 24;
const MAX_TIMER_SECONDS = 3600;

/** The choices made on the local setup screen, kept so the next game starts from them. */
export interface LastLocalSetup {
  playerCount: 2 | 3 | 4;
  names: [string, string, string, string];
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
  configId: string;
  turnTimeLimitSeconds: number;
}

/** What a saved local game needs besides the game state itself. */
export interface LocalSaveMeta {
  configId: string;
  botPlayerIds: string[];
  botDifficulty: BotDifficulty;
  turnTimeLimitSeconds: number;
}

/** Records written before difficulty existed have none; they were all "standard". */
function readDifficulty(value: unknown): BotDifficulty {
  return (botDifficulties as readonly unknown[]).includes(value) ? (value as BotDifficulty) : "standard";
}

function readJson(key: string): unknown {
  try {
    const raw = storageGet(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Unreadable or corrupted storage is the same as nothing saved.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isTimer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_TIMER_SECONDS;
}

/** Returns the last setup only if every part of it is still usable, e.g. its map is still offered. */
export function readLastLocalSetup(availableConfigIds: string[]): LastLocalSetup | null {
  const value = readJson(LAST_SETUP_KEY);
  if (!isRecord(value)) {
    return null;
  }
  const { playerCount, names, botSeatIds, configId, turnTimeLimitSeconds } = value;
  if (
    (playerCount !== 2 && playerCount !== 3 && playerCount !== 4) ||
    !isStringList(names) ||
    names.length !== 4 ||
    names.some((name) => name.length > MAX_NAME_LENGTH) ||
    !isStringList(botSeatIds) ||
    typeof configId !== "string" ||
    !availableConfigIds.includes(configId) ||
    !isTimer(turnTimeLimitSeconds)
  ) {
    return null;
  }
  return {
    playerCount,
    names: names as LastLocalSetup["names"],
    botSeatIds,
    botDifficulty: readDifficulty(value.botDifficulty),
    configId,
    turnTimeLimitSeconds
  };
}

export function saveLastLocalSetup(setup: LastLocalSetup): void {
  storageSet(LAST_SETUP_KEY, JSON.stringify(setup));
}

export function readLocalSaveMeta(): LocalSaveMeta | null {
  const value = readJson(SAVE_META_KEY);
  if (!isRecord(value) || typeof value.configId !== "string" || !isStringList(value.botPlayerIds) || !isTimer(value.turnTimeLimitSeconds)) {
    return null;
  }
  return {
    configId: value.configId,
    botPlayerIds: value.botPlayerIds,
    botDifficulty: readDifficulty(value.botDifficulty),
    turnTimeLimitSeconds: value.turnTimeLimitSeconds
  };
}

export function saveLocalSaveMeta(meta: LocalSaveMeta | null): void {
  if (meta) {
    storageSet(SAVE_META_KEY, JSON.stringify(meta));
  } else {
    storageRemove(SAVE_META_KEY);
  }
}
