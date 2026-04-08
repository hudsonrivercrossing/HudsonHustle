import { randomBytes, randomUUID } from "node:crypto";
import {
  getCurrentPlayer,
  type ControllerType,
  type GameAction,
  type GameActionPayload,
  reduceGame,
  startGame,
  type CreateRoomRequest,
  type CreateRoomResponse,
  type GameState,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type PublicGameState,
  type PublicPlayerState,
  type RejoinRoomRequest,
  type RejoinRoomResponse,
  type RoomSeatSummary,
  type RoomSnapshot,
  type RoomStatus,
  type RoomSummary,
  type SeatPrivateState,
  type StartRoomRequest,
  type StartRoomResponse
} from "@hudson-hustle/game-core";
import {
  getHudsonHustleMapByConfigId,
  getHudsonHustleReleasedConfigBundle,
  type HudsonHustleReleasedConfigSummary
} from "@hudson-hustle/game-data";
import type { RoomRepository, StoredRoomRecord, StoredSeatRecord } from "./persistence/types.js";
import { chooseBotAction } from "./bot-policy.js";

type RoomTimerCallback = (roomCode: string, deadlineAt: number | null) => void;

export class RoomServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "RoomServiceError";
  }
}

interface ServerRoom {
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
  snapshotVersion: number;
  game: GameState | null;
  seats: StoredSeatRecord[];
  deadlineAt: number | null;
}

interface RoomAuth {
  seatId: string;
  playerSecret: string;
}

function invariant(condition: unknown, message: string, statusCode = 400, code = "bad_request"): asserts condition {
  if (!condition) {
    throw new RoomServiceError(message, statusCode, code);
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomToken(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(length), (byte) => alphabet[byte % alphabet.length]).join("");
}

function createPlayerSecret(): string {
  return randomUUID();
}

function createClientControllerState() {
  return {
    ownership: "client",
    authStrategy: "player_secret"
  } as const;
}

function createBotControllerState() {
  return {
    ownership: "server",
    controllerKey: "internal:bot"
  } as const;
}

function seatRequiresPlayerSecret(controllerType: ControllerType): boolean {
  return controllerType === "human" || controllerType === "human+agent";
}

function buildPublicGameState(game: GameState): PublicGameState {
  return {
    version: game.version,
    mapId: game.mapId,
    players: game.players.map<PublicPlayerState>((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      trainsLeft: player.trainsLeft,
      stationsLeft: player.stationsLeft,
      handCount: player.hand.length,
      ticketCount: player.tickets.length,
      pendingTicketCount: player.pendingTickets.length,
      endgame: player.endgame
    })),
    activePlayerIndex: game.activePlayerIndex,
    phase: game.phase,
    routeClaims: game.routeClaims,
    stations: game.stations,
    market: game.market,
    discardCount: game.discardPile.length,
    trainDeckCount: game.trainDeck.length,
    regularTicketsCount: game.regularTickets.length,
    longTicketsCount: game.longTickets.length,
    discardedTicketsCount: game.discardedTickets.length,
    turn: game.turn,
    finalRoundRemaining: game.finalRoundRemaining,
    finalRoundTriggeredBy: game.finalRoundTriggeredBy,
    log: game.log
  };
}

function buildPrivateState(room: ServerRoom, seat: StoredSeatRecord): SeatPrivateState | null {
  if (!room.game || !seat.playerId) {
    return null;
  }
  const player = room.game.players.find((entry) => entry.id === seat.playerId);
  if (!player) {
    return null;
  }
  return {
    seatId: seat.seatId,
    playerId: seat.playerId,
    hand: player.hand,
    tickets: player.tickets,
    pendingTickets: player.pendingTickets
  };
}

