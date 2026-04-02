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

  it("only marks a seat connected after websocket subscription, not HTTP rejoin alone", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0
    });

    const rejoined = await service.rejoinRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });
    expect(rejoined.snapshot.room.seats[0]?.connected).toBe(false);

    const connected = await service.connectSeat(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });
    expect(connected.room.seats[0]?.connected).toBe(true);
  });

  it("restores an active timer after reloading a timed room from persistence", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 30
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau"
    });

    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    await service.setReady(created.roomCode, { seatId: joined.seatId, playerSecret: joined.playerSecret }, true);
    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });
    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "select_initial_tickets",
          keptTicketIds: started.snapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    const joinedSnapshot = await service.getSnapshot(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });
    await service.applyAction(
      created.roomCode,
      { seatId: joined.seatId, playerSecret: joined.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: joined.seatId,
        playerSecret: joined.playerSecret,
        action: {
          type: "select_initial_tickets",
          keptTicketIds: joinedSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    let restoredDeadlineAt: number | null = null;
    const reloadedService = new RoomService(repository, hudsonHustleReleasedConfigs, undefined, (_roomCode, deadlineAt) => {
      restoredDeadlineAt = deadlineAt;
    });

    await reloadedService.rejoinRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    expect(restoredDeadlineAt).not.toBeNull();
    expect(restoredDeadlineAt).toBeGreaterThan(Date.now());
  });

  it("pauses the timer instead of scheduling an invalid auto-draw when fewer than two blind cards remain", async () => {
    let latestDeadlineAt: number | null = 1;
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs, undefined, (_roomCode, deadlineAt) => {
      latestDeadlineAt = deadlineAt;
    });

    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 30
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau"
    });

    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    await service.setReady(created.roomCode, { seatId: joined.seatId, playerSecret: joined.playerSecret }, true);
    await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    const room = (service as any).rooms.get(created.roomCode);
    room.game.trainDeck = room.game.trainDeck.slice(0, 1);
    room.game.discardPile = [];

    (service as any).scheduleTimer(room);

    expect(latestDeadlineAt).toBeNull();
    expect((service as any).timeouts.has(created.roomCode)).toBe(false);
  });
});
