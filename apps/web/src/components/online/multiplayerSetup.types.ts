import type { BotDifficulty } from "@hudson-hustle/game-core";

export interface CreateRoomForm {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
}

export type OnlineSetupStage = "gateway" | "create" | "join";
export type SetupFlowStep = 0 | 1 | 2 | 3;