function buildRoomSummary(room: ServerRoom): RoomSummary {
  const activeSeatId =
    room.game === null
      ? null
      : room.seats.find((seat) => seat.playerId === room.game?.players[room.game.activePlayerIndex]?.id)?.seatId ?? null;

  return {
    roomCode: room.roomCode,
    status: room.status,
    hostSeatId: room.hostSeatId,
    playerCount: room.playerCount,
    configId: room.configId,
    configVersion: room.configVersion,
    configSummary: room.configSummary,
    mapName: room.mapName,
    turnTimeLimitSeconds: room.turnTimeLimitSeconds,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    activeSeatId,
    seats: room.seats.map<RoomSeatSummary>((seat) => ({
      seatId: seat.seatId,
      playerId: seat.playerId,
      playerName: seat.playerName,
      controllerType: seat.controllerType,
      ready: seat.ready,
      connected: seat.connected,
      isHost: seat.isHost
    }))
  };
}

function toStoredRecord(room: ServerRoom): StoredRoomRecord {
  return {
    roomCode: room.roomCode,
    status: room.status,
    hostSeatId: room.hostSeatId,
    playerCount: room.playerCount,
    configId: room.configId,
    configVersion: room.configVersion,
    configSummary: room.configSummary,
    mapName: room.mapName,
    turnTimeLimitSeconds: room.turnTimeLimitSeconds,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    deadlineAt: room.deadlineAt ? new Date(room.deadlineAt).toISOString() : null,
    snapshotVersion: room.snapshotVersion,
    game: room.game,
    seats: room.seats
  };
}

function fromStoredRecord(record: StoredRoomRecord): ServerRoom {
  return {
    ...record,
    deadlineAt: record.deadlineAt ? Date.parse(record.deadlineAt) : null
  };
}

function timedAutoDrawsRemaining(game: GameState): number {
  if (game.phase !== "main") {
    return 0;
  }

  if (game.turn.stage === "idle") {
    return 2;
  }

  if (game.turn.stage === "drawing" && game.turn.drawsTaken === 1 && !game.turn.tookFaceUpLocomotive) {
    return 1;
  }

  return 0;
}

function hasEnoughBlindCardsForTimedAutoDraw(game: GameState): boolean {
  return game.trainDeck.length + game.discardPile.length >= timedAutoDrawsRemaining(game);
}

