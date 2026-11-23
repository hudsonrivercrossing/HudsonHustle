import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { PostgresRoomRepository } from "../src/persistence/postgres-room-repository";
import { RoomService } from "../src/room-service";

// Runs only when pointed at a disposable database, e.g.
//   HH_TEST_DATABASE_URL=postgres://hh@127.0.0.1:54329 pnpm --filter @hudson-hustle/server test
// The URL is a server; the tests use the databases hh_fresh, hh_legacy and hh_ancient on it.
// Never point this at a database you care about: rows are written and tables are created.
const serverUrl = process.env.HH_TEST_DATABASE_URL;
const CONFIG_ID = "v0.4-flushing-newark-airport";
const repositories: PostgresRoomRepository[] = [];

function repositoryFor(database: string): PostgresRoomRepository {
  const repository = new PostgresRoomRepository(`${serverUrl}/${database}`);
  repositories.push(repository);
  return repository;
}

async function playedRoom(service: RoomService) {
  const created = await service.createRoom({ hostName: "Ava", playerCount: 2, configId: CONFIG_ID, turnTimeLimitSeconds: 0 });
  const joined = await service.joinRoom(created.roomCode, { playerName: "Beau" });
  const host = { seatId: created.seatId, playerSecret: created.playerSecret };
  const guest = { seatId: joined.seatId, playerSecret: joined.playerSecret };
  await service.setReady(created.roomCode, host, true);
  await service.setReady(created.roomCode, guest, true);
  await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });
  for (const auth of [host, guest]) {
    const snapshot = await service.getSnapshot(created.roomCode, auth);
    await service.applyAction(created.roomCode, auth, {
      action: { type: "select_initial_tickets", keptTicketIds: snapshot.privateState!.pendingTickets.slice(0, 2).map((ticket) => ticket.id) }
    });
  }
  return { roomCode: created.roomCode, host, guest };
}

describe.skipIf(!serverUrl)("PostgresRoomRepository against a real database", () => {
  afterAll(async () => {
    await Promise.all(repositories.map((repository) => repository.close()));
  });

  it("creates the schema on an empty database and is safe to start twice", async () => {
    const first = repositoryFor("hh_fresh");
    expect(await first.getRoom("NOSUCH")).toBeNull();
    const second = repositoryFor("hh_fresh");
    expect(await second.getRoom("NOSUCH")).toBeNull();
  });

  it("adopts a database whose tables the old startup code created", async () => {
    expect(await repositoryFor("hh_legacy").getRoom("NOSUCH")).toBeNull();
  });

  it("upgrades an early database and keeps its rooms, including a secret stored as issued", async () => {
    const repository = repositoryFor("hh_ancient");
    const record = await repository.getRoom("OLDONE");
    expect(record?.seats[0]).toMatchObject({ playerName: "Ava", controllerState: { ownership: "client" } });

    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const oldCredentials = { seatId: "seat-1", playerSecret: "plain-old-secret" };
    await service.setReady("OLDONE", oldCredentials, true);
    const after = await repository.getRoom("OLDONE");
    expect(after?.seats[0].playerSecret).toMatch(/^sha256:/);
    await expect(service.getSnapshot("OLDONE", oldCredentials)).resolves.toBeTruthy();
  });

  it("plays a game, survives a server restart, and lets a player rejoin", async () => {
    const repository = repositoryFor("hh_fresh");
    const { roomCode, host, guest } = await playedRoom(new RoomService(repository, hudsonHustleReleasedConfigs));

    const firstServer = new RoomService(repository, hudsonHustleReleasedConfigs);
    await firstServer.applyAction(roomCode, host, { action: { type: "draw_card", source: "deck" } });
    await firstServer.applyAction(roomCode, host, { action: { type: "draw_card", source: "deck" } });

    const restarted = new RoomService(repositoryFor("hh_fresh"), hudsonHustleReleasedConfigs);
    const rejoined = await restarted.rejoinRoom(roomCode, guest);
    expect(rejoined.snapshot.room.status).toBe("active");
    expect(rejoined.snapshot.game?.players[rejoined.snapshot.game.activePlayerIndex].id).toBe("player-2");
    expect(rejoined.snapshot.privateState?.hand).toHaveLength(4);
    expect((await restarted.getSnapshot(roomCode, host)).privateState?.hand).toHaveLength(6);

    const history = await restarted.getGameHistory(roomCode);
    expect(history.events.length).toBeGreaterThanOrEqual(4);
    restarted.dispose();
    firstServer.dispose();
  });

  it("leaves a room exactly as it was when a save fails part-way", async () => {
    const repository = repositoryFor("hh_fresh");
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode } = await playedRoom(service);
    const before = (await repository.getRoom(roomCode))!;

    // Two seats with the same id: the seats are deleted, then the second insert breaks the primary key.
    const broken = structuredClone(before);
    broken.status = "finished";
    broken.seats = [broken.seats[0], { ...broken.seats[1], seatId: broken.seats[0].seatId }];
    await expect(repository.saveRoom(broken)).rejects.toThrow();

    const after = (await repository.getRoom(roomCode))!;
    expect(after.status).toBe(before.status);
    expect(after.seats.map((seat) => seat.seatId)).toEqual(before.seats.map((seat) => seat.seatId));
    service.dispose();
  });

  it("handles a burst of requests for one room without losing or duplicating writes", async () => {
    const repository = repositoryFor("hh_fresh");
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const { roomCode, host, guest } = await playedRoom(service);

    const draw = () => service.applyAction(roomCode, host, { action: { type: "draw_card", source: "deck" } });
    const results = await Promise.allSettled([draw(), draw(), draw(), service.connectSeat(roomCode, guest), service.getSnapshot(roomCode)]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "fulfilled", "rejected", "fulfilled", "fulfilled"]);

    const stored = (await repository.getRoom(roomCode))!;
    expect(stored.seats).toHaveLength(2);
    const sql = postgres(`${serverUrl}/hh_fresh`, { max: 1 });
    try {
      const [counts] = await sql`
        select count(*)::int as events, count(distinct sequence)::int as sequences
        from game_events where room_code = ${roomCode} and event_type <> 'room_saved'
      `;
      expect(counts.events).toBeGreaterThan(0);
      expect(counts.events).toBe(counts.sequences);
    } finally {
      await sql.end();
    }
    service.dispose();
  });
});
