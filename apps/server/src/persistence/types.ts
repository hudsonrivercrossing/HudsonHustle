import type { GameState, RoomSeatSummary, RoomStatus } from "@hudson-hustle/game-core";

export interface StoredSeatRecord extends RoomSeatSummary {
  playerSecret: string;
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

export interface RoomRepository {
  saveRoom(record: StoredRoomRecord): Promise<void>;
  getRoom(roomCode: string): Promise<StoredRoomRecord | null>;
}
