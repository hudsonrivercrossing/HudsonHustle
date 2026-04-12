import { afterEach, describe, expect, it } from "vitest";
import { createServerApp } from "../src/app.js";

const DATABASE_ENV_KEYS = ["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"] as const;
const envSnapshot = new Map<string, string | undefined>();

describe("server app history route", () => {
  afterEach(() => {
    for (const key of DATABASE_ENV_KEYS) {
      const value = envSnapshot.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    envSnapshot.clear();
  });

  it("serves finished match review history to an authorized player", async () => {
    forceMemoryRepository();
    const { app, roomService } = await createServerApp();

    try {
      const created = await roomService.createRoom({
        hostName: "Ava",
        playerCount: 2,
        configId: "v0.4-flushing-newark-airport",
        turnTimeLimitSeconds: 0
      });
      const joined = await roomService.joinRoom(created.roomCode, {
        playerName: "Beau"
      });

      await roomService.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
      await roomService.setReady(created.roomCode, { seatId: joined.seatId, playerSecret: joined.playerSecret }, true);
      const started = await roomService.startRoom(created.roomCode, { playerSecret: created.playerSecret });

      await roomService.applyAction(
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

      const guestSnapshot = await roomService.getSnapshot(created.roomCode, {
        seatId: joined.seatId,
        playerSecret: joined.playerSecret
      });
      await roomService.applyAction(
        created.roomCode,
        { seatId: joined.seatId, playerSecret: joined.playerSecret },
        {
          roomCode: created.roomCode,
          seatId: joined.seatId,
          playerSecret: joined.playerSecret,
          action: {
            type: "select_initial_tickets",
            keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
          }
        }
      );

      const room = (roomService as any).rooms.get(created.roomCode);
      room.game.finalRoundRemaining = 0;
      room.game.turn.stage = "awaitingHandoff";

      await roomService.applyAction(
        created.roomCode,
        { seatId: created.seatId, playerSecret: created.playerSecret },
        {
          roomCode: created.roomCode,
          seatId: created.seatId,
          playerSecret: created.playerSecret,
          action: {
            type: "advance_turn"
          }
        }
      );

      const response = await app.inject({
        method: "POST",
        url: `/rooms/${created.roomCode}/history`,
        payload: {
          seatId: joined.seatId,
          playerSecret: joined.playerSecret
        }
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.roomCode).toBe(created.roomCode);
      expect(body.events.at(-1)?.eventType).toBe("game_finished");
      expect(body.checkpoints.at(-1)?.checkpointType).toBe("game_finished");
      expect("snapshot" in (body.checkpoints[0] ?? {})).toBe(false);
    } finally {
      await app.close();
    }
  });

  it("requires credentials for the history route", async () => {
    forceMemoryRepository();
    const { app } = await createServerApp();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/rooms/ABC123/history",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        code: "missing_credentials"
      });
    } finally {
      await app.close();
    }
  });

  it("returns missing_credentials when the history body is omitted entirely", async () => {
    forceMemoryRepository();
    const { app } = await createServerApp();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/rooms/ABC123/history"
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        code: "missing_credentials"
      });
    } finally {
      await app.close();
    }
  });
});

function forceMemoryRepository() {
  for (const key of DATABASE_ENV_KEYS) {
    if (!envSnapshot.has(key)) {
      envSnapshot.set(key, process.env[key]);
    }
    delete process.env[key];
  }
}
