import { describe, expect, it, vi } from "vitest";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { MemoryRoomRepository } from "../src/persistence/memory-room-repository";
import type { StoredRoomRecord } from "../src/persistence/types";
import { SystemTurnClock } from "../src/turn-clock";
import { RoomService } from "../src/room-service";

const CONFIG_ID = "v0.4-flushing-newark-airport";

/** A repository whose writes take time, and which notices if two overlap for the same room. */
class SlowRepository extends MemoryRoomRepository {
  activeSaves = new Map<string, number>();
  overlappingSaves = 0;
  loads = 0;
  delayMs = 5;

  override async saveRoom(record: StoredRoomRecord): Promise<void> {
    const active = (this.activeSaves.get(record.roomCode) ?? 0) + 1;
    this.activeSaves.set(record.roomCode, active);
    if (active > 1) {
      this.overlappingSaves += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    await super.saveRoom(record);
    this.activeSaves.set(record.roomCode, (this.activeSaves.get(record.roomCode) ?? 1) - 1);
  }

  override async getRoom(roomCode: string): Promise<StoredRoomRecord | null> {
    this.loads += 1;
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return super.getRoom(roomCode);
  }
}

async function startedRoom(service: RoomService) {
  const created = await service.createRoom({ hostName: "Ava", playerCount: 2, configId: CONFIG_ID, turnTimeLimitSeconds: 0 });
  const joined = await service.joinRoom(created.roomCode, { playerName: "Beau" });
  const host = { seatId: created.seatId, playerSecret: created.playerSecret };
  const guest = { seatId: joined.seatId, playerSecret: joined.playerSecret };
  await service.setReady(created.roomCode, host, true);
  await service.setReady(created.roomCode, guest, true);
  await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });
  return { roomCode: created.roomCode, host, guest };
}

describe("RoomService concurrency", () => {
  it("never writes the same room from two requests at once", async () => {
    const repository = new SlowRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode, host, guest } = await startedRoom(service);
    repository.overlappingSaves = 0;

    const pick = async (auth: typeof host) => {
      const snapshot = await service.getSnapshot(roomCode, auth);
      return service.applyAction(roomCode, auth, {
        roomCode,
        ...auth,
        action: { type: "select_initial_tickets", keptTicketIds: snapshot.privateState!.pendingTickets.slice(0, 2).map((ticket) => ticket.id) }
      });
    };
    await Promise.all([pick(host), pick(guest), service.setReady(roomCode, host, true).catch(() => undefined), service.connectSeat(roomCode, guest)]);

    expect(repository.overlappingSaves).toBe(0);
    expect((await service.getSnapshot(roomCode)).game?.phase).toBe("main");
  });

  it("applies simultaneous moves one after the other, so only the first is legal", async () => {
    const repository = new SlowRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode, host, guest } = await startedRoom(service);
    for (const auth of [host, guest]) {
      const snapshot = await service.getSnapshot(roomCode, auth);
      await service.applyAction(roomCode, auth, {
        roomCode,
        ...auth,
        action: { type: "select_initial_tickets", keptTicketIds: snapshot.privateState!.pendingTickets.slice(0, 2).map((ticket) => ticket.id) }
      });
    }

    const draw = () => service.applyAction(roomCode, host, { roomCode, ...host, action: { type: "draw_card", source: "deck" } });
    const results = await Promise.allSettled([draw(), draw(), draw()]);

    expect(results.map((result) => result.status)).toEqual(["fulfilled", "fulfilled", "rejected"]);
    const after = await service.getSnapshot(roomCode, host);
    expect(after.privateState?.hand).toHaveLength(6);
    expect(after.game?.players[after.game.activePlayerIndex].id).toBe("player-2");
  });

  it("loads a room from storage once when several requests arrive for it together", async () => {
    const repository = new SlowRepository();
    const first = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode, host } = await startedRoom(first);

    const restarted = new RoomService(repository, hudsonHustleReleasedConfigs);
    repository.loads = 0;
    await Promise.all([restarted.getSnapshot(roomCode), restarted.getSnapshot(roomCode, host), restarted.getPrivateStates(roomCode)]);

    expect(repository.loads).toBe(1);
  });

  it("keeps serving a room after one request for it fails", async () => {
    const service = new RoomService(new SlowRepository(), hudsonHustleReleasedConfigs);
    const { roomCode, host } = await startedRoom(service);
    await expect(service.applyAction(roomCode, host, { roomCode, ...host, action: { type: "teleport" } } as never)).rejects.toThrow();
    await expect(service.getSnapshot(roomCode)).resolves.toMatchObject({ room: { roomCode } });
  });
});

describe("RoomService idle rooms", () => {
  it("drops idle rooms from memory and reloads them on demand", async () => {
    const repository = new SlowRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode, host } = await startedRoom(service);

    expect(service.evictIdleRooms(60_000)).toEqual([]);
    vi.useFakeTimers({ now: Date.now() + 2 * 60 * 60 * 1000, toFake: ["Date"] });
    try {
      expect(service.evictIdleRooms(60 * 60 * 1000)).toEqual([roomCode]);
      expect(service.evictIdleRooms(60 * 60 * 1000)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }

    repository.loads = 0;
    const snapshot = await service.getSnapshot(roomCode, host);
    expect(repository.loads).toBe(1);
    expect(snapshot.privateState?.hand).toHaveLength(4);
  });

  it("keeps rooms that still have someone connected", async () => {
    const service = new RoomService(new SlowRepository(), hudsonHustleReleasedConfigs);
    const { roomCode, host } = await startedRoom(service);
    await service.connectSeat(roomCode, host);
    vi.useFakeTimers({ now: Date.now() + 2 * 60 * 60 * 1000, toFake: ["Date"] });
    try {
      expect(service.evictIdleRooms(60 * 60 * 1000)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops every pending turn timer when disposed", async () => {
    const clock = new SystemTurnClock();
    const service = new RoomService(new SlowRepository(), hudsonHustleReleasedConfigs, undefined, undefined, undefined, clock);
    const created = await service.createRoom({ hostName: "Ava", playerCount: 2, configId: CONFIG_ID, turnTimeLimitSeconds: 30, botSeatIds: ["seat-2"] });
    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });
    service.dispose();
    expect(clock.pending).toBe(0);
  });
});
