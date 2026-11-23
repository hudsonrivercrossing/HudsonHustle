import { type BotDifficulty, type GameState } from "@hudson-hustle/game-core";
import {
  hudsonHustleCurrentConfigId,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId
} from "@hudson-hustle/game-data";

export const LOCAL_SAVE_KEY = "hudson-hustle-save-v1";

export type VisibilityMode = "visible" | "handoff";
export type LocalStartSetup = {
  playerNames: string[];
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
  configId: string;
  turnTimeLimitSeconds: number;
};

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
