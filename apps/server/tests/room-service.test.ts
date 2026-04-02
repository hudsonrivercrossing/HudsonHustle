import { describe, expect, it } from "vitest";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { MemoryRoomRepository } from "../src/persistence/memory-room-repository";
import { RoomService } from "../src/room-service";

describe("RoomService", () => {
  it("creates, joins, starts, and projects a multiplayer room", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);

    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau"
    });

    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    await service.setReady(created.roomCode, { seatId: joined.seatId, playerSecret: joined.playerSecret }, true);

    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    expect(started.snapshot.room.status).toBe("active");
    expect(started.snapshot.game?.players).toHaveLength(2);
    expect(started.snapshot.privateState?.hand).toHaveLength(4);
  });

  it("supports reconnect with roomCode + seatId + playerSecret", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 30
    });

    const rejoined = await service.rejoinRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    expect(rejoined.snapshot.room.roomCode).toBe(created.roomCode);
    expect(rejoined.snapshot.room.seats[0]?.playerName).toBe("Ava");
  });
});
