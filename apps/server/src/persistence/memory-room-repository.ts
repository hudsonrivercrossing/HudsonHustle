import type { RoomRepository, StoredRoomRecord } from "./types.js";

export class MemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, StoredRoomRecord>();

  async saveRoom(record: StoredRoomRecord): Promise<void> {
    this.rooms.set(record.roomCode, structuredClone(record));
  }

  async getRoom(roomCode: string): Promise<StoredRoomRecord | null> {
    const room = this.rooms.get(roomCode);
    return room ? structuredClone(room) : null;
  }
}
