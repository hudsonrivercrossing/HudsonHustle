import type { ControllerType, GameAction, GamePhase, GameState, RoomSeatSummary, RoomStatus } from "@hudson-hustle/game-core";

export type StoredSeatControllerState =
  | {
      ownership: "client";
      authStrategy: "player_secret";
    }
  | {
      ownership: "server";
      controllerKey: "internal:bot";
    };

export interface StoredSeatRecord extends RoomSeatSummary {
  playerSecret: string | null;
  controllerState: StoredSeatControllerState;
  joinedAt: string;
  updatedAt: string;
}

export interface StoredRoomRecord {
  roomCode: string;
  status: RoomStatus;
  hostSeatId: string;
  playerCount: number;
  configId: string;
  configVersion: string;
  configSummary: string;
  mapName: string;
  turnTimeLimitSeconds: number;
  createdAt: string;
  updatedAt: string;
  deadlineAt: string | null;
  snapshotVersion: number;
  game: GameState | null;
  seats: StoredSeatRecord[];
}

export type StoredGameHistoryEventType = "game_started" | "action_applied" | "game_finished";

export type StoredGameHistorySource = "human_request" | "server_bot" | "server_timeout";

export type StoredGameHistoryCheckpointType = "game_started" | "turn_handoff" | "game_finished";

export type StoredGameHistoryAction =
  | GameAction
  | {
      type: "timeout_auto_draw";
      drawCount: number;
      completedTurn: boolean;
    };

export interface StoredGameHistoryActor {
  seatId: string;
  playerId: string | null;
  controllerType: ControllerType;
  ownership: "client" | "server";
}

export interface StoredGameHistorySummary {
  drawSource?: "deck" | "market";
  marketIndex?: number | null;
  routeId?: string;
  stationCityId?: string;
  keptTicketCount?: number;
  discardedTicketCount?: number;
  turnCompleted?: boolean;
  finalScores?: Array<{
    playerId: string;
    score: number;
  }>;
}

export interface StoredGameHistoryEventPayload {
  schemaVersion: 1;
  snapshotVersion: number;
  phaseBefore: GamePhase | null;
  phaseAfter: GamePhase | null;
  activeSeatIdBefore: string | null;
  activeSeatIdAfter: string | null;
  roundNumber: number | null;
  turnNumber: number | null;
  turnActionIndex: number | null;
  actor: StoredGameHistoryActor;
  source: StoredGameHistorySource;
  action: StoredGameHistoryAction | null;
  summary: StoredGameHistorySummary | null;
}

export interface StoredGameHistoryEvent {
  roomCode: string;
  sequence: number;
  eventType: StoredGameHistoryEventType;
  payload: StoredGameHistoryEventPayload;
  createdAt: string;
}

export interface StoredGameHistoryCheckpoint {
  roomCode: string;
  snapshotVersion: number;
  checkpointType: StoredGameHistoryCheckpointType;
  snapshot: GameState;
  createdAt: string;
}

export interface StoredGameHistory {
  events: StoredGameHistoryEvent[];
  checkpoints: StoredGameHistoryCheckpoint[];
}

export interface StoredGameHistoryUpdate {
  events: StoredGameHistoryEvent[];
  checkpoints: StoredGameHistoryCheckpoint[];
}

export interface SaveRoomOptions {
  replaceHistory?: boolean;
}

export interface RoomRepository {
  saveRoom(record: StoredRoomRecord, historyUpdate?: StoredGameHistoryUpdate, options?: SaveRoomOptions): Promise<void>;
  getRoom(roomCode: string): Promise<StoredRoomRecord | null>;
  getGameHistory(roomCode: string): Promise<StoredGameHistory>;
}
