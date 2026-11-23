import { describe, expect, it } from "vitest";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { MemoryRoomRepository } from "../src/persistence/memory-room-repository";
import { RoomService } from "../src/room-service";

const CONFIG_ID = "v0.4-flushing-newark-airport";

async function lobby() {
  const repository = new MemoryRoomRepository();
  const service = new RoomService(repository, hudsonHustleReleasedConfigs);
  const created = await service.createRoom({ hostName: "Ava", playerCount: 2, configId: CONFIG_ID, turnTimeLimitSeconds: 0 });
  const joined = await service.joinRoom(created.roomCode, { playerName: "Beau" });
  return {
    repository,
    service,
    roomCode: created.roomCode,
    host: { seatId: created.seatId, playerSecret: created.playerSecret },
    guest: { seatId: joined.seatId, playerSecret: joined.playerSecret }
  };
}

describe("seat secrets", () => {
  it("are never stored as issued", async () => {
    const { repository, roomCode, host, guest } = await lobby();
    const stored = JSON.stringify(await repository.getRoom(roomCode));
    expect(stored).not.toContain(host.playerSecret);
    expect(stored).not.toContain(guest.playerSecret);
  });

  it("still open the seat they were issued for, and only that seat", async () => {
    const { service, roomCode, host, guest } = await lobby();
    await expect(service.getSnapshot(roomCode, host)).resolves.toMatchObject({ room: { roomCode } });
    await expect(service.getSnapshot(roomCode, { seatId: host.seatId, playerSecret: guest.playerSecret })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.getSnapshot(roomCode, { seatId: host.seatId, playerSecret: "" })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("hand the same secret back on rejoin so the browser can keep its session", async () => {
    const { service, roomCode, guest } = await lobby();
    const rejoined = await service.rejoinRoom(roomCode, guest);
    expect(rejoined.playerSecret).toBe(guest.playerSecret);
  });

  it("keep working for rooms saved before secrets were hashed, and get hashed on the next save", async () => {
    const { repository, roomCode, host } = await lobby();
    const record = (await repository.getRoom(roomCode))!;
    record.seats[0].playerSecret = host.playerSecret; // as an older server stored it
    await repository.saveRoom(record);

    const restarted = new RoomService(repository, hudsonHustleReleasedConfigs);
    await restarted.setReady(roomCode, host, true);
    expect(JSON.stringify(await repository.getRoom(roomCode))).not.toContain(host.playerSecret);
    await expect(restarted.getSnapshot(roomCode, host)).resolves.toBeTruthy();
  });
});

describe("seat sessions", () => {
  it("let a verified connection act without sending the secret again", async () => {
    const { service, roomCode, host } = await lobby();
    const session = await service.openSeatSession(roomCode, host);
    expect(JSON.stringify(session)).not.toContain(host.playerSecret);
    const snapshot = await service.setReady(roomCode, session, true);
    expect(snapshot.room.seats.find((seat) => seat.seatId === host.seatId)?.ready).toBe(true);
  });

  it("are refused when the secret is wrong", async () => {
    const { service, roomCode, host } = await lobby();
    await expect(service.openSeatSession(roomCode, { ...host, playerSecret: "nope" })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("stop working once the seat has been given up and taken by someone else", async () => {
    const { service, roomCode, guest } = await lobby();
    const session = await service.openSeatSession(roomCode, guest);
    await service.leaveRoom(roomCode, guest);
    const newcomer = await service.joinRoom(roomCode, { playerName: "Cy" });
    expect(newcomer.seatId).toBe(guest.seatId);
    await expect(service.setReady(roomCode, session, true)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("bot difficulty", () => {
  it("is stored on each bot seat and refused when unknown", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const base = { hostName: "Ava", playerCount: 3 as const, configId: CONFIG_ID, turnTimeLimitSeconds: 0, botSeatIds: ["seat-2", "seat-3"] };

    const hard = await service.createRoom({ ...base, botDifficulty: "hard" });
    const stored = (await repository.getRoom(hard.roomCode))!;
    expect(stored.seats.slice(1).map((seat) => seat.controllerState)).toEqual([
      { ownership: "server", controllerKey: "internal:bot", difficulty: "hard" },
      { ownership: "server", controllerKey: "internal:bot", difficulty: "hard" }
    ]);

    const unspecified = await service.createRoom(base);
    expect((await repository.getRoom(unspecified.roomCode))!.seats[1].controllerState).toMatchObject({ difficulty: "standard" });

    await expect(service.createRoom({ ...base, botDifficulty: "impossible" as never })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lets a room of hard bots play the opening without the host waiting on anyone", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({ hostName: "Ava", playerCount: 2, configId: CONFIG_ID, turnTimeLimitSeconds: 0, botSeatIds: ["seat-2"], botDifficulty: "hard" });
    const host = { seatId: created.seatId, playerSecret: created.playerSecret };
    await service.setReady(created.roomCode, host, true);
    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });
    const afterTickets = await service.applyAction(created.roomCode, host, {
      action: { type: "select_initial_tickets", keptTicketIds: started.snapshot.privateState!.pendingTickets.slice(0, 2).map((ticket) => ticket.id) }
    });
    expect(afterTickets.game?.phase).toBe("main");
    await service.applyAction(created.roomCode, host, { action: { type: "draw_card", source: "deck" } });
    const afterTurn = await service.applyAction(created.roomCode, host, { action: { type: "draw_card", source: "deck" } });
    expect(afterTurn.game?.players[afterTurn.game.activePlayerIndex].id).toBe("player-1");
  });
});
