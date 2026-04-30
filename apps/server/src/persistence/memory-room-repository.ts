import type { RoomRepository, SaveRoomOptions, StoredGameHistory, StoredGameHistoryUpdate, StoredRoomRecord } from "./types.js";

export class MemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, StoredRoomRecord>();
  private readonly histories = new Map<string, StoredGameHistory>();

  async saveRoom(record: StoredRoomRecord, historyUpdate?: StoredGameHistoryUpdate, options?: SaveRoomOptions): Promise<void> {
    this.rooms.set(record.roomCode, structuredClone(record));
    if (options?.replaceHistory) {
      this.histories.set(record.roomCode, { events: [], checkpoints: [] });
    }
    if (!historyUpdate) {
      return;
    }

    const current = this.histories.get(record.roomCode) ?? { events: [], checkpoints: [] };
    this.histories.set(record.roomCode, {
      events: [...current.events, ...structuredClone(historyUpdate.events)],
      checkpoints: [...current.checkpoints, ...structuredClone(historyUpdate.checkpoints)]
    });
  }

  async getRoom(roomCode: string): Promise<StoredRoomRecord | null> {
    const room = this.rooms.get(roomCode);
    return room ? structuredClone(room) : null;
  }

  async getGameHistory(roomCode: string): Promise<StoredGameHistory> {
    const history = this.histories.get(roomCode);
    return history
      ? structuredClone(history)
      : {
          events: [],
          checkpoints: []
        };
  }
}
