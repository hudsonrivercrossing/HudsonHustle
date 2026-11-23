import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  drawsRemaining,
  botDifficulties,
  chooseBotAction,
  type BotDifficulty,
  type ControllerType,
  type GameAction,
  type GameActionPayload,
  parseGameAction,
  playAction,
  toPrivateState,
  toPublicGameState,
  startGame,
  type CreateRoomRequest,
  type CreateRoomResponse,
  type GameState,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type PublicGameState,
  type RejoinRoomRequest,
  type RejoinRoomResponse,
  type RestartRoomRequest,
  type RestartRoomResponse,
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
import type {
  RoomRepository,
  StoredRoomRecord,
  StoredSeatRecord
} from "./persistence/types.js";

import { SystemTurnClock, type TurnClock } from "./turn-clock.js";

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

/** What a client presents: the seat it claims and the secret issued for it. */
interface SeatCredentials {
  seatId: string;
  playerSecret: string;
}

/**
 * Proof that a connection already presented valid credentials for a seat.
 * It carries the stored hash, not the secret, so it stops working the moment the seat
 * is given up or handed to someone else.
 */
export interface SeatSession {
  seatId: string;
  secretHash: string;
}

type RoomAuth = SeatCredentials | SeatSession;

function invariant(condition: unknown, message: string, statusCode = 400, code = "bad_request"): asserts condition {
  if (!condition) {
    throw new RoomServiceError(message, statusCode, code);
  }
}

const MAX_PLAYER_NAME_LENGTH = 24;
const MAX_TURN_TIME_LIMIT_SECONDS = 3600;

function assertPlayerName(value: unknown, label: string): asserts value is string {
  invariant(typeof value === "string" && value.length <= MAX_PLAYER_NAME_LENGTH, `${label} must be text of at most ${MAX_PLAYER_NAME_LENGTH} characters.`);
}

