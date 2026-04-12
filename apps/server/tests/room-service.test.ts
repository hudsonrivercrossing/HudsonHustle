import { describe, expect, it, vi } from "vitest";
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

  it("creates a mixed room with bot seats through normal room creation", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);

    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 4,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0,
      botSeatIds: ["seat-2", "seat-4"]
    });

    expect(created.snapshot.room.seats[0]).toMatchObject({
      seatId: "seat-1",
      playerName: "Ava",
      controllerType: "human"
    });
    expect(created.snapshot.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      playerName: "Bot 1",
      controllerType: "bot",
      ready: true,
      connected: true
    });
    expect(created.snapshot.room.seats[2]).toMatchObject({
      seatId: "seat-3",
      playerName: null,
      controllerType: "human"
    });
    expect(created.snapshot.room.seats[3]).toMatchObject({
      seatId: "seat-4",
      playerName: "Bot 3",
      controllerType: "bot",
      ready: true,
      connected: true
    });
  });

  it("starts a full mixed room using bot seats without bypassing the normal lifecycle", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);

    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0,
      botSeatIds: ["seat-2"]
    });

    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    expect(started.snapshot.room.status).toBe("active");
    expect(started.snapshot.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      controllerType: "bot"
    });
    expect(started.snapshot.game?.players).toHaveLength(2);
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

  it("rejects an unknown room code and invalid credentials with explicit status codes", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0
    });

    await expect(
      service.getSnapshot("NOPE00", {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    await expect(
      service.rejoinRoom(created.roomCode, {
        seatId: created.seatId,
        playerSecret: "wrong-secret"
      })
    ).rejects.toMatchObject({ statusCode: 403 });
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

  it("rejects a preferred seat that is already occupied", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0
    });
    await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-2"
    });

    await expect(
      service.joinRoom(created.roomCode, {
        playerName: "Casey",
        preferredSeatId: "seat-2"
      })
    ).rejects.toMatchObject({ statusCode: 409, code: "seat_taken" });
  });

  it("vacates a lobby seat and transfers host before another player joins", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-2"
    });

    await service.leaveRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    const snapshotAfterLeave = await service.getSnapshot(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });
    expect(snapshotAfterLeave.room.hostSeatId).toBe("seat-2");
    expect(snapshotAfterLeave.room.seats[0]).toMatchObject({
      seatId: "seat-1",
      playerName: null,
      isHost: false
    });
    expect(snapshotAfterLeave.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      playerName: "Beau",
      isHost: true
    });

    const replacement = await service.joinRoom(created.roomCode, {
      playerName: "Casey",
      preferredSeatId: "seat-1"
    });
    expect(replacement.snapshot.room.seats[0]).toMatchObject({
      seatId: "seat-1",
      playerName: "Casey",
      isHost: false
    });
  });

  it("reassigns host to the next player who joins an otherwise empty lobby", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0
    });

    await service.leaveRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-2"
    });

    expect(joined.snapshot.room.hostSeatId).toBe("seat-2");
    expect(joined.snapshot.room.seats[0]).toMatchObject({
      seatId: "seat-1",
      playerName: null,
      isHost: false
    });
    expect(joined.snapshot.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      playerName: "Beau",
      isHost: true
    });
  });

  it("does not transfer host privileges to a bot seat when the host leaves the lobby", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.3-atlantic-hoboken",
      turnTimeLimitSeconds: 0,
      botSeatIds: ["seat-2"]
    });

    await service.leaveRoom(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    const replacement = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-3"
    });

    expect(replacement.snapshot.room.hostSeatId).toBe("seat-3");
    expect(replacement.snapshot.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      controllerType: "bot",
      isHost: false
    });
    expect(replacement.snapshot.room.seats[2]).toMatchObject({
      seatId: "seat-3",
      playerName: "Beau",
      isHost: true
    });
  });

  it("can represent a server-owned bot seat without a player secret in the authoritative room model", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    const botAssigned = await service.assignBotSeat(created.roomCode, "seat-2", "Bot West");

    expect(botAssigned.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      playerName: "Bot West",
      controllerType: "bot",
      ready: true,
      connected: true
    });

    const room = (service as any).rooms.get(created.roomCode);
    expect(room.seats[1]?.playerSecret).toBeNull();
    expect(room.seats[1]?.controllerState).toEqual({
      ownership: "server",
      controllerKey: "internal:bot"
    });

    await expect(
      service.rejoinRoom(created.roomCode, {
        seatId: "seat-2",
        playerSecret: "fake-secret"
      })
    ).rejects.toMatchObject({ statusCode: 403, code: "invalid_credentials" });
  });

  it("allows a human host to start a room that includes a server-owned bot seat", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    await service.assignBotSeat(created.roomCode, "seat-2", "Bot West");
    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);

    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    expect(started.snapshot.room.status).toBe("active");
    expect(started.snapshot.game?.players).toHaveLength(2);
    expect(started.snapshot.room.seats[1]).toMatchObject({
      seatId: "seat-2",
      controllerType: "bot",
      playerName: "Bot West"
    });
  });

  it("keeps private snapshot isolation intact when a server-owned bot seat is present", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    await service.assignBotSeat(created.roomCode, "seat-2", "Bot West");
    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    const publicSnapshot = await service.getSnapshot(created.roomCode);
    const hostSnapshot = await service.getSnapshot(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    expect(publicSnapshot.privateState).toBeNull();
    expect(hostSnapshot.privateState?.seatId).toBe(created.seatId);
    expect(hostSnapshot.privateState?.playerId).toBe(hostSnapshot.game?.players[0]?.id);

    const botPlayer = hostSnapshot.game?.players.find((player) => player.name === "Bot West");
    expect(botPlayer?.handCount).toBe(4);
    expect(botPlayer?.ticketCount).toBe(0);
    expect(botPlayer?.pendingTicketCount).toBe(4);
  });

  it("auto-confirms initial tickets for a server-owned bot seat through the normal action path", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    await service.assignBotSeat(created.roomCode, "seat-2", "Bot West");
    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
    const started = await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    expect(started.snapshot.game?.phase).toBe("initialTickets");

    const afterHostSelection = await service.applyAction(
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

    expect(afterHostSelection.game?.phase).toBe("main");
    expect(afterHostSelection.room.activeSeatId).toBe(created.seatId);

    const botPlayer = afterHostSelection.game?.players.find((player) => player.name === "Bot West");
    expect(botPlayer?.ticketCount).toBe(2);
    expect(botPlayer?.pendingTicketCount).toBe(0);
  });

  it("automatically completes a legal bot turn when the bot becomes the active seat", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 2,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0
    });

    await service.assignBotSeat(created.roomCode, "seat-2", "Bot West");
    await service.setReady(created.roomCode, { seatId: created.seatId, playerSecret: created.playerSecret }, true);
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

    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    const beforeBotTurn = await service.getSnapshot(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    const afterBotTurn = await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    expect(afterBotTurn.room.activeSeatId).toBe(created.seatId);
    const botPlayer = afterBotTurn.game?.players.find((player) => player.name === "Bot West");
    const beforeBotPlayer = beforeBotTurn.game?.players.find((player) => player.name === "Bot West");
    expect(botPlayer).toBeTruthy();

    const visibleBotStateChanged =
      (afterBotTurn.game?.routeClaims.length ?? 0) !== (beforeBotTurn.game?.routeClaims.length ?? 0) ||
      (afterBotTurn.game?.stations.length ?? 0) !== (beforeBotTurn.game?.stations.length ?? 0) ||
      (afterBotTurn.game?.log.length ?? 0) !== (beforeBotTurn.game?.log.length ?? 0) ||
      (botPlayer?.handCount ?? 0) !== (beforeBotPlayer?.handCount ?? 0) ||
      (botPlayer?.ticketCount ?? 0) !== (beforeBotPlayer?.ticketCount ?? 0) ||
      (botPlayer?.pendingTicketCount ?? 0) !== (beforeBotPlayer?.pendingTicketCount ?? 0) ||
      (botPlayer?.stationsLeft ?? 0) !== (beforeBotPlayer?.stationsLeft ?? 0) ||
      (botPlayer?.trainsLeft ?? 0) !== (beforeBotPlayer?.trainsLeft ?? 0) ||
      (botPlayer?.score ?? 0) !== (beforeBotPlayer?.score ?? 0);

    expect(visibleBotStateChanged).toBe(true);
  });

  it("records canonical mixed-room history events and checkpoints", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 0,
      botSeatIds: ["seat-2"]
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-3"
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

    const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
          keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    const hostAfterFirstDraw = await service.getSnapshot(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });
    expect(hostAfterFirstDraw.room.activeSeatId).toBe(created.seatId);

    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    const history = await service.getGameHistory(created.roomCode);

    expect(history.events[0]).toMatchObject({
      sequence: 0,
      eventType: "game_started",
      payload: {
        source: "human_request",
        turnNumber: null,
        roundNumber: null
      }
    });

    expect(
      history.events.some(
        (event) =>
          event.payload.source === "server_bot" &&
          event.payload.actor.controllerType === "bot" &&
          event.payload.action?.type === "select_initial_tickets"
      )
    ).toBe(true);

    expect(
      history.events.some(
        (event) =>
          event.payload.actor.seatId === created.seatId &&
          event.payload.turnNumber === 1 &&
          event.payload.turnActionIndex === 1 &&
          event.payload.action?.type === "draw_card"
      )
    ).toBe(true);

    expect(
      history.events.some(
        (event) =>
          event.payload.actor.seatId === created.seatId &&
          event.payload.turnNumber === 1 &&
          event.payload.turnActionIndex === 2 &&
          event.payload.summary?.turnCompleted === true
      )
    ).toBe(true);

    expect(
      history.events.some(
        (event) =>
          event.payload.source === "server_bot" &&
          event.payload.turnNumber === 2 &&
          event.payload.turnActionIndex === 1
      )
    ).toBe(true);

    expect(history.checkpoints[0]).toMatchObject({
      snapshotVersion: 0,
      checkpointType: "game_started"
    });
    expect(history.checkpoints.some((checkpoint) => checkpoint.checkpointType === "turn_handoff")).toBe(true);
  });

  it("records timeout-driven actions explicitly in canonical history", async () => {
    vi.useFakeTimers();
    try {
      const repository = new MemoryRoomRepository();
      const service = new RoomService(repository, hudsonHustleReleasedConfigs);

      const created = await service.createRoom({
        hostName: "Ava",
        playerCount: 2,
        configId: "v0.4-flushing-newark-airport",
        turnTimeLimitSeconds: 15
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

      const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
            keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
          }
        }
      );

      await service.applyAction(
        created.roomCode,
        { seatId: created.seatId, playerSecret: created.playerSecret },
        {
          roomCode: created.roomCode,
          seatId: created.seatId,
          playerSecret: created.playerSecret,
          action: {
            type: "draw_card",
            source: "deck"
          }
        }
      );

      await vi.advanceTimersByTimeAsync(15_000);
      await vi.runAllTicks();

      const history = await service.getGameHistory(created.roomCode);
      const timeoutEvent = history.events.find((event) => event.payload.source === "server_timeout");

      expect(timeoutEvent).toBeTruthy();
      expect(timeoutEvent?.payload.action).toMatchObject({
        type: "timeout_auto_draw",
        completedTurn: true
      });
      expect(timeoutEvent?.payload.turnNumber).toBe(1);
      expect(timeoutEvent?.payload.turnActionIndex).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("records a game_finished history event and checkpoint when the game ends", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
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

    const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
          keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    const room = (service as any).rooms.get(created.roomCode);
    room.game.finalRoundRemaining = 0;
    room.game.turn.stage = "awaitingHandoff";

    await service.applyAction(
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

    const history = await service.getGameHistory(created.roomCode);
    const finalEvent = history.events.at(-1);
    const finalCheckpoint = history.checkpoints.at(-1);

    expect(finalEvent?.eventType).toBe("game_finished");
    expect(finalEvent?.payload.phaseAfter).toBe("gameOver");
    expect(finalEvent?.payload.summary?.finalScores?.length).toBe(2);
    expect(finalCheckpoint).toMatchObject({
      checkpointType: "game_finished",
      snapshotVersion: finalEvent?.sequence
    });
  });

  it("only exposes review history after the match finishes", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
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
    await service.startRoom(created.roomCode, { playerSecret: created.playerSecret });

    await expect(
      service.getReviewHistory(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "history_not_ready"
    });
  });

  it("projects finished review history without exposing checkpoint snapshots", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
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

    const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
          keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    const room = (service as any).rooms.get(created.roomCode);
    room.game.finalRoundRemaining = 0;
    room.game.turn.stage = "awaitingHandoff";

    await service.applyAction(
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

    const reviewHistory = await service.getReviewHistory(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    expect(reviewHistory).toMatchObject({
      roomCode: created.roomCode,
      status: "finished",
      configId: "v0.4-flushing-newark-airport"
    });
    expect(reviewHistory.events.at(-1)?.eventType).toBe("game_finished");
    expect(reviewHistory.completedAt).toBe(reviewHistory.events.at(-1)?.createdAt);
    expect(reviewHistory.checkpoints.at(-1)).toMatchObject({
      checkpointType: "game_finished"
    });
    expect("snapshot" in (reviewHistory.checkpoints[0] ?? {})).toBe(false);

    await service.connectSeat(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    const reviewHistoryAfterReconnect = await service.getReviewHistory(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    expect(reviewHistoryAfterReconnect.completedAt).toBe(reviewHistory.completedAt);
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

  it("allows any player with pending starting tickets to confirm before the active seat rotates naturally", async () => {
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
    const guestSnapshot = await service.getSnapshot(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    const guestConfirmed = await service.applyAction(
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

    expect(guestConfirmed.room.status).toBe("active");
    expect(guestConfirmed.game?.phase).toBe("initialTickets");
    expect(guestConfirmed.privateState?.pendingTickets).toEqual([]);

    const hostConfirmed = await service.applyAction(
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

    expect(hostConfirmed.game?.phase).toBe("main");
    expect(hostConfirmed.room.activeSeatId).toBe(created.seatId);
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

  it("immediately resolves an expired timer after reloading a persisted room", async () => {
    vi.useFakeTimers();
    try {
      const repository = new MemoryRoomRepository();
      const service = new RoomService(repository, hudsonHustleReleasedConfigs);
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

      const storedRoom = (repository as any).rooms.get(created.roomCode);
      storedRoom.deadlineAt = new Date(Date.now() - 1000).toISOString();

      const deadlineChanges: Array<number | null> = [];
      const observedService = new RoomService(repository, hudsonHustleReleasedConfigs, undefined, (_roomCode, deadlineAt) => {
        deadlineChanges.push(deadlineAt);
      });
      const snapshotBefore = await observedService.getSnapshot(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      });

      await vi.advanceTimersByTimeAsync(0);
      await vi.runAllTicks();

      const snapshotAfter = await observedService.getSnapshot(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      });

      expect(snapshotBefore.room.activeSeatId).toBe(created.seatId);
      expect(deadlineChanges.length).toBeGreaterThan(1);
      expect(deadlineChanges[0]).not.toBeNull();
      expect(deadlineChanges.at(-1)).not.toBeNull();
      expect((deadlineChanges.at(-1) ?? 0)).toBeGreaterThan(deadlineChanges[0] ?? 0);
      expect(snapshotAfter.room.activeSeatId).toBe(joined.seatId);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the same deadline after the first draw and auto-completes the turn on timeout", async () => {
    vi.useFakeTimers();
    try {
      let latestDeadlineAt: number | null = null;
      const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs, undefined, (_roomCode, deadlineAt) => {
        latestDeadlineAt = deadlineAt;
      });

      const created = await service.createRoom({
        hostName: "Ava",
        playerCount: 2,
        configId: "v0.4-flushing-newark-airport",
        turnTimeLimitSeconds: 15
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

      const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
            keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
          }
        }
      );

      const roomBeforeDraw = (service as any).rooms.get(created.roomCode);
      const initialDeadlineAt = roomBeforeDraw.deadlineAt;
      expect(initialDeadlineAt).not.toBeNull();

      const hostBeforeDraw = await service.getSnapshot(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      });
      expect(hostBeforeDraw.privateState?.hand).toHaveLength(4);

      await service.applyAction(
        created.roomCode,
        { seatId: created.seatId, playerSecret: created.playerSecret },
        {
          roomCode: created.roomCode,
          seatId: created.seatId,
          playerSecret: created.playerSecret,
          action: {
            type: "draw_card",
            source: "deck"
          }
        }
      );

      const roomAfterFirstDraw = (service as any).rooms.get(created.roomCode);
      expect(roomAfterFirstDraw.game.turn.stage).toBe("drawing");
      expect(roomAfterFirstDraw.deadlineAt).toBe(initialDeadlineAt);
      expect(latestDeadlineAt).toBe(initialDeadlineAt);

      await vi.advanceTimersByTimeAsync(15_000);
      await vi.runAllTicks();

      const hostAfterTimeout = await service.getSnapshot(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      });

      expect(hostAfterTimeout.room.activeSeatId).toBe(joined.seatId);
      expect(hostAfterTimeout.privateState?.hand).toHaveLength(6);
      expect((service as any).rooms.get(created.roomCode).deadlineAt).not.toBe(initialDeadlineAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it("continues through a bot turn when a timed human timeout hands off to a server-owned seat", async () => {
    vi.useFakeTimers();
    try {
      let latestDeadlineAt: number | null = null;
      const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs, undefined, (_roomCode, deadlineAt) => {
        latestDeadlineAt = deadlineAt;
      });

      const created = await service.createRoom({
        hostName: "Ava",
        playerCount: 3,
        configId: "v0.4-flushing-newark-airport",
        turnTimeLimitSeconds: 15,
        botSeatIds: ["seat-2"]
      });
      const joined = await service.joinRoom(created.roomCode, {
        playerName: "Beau",
        preferredSeatId: "seat-3"
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

      const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
            keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
          }
        }
      );

      const beforeTimeout = await service.getSnapshot(created.roomCode, {
        seatId: created.seatId,
        playerSecret: created.playerSecret
      });
      expect(beforeTimeout.room.activeSeatId).toBe(created.seatId);

      await vi.advanceTimersByTimeAsync(15_000);
      await vi.runAllTicks();

      const afterTimeout = await service.getSnapshot(created.roomCode, {
        seatId: joined.seatId,
        playerSecret: joined.playerSecret
      });

      expect(afterTimeout.room.activeSeatId).toBe(joined.seatId);
      expect(afterTimeout.game?.players.find((player) => player.name === "Bot 1")).toBeTruthy();
      expect(latestDeadlineAt).not.toBeNull();
      expect((latestDeadlineAt ?? 0)).toBeGreaterThan(Date.now());
    } finally {
      vi.useRealTimers();
    }
  });

  it("resumes a persisted mixed room immediately when the restored active seat is server-owned", async () => {
    const repository = new MemoryRoomRepository();
    const service = new RoomService(repository, hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 30,
      botSeatIds: ["seat-2"]
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-3"
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

    const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
          keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    await service.applyAction(
      created.roomCode,
      { seatId: created.seatId, playerSecret: created.playerSecret },
      {
        roomCode: created.roomCode,
        seatId: created.seatId,
        playerSecret: created.playerSecret,
        action: {
          type: "draw_card",
          source: "deck"
        }
      }
    );

    const storedRoom = (repository as any).rooms.get(created.roomCode);
    storedRoom.deadlineAt = new Date(Date.now() + 15_000).toISOString();

    const reloadedService = new RoomService(repository, hudsonHustleReleasedConfigs);
    const resumed = await reloadedService.getSnapshot(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    expect(resumed.room.activeSeatId).toBe(joined.seatId);
  });

  it("keeps reconnect and disconnect semantics stable for human seats in a mixed active room", async () => {
    const service = new RoomService(new MemoryRoomRepository(), hudsonHustleReleasedConfigs);
    const created = await service.createRoom({
      hostName: "Ava",
      playerCount: 3,
      configId: "v0.4-flushing-newark-airport",
      turnTimeLimitSeconds: 30,
      botSeatIds: ["seat-2"]
    });
    const joined = await service.joinRoom(created.roomCode, {
      playerName: "Beau",
      preferredSeatId: "seat-3"
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

    const guestSnapshot = await service.getSnapshot(created.roomCode, {
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
          keptTicketIds: guestSnapshot.privateState?.pendingTickets.slice(0, 2).map((ticket) => ticket.id) ?? []
        }
      }
    );

    await service.disconnectSeat(created.roomCode, joined.seatId);
    const afterDisconnect = await service.getSnapshot(created.roomCode, {
      seatId: created.seatId,
      playerSecret: created.playerSecret
    });

    expect(afterDisconnect.room.seats.find((seat) => seat.seatId === joined.seatId)?.connected).toBe(false);
    expect(afterDisconnect.room.seats.find((seat) => seat.seatId === "seat-2")?.connected).toBe(true);

    const afterReconnect = await service.connectSeat(created.roomCode, {
      seatId: joined.seatId,
      playerSecret: joined.playerSecret
    });

    expect(afterReconnect.room.seats.find((seat) => seat.seatId === joined.seatId)?.connected).toBe(true);
    expect(afterReconnect.room.seats.find((seat) => seat.seatId === "seat-2")?.controllerType).toBe("bot");
  });
});