export class RoomService {
  private readonly rooms = new Map<string, ServerRoom>();

  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly repository: RoomRepository,
    private readonly releasedConfigs: HudsonHustleReleasedConfigSummary[],
    private readonly onRoomChanged?: (roomCode: string) => void,
    private readonly onTimerChanged?: RoomTimerCallback
  ) {}

  listReleasedConfigs(): HudsonHustleReleasedConfigSummary[] {
    return this.releasedConfigs;
  }

  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    invariant(request.playerCount >= 2 && request.playerCount <= 4, "Rooms support 2-4 players.");
    invariant(request.turnTimeLimitSeconds >= 0, "Turn timer cannot be negative.");

    const bundle = getHudsonHustleReleasedConfigBundle(request.configId);
    invariant(bundle, "Unknown released config.");

    let roomCode = randomToken(6);
    while (this.rooms.has(roomCode) || (await this.repository.getRoom(roomCode))) {
      roomCode = randomToken(6);
    }

    const timestamp = nowIso();
    const hostSeat: StoredSeatRecord = {
      seatId: "seat-1",
      playerId: null,
      playerName: request.hostName.trim() || "Host",
      controllerType: "human",
      ready: false,
      connected: false,
      isHost: true,
      playerSecret: createPlayerSecret(),
      controllerState: createClientControllerState(),
      joinedAt: timestamp,
      updatedAt: timestamp
    };

    const seats: StoredSeatRecord[] = [hostSeat];
    for (let index = 2; index <= request.playerCount; index += 1) {
      seats.push({
        seatId: `seat-${index}`,
        playerId: null,
        playerName: null,
        controllerType: "human",
        ready: false,
        connected: false,
        isHost: false,
        playerSecret: null,
        controllerState: createClientControllerState(),
        joinedAt: timestamp,
        updatedAt: timestamp
      });
    }

    const room: ServerRoom = {
      roomCode,
      status: "lobby",
      hostSeatId: hostSeat.seatId,
      playerCount: request.playerCount,
      configId: bundle.configId,
      configVersion: bundle.meta.version,
      configSummary: bundle.meta.summary,
      mapName: bundle.map.name,
      turnTimeLimitSeconds: request.turnTimeLimitSeconds,
      createdAt: timestamp,
      updatedAt: timestamp,
      snapshotVersion: 0,
      game: null,
      seats,
      deadlineAt: null
    };

    await this.saveRoom(room);
    invariant(hostSeat.playerSecret, "Host seat is missing player credentials.", 500, "invalid_room_state");
    return {
      roomCode,
      seatId: hostSeat.seatId,
      playerSecret: hostSeat.playerSecret,
      snapshot: this.buildSnapshot(room, hostSeat.seatId)
    };
  }

  async joinRoom(roomCode: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "lobby", "The room has already started.");

    let targetSeat = null as StoredSeatRecord | null;
    if (request.preferredSeatId) {
      const preferredSeat = room.seats.find((seat) => seat.seatId === request.preferredSeatId);
      invariant(preferredSeat, "That seat does not exist.", 404, "seat_not_found");
      invariant(!preferredSeat.playerName, "That seat is already taken.", 409, "seat_taken");
      targetSeat = preferredSeat;
    } else {
      targetSeat = room.seats.find((seat) => !seat.playerName) ?? null;
    }

    invariant(targetSeat, "No open seats are left in this room.");

    const timestamp = nowIso();
    targetSeat.playerName = request.playerName.trim() || targetSeat.seatId;
    targetSeat.playerSecret = createPlayerSecret();
    targetSeat.controllerType = "human";
    targetSeat.controllerState = createClientControllerState();
    const currentHost = room.seats.find((seat) => seat.seatId === room.hostSeatId) ?? null;
    if (!currentHost?.playerName) {
      room.seats.forEach((seat) => {
        seat.isHost = seat.seatId === targetSeat.seatId;
      });
      room.hostSeatId = targetSeat.seatId;
    }
    targetSeat.updatedAt = timestamp;

    room.updatedAt = timestamp;
    await this.saveRoom(room);
    invariant(targetSeat.playerSecret, "Joined seat is missing player credentials.", 500, "invalid_room_state");
    return {
      roomCode: room.roomCode,
      seatId: targetSeat.seatId,
      playerSecret: targetSeat.playerSecret,
      snapshot: this.buildSnapshot(room, targetSeat.seatId)
    };
  }

  async assignBotSeat(roomCode: string, seatId: string, botName = "System Bot"): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "lobby", "Bot seats can only be assigned before the game starts.");
    const seat = room.seats.find((entry) => entry.seatId === seatId) ?? null;
    invariant(seat, "That seat does not exist.", 404, "seat_not_found");
    invariant(!seat.playerName, "That seat is already taken.", 409, "seat_taken");

    const timestamp = nowIso();
    seat.playerId = null;
    seat.playerName = botName.trim() || seat.seatId;
    seat.controllerType = "bot";
    seat.controllerState = createBotControllerState();
    seat.playerSecret = null;
    seat.ready = true;
    seat.connected = true;
    seat.updatedAt = timestamp;
    room.updatedAt = timestamp;

    await this.saveRoom(room);
    return this.buildSnapshot(room, null);
  }

  async rejoinRoom(roomCode: string, request: RejoinRoomRequest): Promise<RejoinRoomResponse> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = this.getAuthorizedSeat(room, request);
    invariant(seat.playerSecret, "Joined seat is missing player credentials.", 500, "invalid_room_state");
    return {
      roomCode: room.roomCode,
      seatId: seat.seatId,
      playerSecret: seat.playerSecret,
      snapshot: this.buildSnapshot(room, seat.seatId)
    };
  }

  async getSnapshot(roomCode: string, auth?: RoomAuth): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    if (!auth) {
      return this.buildSnapshot(room, null);
    }
    const seat = this.getAuthorizedSeat(room, auth);
    return this.buildSnapshot(room, seat.seatId);
  }

  async startRoom(roomCode: string, request: StartRoomRequest): Promise<StartRoomResponse> {
    const room = await this.getRoomOrThrow(roomCode);
    const hostSeat = this.getAuthorizedSeat(room, { seatId: room.hostSeatId, playerSecret: request.playerSecret });
    invariant(hostSeat.isHost, "Only the host can start the room.");
    invariant(room.status === "lobby", "The room is already running.");
    invariant(
      room.seats.every((seat) => seat.playerName && (!seatRequiresPlayerSecret(seat.controllerType) || seat.playerSecret)),
      "All seats must be filled before starting."
    );
    invariant(room.seats.every((seat) => seat.ready), "All players must be ready before starting.");

    const nextGame = startGame(getHudsonHustleMapByConfigId(room.configId), {
      playerNames: room.seats.map((seat) => seat.playerName ?? seat.seatId)
    });

    room.game = nextGame;
    room.status = "active";
    room.updatedAt = nowIso();
    room.seats.forEach((seat, index) => {
      seat.playerId = nextGame.players[index]?.id ?? null;
      seat.updatedAt = room.updatedAt;
    });

    this.scheduleTimer(room);
    await this.saveRoom(room);
    await this.runServerControlledTurns(room);
    return {
      snapshot: this.buildSnapshot(room, hostSeat.seatId)
    };
  }

  async setReady(roomCode: string, auth: RoomAuth, ready: boolean): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "lobby", "You can only change ready state in the lobby.");
    const seat = this.getAuthorizedSeat(room, auth);
    seat.ready = ready;
    seat.updatedAt = nowIso();
    room.updatedAt = seat.updatedAt;
    await this.saveRoom(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  async connectSeat(roomCode: string, auth: RoomAuth): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = this.getAuthorizedSeat(room, auth);
    seat.connected = true;
    seat.updatedAt = nowIso();
    room.updatedAt = seat.updatedAt;
    await this.saveRoom(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  async disconnectSeat(roomCode: string, seatId: string): Promise<void> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = room.seats.find((entry) => entry.seatId === seatId);
    if (!seat) {
      return;
    }
    seat.connected = false;
    seat.updatedAt = nowIso();
    room.updatedAt = seat.updatedAt;
    await this.saveRoom(room);
  }

  async leaveRoom(roomCode: string, auth: RoomAuth): Promise<void> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = this.getAuthorizedSeat(room, auth);

    if (room.status !== "lobby") {
      seat.connected = false;
      seat.updatedAt = nowIso();
      room.updatedAt = seat.updatedAt;
      await this.saveRoom(room);
      return;
    }

    const timestamp = nowIso();
    const nextHost =
      seat.isHost
        ? (room.seats.find((candidate) => candidate.seatId !== seat.seatId && candidate.playerName) ?? null)
        : null;

    if (seat.isHost) {
      if (nextHost) {
        seat.isHost = false;
        room.hostSeatId = nextHost.seatId;
        nextHost.isHost = true;
        nextHost.updatedAt = timestamp;
      } else {
        seat.isHost = false;
      }
    }

    seat.playerId = null;
    seat.playerName = null;
    seat.ready = false;
    seat.connected = false;
    seat.playerSecret = null;
    seat.controllerType = "human";
    seat.controllerState = createClientControllerState();
    seat.updatedAt = timestamp;
    room.updatedAt = timestamp;
    await this.saveRoom(room);
  }

  async applyAction(roomCode: string, auth: RoomAuth, payload: GameActionPayload): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "active", "The game has not started yet.");
    invariant(room.game, "Missing game state.");

    const seat = this.getAuthorizedSeat(room, auth);
    this.applySeatAction(room, seat, payload.action);
    await this.saveRoom(room);
    await this.runServerControlledTurns(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  private async handleTimeout(roomCode: string): Promise<void> {
    try {
      const room = await this.getRoomOrThrow(roomCode);
      if (!room.game || room.status !== "active") {
        return;
      }
      const autoDrawsRemaining = timedAutoDrawsRemaining(room.game);
      if (room.turnTimeLimitSeconds <= 0 || room.game.phase !== "main" || autoDrawsRemaining === 0) {
        return;
      }
      if (!hasEnoughBlindCardsForTimedAutoDraw(room.game)) {
        this.scheduleTimer(room);
        await this.saveRoom(room);
        return;
      }

      let nextGame = room.game;
      for (let index = 0; index < autoDrawsRemaining; index += 1) {
        nextGame = reduceGame(nextGame, { type: "draw_card", source: "deck" }, getHudsonHustleMapByConfigId(room.configId));
      }
      if (nextGame.turn.stage === "awaitingHandoff") {
        nextGame = reduceGame(nextGame, { type: "advance_turn" }, getHudsonHustleMapByConfigId(room.configId));
      }

      room.game = nextGame;
      room.updatedAt = nowIso();
      room.snapshotVersion += 1;
      this.scheduleTimer(room);
      await this.saveRoom(room);
    } catch {
      this.timeouts.delete(roomCode);
      this.onTimerChanged?.(roomCode, null);
    }
  }

  private async getRoomOrThrow(roomCode: string): Promise<ServerRoom> {
    let room = this.rooms.get(roomCode);
    if (!room) {
      const stored = await this.repository.getRoom(roomCode);
      if (stored) {
        room = fromStoredRecord(stored);
        this.rooms.set(roomCode, room);
        this.scheduleTimer(room, room.deadlineAt);
      }
    }
    invariant(room, "Unknown room code.", 404, "room_not_found");
    return room;
  }

  private getAuthorizedSeat(room: ServerRoom, auth: RoomAuth): StoredSeatRecord {
    const seat = room.seats.find((entry) => entry.seatId === auth.seatId);
    invariant(
      seat &&
        seat.controllerState.ownership === "client" &&
        seat.playerSecret &&
        seat.playerSecret === auth.playerSecret,
      "Room credentials do not match.",
      403,
      "invalid_credentials"
    );
    return seat;
  }

  private buildSnapshot(room: ServerRoom, seatId: string | null): RoomSnapshot {
    const roomSummary = buildRoomSummary(room);
    const seat = seatId ? room.seats.find((entry) => entry.seatId === seatId) ?? null : null;
    return {
      room: roomSummary,
      game: room.game ? buildPublicGameState(room.game) : null,
      privateState: seat ? buildPrivateState(room, seat) : null
    };
  }

  private async saveRoom(room: ServerRoom): Promise<void> {
    this.rooms.set(room.roomCode, room);
    await this.repository.saveRoom(toStoredRecord(room));
    this.onRoomChanged?.(room.roomCode);
  }

  private scheduleTimer(room: ServerRoom, requestedDeadlineAt: number | null = null): void {
    const existing = this.timeouts.get(room.roomCode);
    if (existing) {
      clearTimeout(existing);
      this.timeouts.delete(room.roomCode);
    }

    if (!room.game || room.status !== "active" || room.turnTimeLimitSeconds <= 0) {
      room.deadlineAt = null;
      this.onTimerChanged?.(room.roomCode, null);
      return;
    }

    if (room.game.phase !== "main" || timedAutoDrawsRemaining(room.game) === 0 || !hasEnoughBlindCardsForTimedAutoDraw(room.game)) {
      room.deadlineAt = null;
      this.onTimerChanged?.(room.roomCode, null);
      return;
    }

    const now = Date.now();
    if (requestedDeadlineAt !== null && requestedDeadlineAt <= now) {
      room.deadlineAt = requestedDeadlineAt;
      this.onTimerChanged?.(room.roomCode, room.deadlineAt);
      const timeout = setTimeout(() => {
        void this.handleTimeout(room.roomCode);
      }, 0);
      this.timeouts.set(room.roomCode, timeout);
      return;
    }

    room.deadlineAt = requestedDeadlineAt ?? now + room.turnTimeLimitSeconds * 1000;
    this.onTimerChanged?.(room.roomCode, room.deadlineAt);
    const timeout = setTimeout(() => {
      void this.handleTimeout(room.roomCode);
    }, Math.max(0, room.deadlineAt - now));
    this.timeouts.set(room.roomCode, timeout);
  }

  private applySeatAction(room: ServerRoom, seat: StoredSeatRecord, action: GameAction): void {
    invariant(room.status === "active", "The game has not started yet.");
    invariant(room.game, "Missing game state.");
    const previousGame = room.game;
    const previousDeadlineAt = room.deadlineAt;

    let gameForAction = room.game;
    if (action.type === "select_initial_tickets" && room.game.phase === "initialTickets") {
      const actingPlayerIndex = room.game.players.findIndex((player) => player.id === seat.playerId);
      invariant(actingPlayerIndex >= 0, "This seat is not attached to an active player.", 403, "invalid_credentials");
      invariant(room.game.players[actingPlayerIndex]?.pendingTickets.length === 4, "You do not have starting tickets to confirm right now.");
      if (actingPlayerIndex !== room.game.activePlayerIndex) {
        gameForAction = {
          ...room.game,
          activePlayerIndex: actingPlayerIndex
        };
      }
    } else {
      const activePlayer = getCurrentPlayer(room.game);
      invariant(seat.playerId === activePlayer.id, "It is not your turn.");
    }

    let nextGame = reduceGame(gameForAction, action, getHudsonHustleMapByConfigId(room.configId));
    if (nextGame.turn.stage === "awaitingHandoff") {
      nextGame = reduceGame(nextGame, { type: "advance_turn" }, getHudsonHustleMapByConfigId(room.configId));
    }

    room.game = nextGame;
    room.status = nextGame.phase === "gameOver" ? "finished" : room.status;
    room.updatedAt = nowIso();
    room.snapshotVersion += 1;
    const shouldPreserveDeadline =
      previousDeadlineAt !== null &&
      previousGame.phase === "main" &&
      nextGame.phase === "main" &&
      previousGame.activePlayerIndex === nextGame.activePlayerIndex;
    this.scheduleTimer(room, shouldPreserveDeadline ? previousDeadlineAt : null);
  }

  private getActiveSeat(room: ServerRoom): StoredSeatRecord | null {
    if (!room.game) {
      return null;
    }
    const activePlayer = room.game.players[room.game.activePlayerIndex] ?? null;
    if (!activePlayer) {
      return null;
    }
    return room.seats.find((seat) => seat.playerId === activePlayer.id) ?? null;
  }

  private getNextServerControlledAction(room: ServerRoom, seat: StoredSeatRecord): GameAction {
    invariant(room.game, "Missing game state.");
    const privateState = buildPrivateState(room, seat);
    invariant(privateState, "Server-controlled seat is missing private state.", 500, "invalid_room_state");

    return chooseBotAction({
      config: getHudsonHustleMapByConfigId(room.configId),
      game: buildPublicGameState(room.game),
      privateState
    });
  }

  private async runServerControlledTurns(room: ServerRoom): Promise<void> {
    for (let steps = 0; steps < 8; steps += 1) {
      if (room.status !== "active" || !room.game) {
        return;
      }

      const activeSeat = this.getActiveSeat(room);
      if (!activeSeat || activeSeat.controllerState.ownership !== "server") {
        return;
      }

      const action = this.getNextServerControlledAction(room, activeSeat);
      this.applySeatAction(room, activeSeat, action);
      await this.saveRoom(room);
    }

    throw new RoomServiceError("Server-controlled turn loop exceeded safety limit.", 500, "bot_loop_limit");
  }
}