/** Actions a seat may send. Returning drawn tickets is refused because it would reveal three tickets for free. */
function parseClientAction(input: unknown): GameAction {
  let action: GameAction;
  try {
    action = parseGameAction(input);
  } catch (error) {
    throw new RoomServiceError(error instanceof Error ? error.message : "Invalid action.", 400, "invalid_action");
  }
  invariant(action.type !== "cancel_ticket_draw", "That action is not available in online play.", 400, "invalid_action");
  return action;
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

const SECRET_HASH_PREFIX = "sha256:";

/** Seat secrets are random 122-bit tokens, so a plain fast hash is enough: there is nothing to brute-force. */
function hashSecret(secret: string): string {
  return SECRET_HASH_PREFIX + createHash("sha256").update(secret).digest("hex");
}

function sameText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createClientControllerState() {
  return {
    ownership: "client",
    authStrategy: "player_secret"
  } as const;
}

function createBotControllerState(difficulty: BotDifficulty = "standard") {
  return {
    ownership: "server",
    controllerKey: "internal:bot",
    difficulty
  } as const;
}

function buildBotSeatIds(playerCount: number, requestedBotSeatIds: string[] | undefined): Set<string> {
  const allowedSeatIds = new Set(Array.from({ length: playerCount - 1 }, (_, index) => `seat-${index + 2}`));
  const botSeatIds = new Set<string>();
  for (const seatId of requestedBotSeatIds ?? []) {
    invariant(allowedSeatIds.has(seatId), `Invalid bot seat: ${seatId}.`, 400, "invalid_bot_seat");
    botSeatIds.add(seatId);
  }
  return botSeatIds;
}

function seatRequiresPlayerSecret(controllerType: ControllerType): boolean {
  return controllerType === "human" || controllerType === "human+agent";
}

function seatCanOwnHostPrivileges(seat: StoredSeatRecord | null): boolean {
  return Boolean(seat?.playerName && seat.controllerState.ownership === "client" && seat.playerSecret);
}

function buildPrivateState(room: ServerRoom, seat: StoredSeatRecord): SeatPrivateState | null {
  if (!room.game || !seat.playerId) {
    return null;
  }
  return toPrivateState(room.game, seat.playerId, seat.seatId);
}

function buildRoomSummary(room: ServerRoom): RoomSummary {
  const activeSeatId = getActiveSeatIdForGame(room, room.game);

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

function getActiveSeatIdForGame(room: ServerRoom, game: GameState | null): string | null {
  if (!game) {
    return null;
  }

  return room.seats.find((seat) => seat.playerId === game.players[game.activePlayerIndex]?.id)?.seatId ?? null;
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

function hasEnoughBlindCardsForTimedAutoDraw(game: GameState): boolean {
  return game.trainDeck.length + game.discardPile.length >= drawsRemaining(game);
}

export class RoomService {
  private readonly rooms = new Map<string, ServerRoom>();

  constructor(
    private readonly repository: RoomRepository,
    private readonly releasedConfigs: HudsonHustleReleasedConfigSummary[],
    private readonly onRoomChanged?: (roomCode: string) => void,
    private readonly onTimerChanged?: RoomTimerCallback,
    private readonly onError?: (context: string, error: unknown) => void,
    private readonly clock: TurnClock = new SystemTurnClock()
  ) {}

  /** The tail of each room's work queue. A room's requests run strictly one after another. */
  private readonly queues = new Map<string, Promise<unknown>>();

  private readonly lastUsedAt = new Map<string, number>();

  /**
   * Runs `task` once everything already queued for the room has finished.
   * Two requests for one room would otherwise interleave at every await: both could load
   * the room, both could mutate it, and their saves could overwrite each other.
   */
  private exclusive<T>(roomCode: string, task: () => Promise<T>): Promise<T> {
    this.lastUsedAt.set(roomCode, Date.now());
    const previous = this.queues.get(roomCode) ?? Promise.resolve();
    const run = previous.then(task, task);
    const tail = run.catch(() => undefined);
    this.queues.set(roomCode, tail);
    void tail.then(() => {
      if (this.queues.get(roomCode) === tail) {
        this.queues.delete(roomCode);
      }
    });
    return run;
  }

  /**
   * Forgets rooms nobody has touched for `idleMs` and nobody is connected to.
   * They stay in storage and load again on the next request. Returns the codes dropped.
   */
  evictIdleRooms(idleMs: number): string[] {
    const cutoff = Date.now() - idleMs;
    const evicted: string[] = [];
    for (const [roomCode, room] of this.rooms) {
      const busy = this.queues.has(roomCode) || room.seats.some((seat) => seat.connected && seat.controllerState.ownership === "client");
      if (busy || (this.lastUsedAt.get(roomCode) ?? 0) > cutoff) {
        continue;
      }
      this.clock.cancel(roomCode);
      this.rooms.delete(roomCode);
      this.lastUsedAt.delete(roomCode);
      evicted.push(roomCode);
    }
    return evicted;
  }

  /** Cancels every pending turn timer so the process can exit. */
  dispose(): void {
    for (const roomCode of this.rooms.keys()) {
      this.clock.cancel(roomCode);
    }
  }

  listReleasedConfigs(): HudsonHustleReleasedConfigSummary[] {
    return this.releasedConfigs;
  }

  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    invariant(typeof request === "object" && request !== null, "Room request is missing.");
    assertPlayerName(request.hostName, "Host name");
    invariant(Number.isInteger(request.playerCount) && request.playerCount >= 2 && request.playerCount <= 4, "Rooms support 2-4 players.");
    invariant(
      Number.isInteger(request.turnTimeLimitSeconds) &&
        request.turnTimeLimitSeconds >= 0 &&
        request.turnTimeLimitSeconds <= MAX_TURN_TIME_LIMIT_SECONDS,
      `Turn timer must be a whole number of seconds between 0 and ${MAX_TURN_TIME_LIMIT_SECONDS}.`
    );
    invariant(typeof request.configId === "string", "Unknown released config.");
    invariant(
      request.botSeatIds === undefined ||
        (Array.isArray(request.botSeatIds) && request.botSeatIds.every((seatId) => typeof seatId === "string")),
      "Bot seats must be a list of seat ids."
    );
    invariant(
      request.botDifficulty === undefined || (botDifficulties as readonly string[]).includes(request.botDifficulty),
      `Bot difficulty must be one of: ${botDifficulties.join(", ")}.`
    );

    const bundle = getHudsonHustleReleasedConfigBundle(request.configId);
    invariant(bundle, "Unknown released config.");

    let roomCode = randomToken(6);
    while (this.rooms.has(roomCode) || (await this.repository.getRoom(roomCode))) {
      roomCode = randomToken(6);
    }

    const timestamp = nowIso();
    const botSeatIds = buildBotSeatIds(request.playerCount, request.botSeatIds);
    const hostSecret = createPlayerSecret();
    const hostSeat: StoredSeatRecord = {
      seatId: "seat-1",
      playerId: null,
      playerName: request.hostName.trim() || "Host",
      controllerType: "human",
      ready: false,
      connected: false,
      isHost: true,
      playerSecret: hashSecret(hostSecret),
      controllerState: createClientControllerState(),
      joinedAt: timestamp,
      updatedAt: timestamp
    };

    const seats: StoredSeatRecord[] = [hostSeat];
    for (let index = 2; index <= request.playerCount; index += 1) {
      const seatId = `seat-${index}`;
      const isBotSeat = botSeatIds.has(seatId);
      seats.push({
        seatId,
        playerId: null,
        playerName: isBotSeat ? `Bot ${index - 1}` : null,
        controllerType: isBotSeat ? "bot" : "human",
        ready: isBotSeat,
        connected: isBotSeat,
        isHost: false,
        playerSecret: null,
        controllerState: isBotSeat ? createBotControllerState(request.botDifficulty) : createClientControllerState(),
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
    return {
      roomCode,
      seatId: hostSeat.seatId,
      playerSecret: hostSecret,
      snapshot: this.buildSnapshot(room, hostSeat.seatId)
    };
  }

  joinRoom(roomCode: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
    return this.exclusive(roomCode, () => this.joinRoomNow(roomCode, request));
  }

  private async joinRoomNow(roomCode: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
    invariant(typeof request === "object" && request !== null, "Join request is missing.");
    assertPlayerName(request.playerName, "Player name");
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
    const issuedSecret = createPlayerSecret();
    targetSeat.playerSecret = hashSecret(issuedSecret);
    targetSeat.controllerType = "human";
    targetSeat.controllerState = createClientControllerState();
    const currentHost = room.seats.find((seat) => seat.seatId === room.hostSeatId) ?? null;
    if (!seatCanOwnHostPrivileges(currentHost)) {
      room.seats.forEach((seat) => {
        seat.isHost = seat.seatId === targetSeat.seatId;
      });
      room.hostSeatId = targetSeat.seatId;
    }
    targetSeat.updatedAt = timestamp;

    room.updatedAt = timestamp;
    await this.saveRoom(room);
    return {
      roomCode: room.roomCode,
      seatId: targetSeat.seatId,
      playerSecret: issuedSecret,
      snapshot: this.buildSnapshot(room, targetSeat.seatId)
    };
  }

  assignBotSeat(roomCode: string, seatId: string, botName = "System Bot"): Promise<RoomSnapshot> {
    return this.exclusive(roomCode, () => this.assignBotSeatNow(roomCode, seatId, botName));
  }

  private async assignBotSeatNow(roomCode: string, seatId: string, botName = "System Bot"): Promise<RoomSnapshot> {
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

  rejoinRoom(roomCode: string, request: RejoinRoomRequest): Promise<RejoinRoomResponse> {
    return this.exclusive(roomCode, () => this.rejoinRoomNow(roomCode, request));
  }

  private async rejoinRoomNow(roomCode: string, request: RejoinRoomRequest): Promise<RejoinRoomResponse> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = this.getAuthorizedSeat(room, request);
    return {
      roomCode: room.roomCode,
      seatId: seat.seatId,
      // The server no longer knows the secret; the client keeps using the one it just proved.
      playerSecret: request.playerSecret,
      snapshot: this.buildSnapshot(room, seat.seatId)
    };
  }

  /** Checks credentials once and returns a session the connection can act with from then on. */
  openSeatSession(roomCode: string, credentials: SeatCredentials): Promise<SeatSession> {
    return this.exclusive(roomCode, async () => {
      const seat = this.getAuthorizedSeat(await this.getRoomOrThrow(roomCode), credentials);
      return { seatId: seat.seatId, secretHash: seat.playerSecret as string };
    });
  }

  getSnapshot(roomCode: string, auth?: RoomAuth): Promise<RoomSnapshot> {
    return this.exclusive(roomCode, () => this.getSnapshotNow(roomCode, auth));
  }

  private async getSnapshotNow(roomCode: string, auth?: RoomAuth): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    if (!auth) {
      return this.buildSnapshot(room, null);
    }
    const seat = this.getAuthorizedSeat(room, auth);
    return this.buildSnapshot(room, seat.seatId);
  }

  /**
   * Every seated player's private state, for the server's own broadcasts.
   * Unauthenticated on purpose: never return this to a client.
   */
  getPrivateStates(roomCode: string): Promise<SeatPrivateState[]> {
    return this.exclusive(roomCode, () => this.getPrivateStatesNow(roomCode));
  }

  private async getPrivateStatesNow(roomCode: string): Promise<SeatPrivateState[]> {
    const room = await this.getRoomOrThrow(roomCode);
    return room.seats.flatMap((seat) => buildPrivateState(room, seat) ?? []);
  }

  startRoom(roomCode: string, request: StartRoomRequest): Promise<StartRoomResponse> {
    return this.exclusive(roomCode, () => this.startRoomNow(roomCode, request));
  }

  private async startRoomNow(roomCode: string, request: StartRoomRequest): Promise<StartRoomResponse> {
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

  restartRoom(roomCode: string, request: RestartRoomRequest): Promise<RestartRoomResponse> {
    return this.exclusive(roomCode, () => this.restartRoomNow(roomCode, request));
  }

  private async restartRoomNow(roomCode: string, request: RestartRoomRequest): Promise<RestartRoomResponse> {
    const room = await this.getRoomOrThrow(roomCode);
    const hostSeat = this.getAuthorizedSeat(room, { seatId: room.hostSeatId, playerSecret: request.playerSecret });
    invariant(hostSeat.isHost, "Only the host can restart the room.");
    invariant(room.status === "finished" || room.game?.phase === "gameOver", "The game is not finished yet.");
    invariant(
      room.seats.every((seat) => seat.playerName && (!seatRequiresPlayerSecret(seat.controllerType) || seat.playerSecret)),
      "All seats must be filled before restarting."
    );

    const nextGame = startGame(getHudsonHustleMapByConfigId(room.configId), {
      playerNames: room.seats.map((seat) => seat.playerName ?? seat.seatId)
    });

    room.snapshotVersion = 0;
    room.game = nextGame;
    room.status = "active";
    room.updatedAt = nowIso();
    room.seats.forEach((seat, index) => {
      seat.playerId = nextGame.players[index]?.id ?? null;
      seat.ready = true;
      seat.updatedAt = room.updatedAt;
    });

    this.scheduleTimer(room);
    await this.saveRoom(room);
    await this.runServerControlledTurns(room);
    return {
      snapshot: this.buildSnapshot(room, hostSeat.seatId)
    };
  }

  setReady(roomCode: string, auth: RoomAuth, ready: boolean): Promise<RoomSnapshot> {
    return this.exclusive(roomCode, () => this.setReadyNow(roomCode, auth, ready));
  }

  private async setReadyNow(roomCode: string, auth: RoomAuth, ready: boolean): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "lobby", "You can only change ready state in the lobby.");
    const seat = this.getAuthorizedSeat(room, auth);
    seat.ready = ready;
    seat.updatedAt = nowIso();
    room.updatedAt = seat.updatedAt;
    await this.saveRoom(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  connectSeat(roomCode: string, auth: RoomAuth): Promise<RoomSnapshot> {
    return this.exclusive(roomCode, () => this.connectSeatNow(roomCode, auth));
  }

  private async connectSeatNow(roomCode: string, auth: RoomAuth): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    const seat = this.getAuthorizedSeat(room, auth);
    seat.connected = true;
    seat.updatedAt = nowIso();
    room.updatedAt = seat.updatedAt;
    await this.saveRoom(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  disconnectSeat(roomCode: string, seatId: string): Promise<void> {
    return this.exclusive(roomCode, () => this.disconnectSeatNow(roomCode, seatId));
  }

  private async disconnectSeatNow(roomCode: string, seatId: string): Promise<void> {
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

  leaveRoom(roomCode: string, auth: RoomAuth): Promise<void> {
    return this.exclusive(roomCode, () => this.leaveRoomNow(roomCode, auth));
  }

  private async leaveRoomNow(roomCode: string, auth: RoomAuth): Promise<void> {
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
        ? (room.seats.find((candidate) => candidate.seatId !== seat.seatId && seatCanOwnHostPrivileges(candidate)) ?? null)
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

  applyAction(roomCode: string, auth: RoomAuth, payload: GameActionPayload): Promise<RoomSnapshot> {
    return this.exclusive(roomCode, () => this.applyActionNow(roomCode, auth, payload));
  }

  private async applyActionNow(roomCode: string, auth: RoomAuth, payload: GameActionPayload): Promise<RoomSnapshot> {
    const room = await this.getRoomOrThrow(roomCode);
    invariant(room.status === "active", "The game has not started yet.");
    invariant(room.game, "Missing game state.");

    const seat = this.getAuthorizedSeat(room, auth);
    const action = parseClientAction(payload?.action);
    this.applySeatAction(room, seat, action);
    await this.saveRoom(room);
    await this.runServerControlledTurns(room);
    return this.buildSnapshot(room, seat.seatId);
  }

  private handleTimeout(roomCode: string): Promise<void> {
    return this.exclusive(roomCode, () => this.handleTimeoutNow(roomCode));
  }

  private async handleTimeoutNow(roomCode: string): Promise<void> {
    try {
      const room = await this.getRoomOrThrow(roomCode);
      if (!room.game || room.status !== "active") {
        return;
      }
      const actingSeat = this.getActiveSeat(room);
      if (!actingSeat) {
        return;
      }
      const autoDrawsRemaining = drawsRemaining(room.game);
      if (room.turnTimeLimitSeconds <= 0 || autoDrawsRemaining === 0 || !actingSeat.playerId) {
        return;
      }
      if (!hasEnoughBlindCardsForTimedAutoDraw(room.game)) {
        this.scheduleTimer(room);
        await this.saveRoom(room);
        return;
      }

      // Out of time: the seat takes its remaining cards blind, which ends the turn.
      const config = getHudsonHustleMapByConfigId(room.configId);
      let nextGame = room.game;
      for (let index = 0; index < autoDrawsRemaining; index += 1) {
        nextGame = playAction(nextGame, actingSeat.playerId, { type: "draw_card", source: "deck" }, config);
      }
      this.commitGame(room, nextGame, null);
      await this.saveRoom(room);
      await this.resumeServerControlledTurnsIfNeeded(room);
    } catch (error) {
      this.onError?.(`Turn timer for room ${roomCode} failed`, error);
      this.clock.cancel(roomCode);
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
        const activeSeat = this.getActiveSeat(room);
        if (activeSeat?.controllerState.ownership === "server") {
          await this.resumeServerControlledTurnsIfNeeded(room);
        } else {
          this.scheduleTimer(room, room.deadlineAt);
        }
      }
    }
    invariant(room, "Unknown room code.", 404, "room_not_found");
    return room;
  }

  private getAuthorizedSeat(room: ServerRoom, auth: RoomAuth): StoredSeatRecord {
    const seat = room.seats.find((entry) => entry.seatId === auth?.seatId);
    const stored = seat?.controllerState.ownership === "client" ? seat.playerSecret : null;
    let authorized = false;
    if (seat && stored) {
      if ("secretHash" in auth) {
        authorized = typeof auth.secretHash === "string" && sameText(stored, auth.secretHash);
      } else if (typeof auth.playerSecret === "string" && auth.playerSecret.length > 0) {
        if (stored.startsWith(SECRET_HASH_PREFIX)) {
          authorized = sameText(stored, hashSecret(auth.playerSecret));
        } else if (sameText(stored, auth.playerSecret)) {
          // Saved by a server that kept secrets as issued: accept it once and hash it from here on.
          seat.playerSecret = hashSecret(auth.playerSecret);
          authorized = true;
        }
      }
    }
    invariant(seat && authorized, "Room credentials do not match.", 403, "invalid_credentials");
    return seat;
  }

  private buildSnapshot(room: ServerRoom, seatId: string | null): RoomSnapshot {
    const roomSummary = buildRoomSummary(room);
    const seat = seatId ? room.seats.find((entry) => entry.seatId === seatId) ?? null : null;
    return {
      room: roomSummary,
      game: room.game ? toPublicGameState(room.game) : null,
      privateState: seat ? buildPrivateState(room, seat) : null
    };
  }

  private async saveRoom(room: ServerRoom): Promise<void> {
    this.rooms.set(room.roomCode, room);
    await this.repository.saveRoom(toStoredRecord(room));
    this.onRoomChanged?.(room.roomCode);
  }

  /**
   * Starts the turn timer for whoever is to move, or stops it when no timed move is due. A deadline
   * is passed in to keep one that is already running, e.g. after the first of a turn's two draws.
   */
  private scheduleTimer(room: ServerRoom, requestedDeadlineAt: number | null = null): void {
    this.clock.cancel(room.roomCode);

    const timed = room.game && room.status === "active" && room.turnTimeLimitSeconds > 0;
    if (!timed || !room.game || drawsRemaining(room.game) === 0 || !hasEnoughBlindCardsForTimedAutoDraw(room.game)) {
      room.deadlineAt = null;
      this.onTimerChanged?.(room.roomCode, null);
      return;
    }

    room.deadlineAt = requestedDeadlineAt ?? this.clock.now() + room.turnTimeLimitSeconds * 1000;
    this.onTimerChanged?.(room.roomCode, room.deadlineAt);
    this.clock.arm(room.roomCode, room.deadlineAt, () => void this.handleTimeout(room.roomCode));
  }

  /** Makes `nextGame` the room's game: the one place the room's status, version and timer follow the game. */
  private commitGame(room: ServerRoom, nextGame: GameState, keepDeadlineAt: number | null): void {
    room.game = nextGame;
    room.status = nextGame.phase === "gameOver" ? "finished" : room.status;
    room.updatedAt = nowIso();
    room.snapshotVersion += 1;
    this.scheduleTimer(room, keepDeadlineAt);
  }

  private applySeatAction(room: ServerRoom, seat: StoredSeatRecord, action: GameAction): void {
    invariant(room.status === "active", "The game has not started yet.");
    invariant(room.game, "Missing game state.");
    invariant(seat.playerId, "This seat is not attached to an active player.", 403, "invalid_credentials");
    const previousGame = room.game;

    let nextGame: GameState;
    try {
      nextGame = playAction(previousGame, seat.playerId, action, getHudsonHustleMapByConfigId(room.configId));
    } catch (error) {
      // A move the rules refuse is the player's mistake, not a server fault.
      throw new RoomServiceError(error instanceof Error ? error.message : "That move is not allowed.", 400, "bad_request");
    }

    // A turn's deadline covers the whole turn: the first of two draws does not restart it.
    const sameTurn = previousGame.phase === "main" && nextGame.phase === "main" && previousGame.activePlayerIndex === nextGame.activePlayerIndex;
    this.commitGame(room, nextGame, sameTurn ? room.deadlineAt : null);
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
      game: toPublicGameState(room.game),
      privateState,
      difficulty: seat.controllerState.ownership === "server" ? seat.controllerState.difficulty : undefined
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

      this.applySeatAction(room, activeSeat, this.getNextServerControlledAction(room, activeSeat));
      await this.saveRoom(room);
    }

    throw new RoomServiceError("Server-controlled turn loop exceeded safety limit.", 500, "bot_loop_limit");
  }

  private async resumeServerControlledTurnsIfNeeded(room: ServerRoom): Promise<void> {
    if (room.status !== "active" || !room.game) {
      return;
    }

    const activeSeat = this.getActiveSeat(room);
    if (!activeSeat || activeSeat.controllerState.ownership !== "server") {
      return;
    }

    room.deadlineAt = null;
    this.onTimerChanged?.(room.roomCode, null);
    await this.runServerControlledTurns(room);
  }
}
