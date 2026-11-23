import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import type {
  ChatMessage,
  ClientToServerEvents,
  CreateRoomRequest,
  JoinRoomRequest,
  RejoinRoomRequest,
  RestartRoomRequest,
  ServerToClientEvents,
  StartRoomRequest
} from "@hudson-hustle/game-core";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { readServerEnv } from "./env.js";
import { MemoryRoomRepository } from "./persistence/memory-room-repository.js";
import { PostgresRoomRepository } from "./persistence/postgres-room-repository.js";
import type { RoomRepository } from "./persistence/types.js";
import { RoomService, RoomServiceError, type SeatSession } from "./room-service.js";

interface OriginRules {
  exactOrigins: string[];
  wildcardOrigins: RegExp[];
}

function buildOriginRules(configuredOrigins: string[]): OriginRules {
  return {
    exactOrigins: configuredOrigins.filter((origin) => !origin.includes("*")),
    wildcardOrigins: configuredOrigins
      .filter((origin) => origin.includes("*"))
      .map((pattern) => new RegExp(`^${pattern.split("*").map(escapeRegexForPattern).join(".*")}$`))
  };
}

function isOriginAllowed(rules: OriginRules, origin: string | undefined) {
  if (!origin) {
    return true;
  }

  return rules.exactOrigins.includes(origin) || rules.wildcardOrigins.some((pattern) => pattern.test(origin));
}

export function createCorsOriginMatcher(configuredOrigins: string[]) {
  const rules = buildOriginRules(configuredOrigins);

  // An empty list allows no browser origin at all. It used to allow every origin, which made a
  // missing setting silently open the API to any website.
  return async (origin: string | undefined) => {
    return isOriginAllowed(rules, origin) ? origin ?? true : false;
  };
}

export function createSocketIoCorsOriginMatcher(configuredOrigins: string[]) {
  const rules = buildOriginRules(configuredOrigins);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    callback(null, isOriginAllowed(rules, origin));
  };
}

function escapeRegexForPattern(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Every request this server accepts is a few short fields; anything larger is not a client of ours. */
const MAX_REQUEST_BYTES = 16 * 1024;
const ROOM_IDLE_MS = 60 * 60 * 1000;
const ROOM_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Allows `limit` events per `windowMs` for each key, in memory.
 * Enough to stop one client from flooding room creation or a socket; not a defence against a distributed attack.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, { startedAt: number; count: number }>();
  return {
    allow(key: string, now = Date.now()): boolean {
      const current = windows.get(key);
      if (!current || now - current.startedAt >= windowMs) {
        windows.set(key, { startedAt: now, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
    forget(key: string): void {
      windows.delete(key);
    },
    sweep(now = Date.now()): void {
      for (const [key, window] of windows) {
        if (now - window.startedAt >= windowMs) {
          windows.delete(key);
        }
      }
    }
  };
}

export async function createServerApp() {
  const env = readServerEnv();
  const app = Fastify({ logger: true, bodyLimit: MAX_REQUEST_BYTES });
  const corsOrigins = env.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOriginMatcher = createCorsOriginMatcher(corsOrigins);
  const socketIoCorsOriginMatcher = createSocketIoCorsOriginMatcher(corsOrigins);

  await app.register(cors, {
    origin: corsOriginMatcher,
    credentials: true
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof RoomServiceError) {
      return reply.status(error.statusCode).send({ message: error.message, code: error.code });
    }
    // Fastify's own request errors (body too large, malformed JSON) are the client's fault, not ours.
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({ message: error instanceof Error ? error.message : "Bad request.", code: "bad_request" });
    }
    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error." });
  });

  const repository: RoomRepository = env.databaseUrl ? new PostgresRoomRepository(env.databaseUrl) : new MemoryRoomRepository();
  if (repository instanceof PostgresRoomRepository) {
    // Fail the boot, not the first request: a deploy whose migration cannot run must never start
    // answering health checks, so the platform keeps the previous version serving.
    await repository.whenReady();
  }

  let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  const seatConnectionCounts = new Map<string, number>();
  const roomDeadlines = new Map<string, number | null>();
  const roomChatMessages = new Map<string, ChatMessage[]>();

  const roomService = new RoomService(
    repository,
    hudsonHustleReleasedConfigs,
    (roomCode) => {
      if (!io) {
        return;
      }
      const reportBroadcastFailure = (error: unknown) => app.log.error({ err: error, roomCode }, "Could not broadcast room update");
      void roomService
        .getSnapshot(roomCode)
        .then((snapshot) => {
          io.to(roomCode).emit("room:update", snapshot.room);
          if (snapshot.game) {
            io.to(roomCode).emit("game:update:public", snapshot.game);
          }
        })
        .catch(reportBroadcastFailure);
      // Each seat's sockets share a private channel; only they receive that seat's hand and tickets.
      void roomService
        .getPrivateStates(roomCode)
        .then((privateStates) => {
          privateStates.forEach((privateState) => {
            io.to(`${roomCode}:${privateState.seatId}`).emit("game:update:private", privateState);
          });
        })
        .catch(reportBroadcastFailure);
    },
    (roomCode, deadlineAt) => {
      roomDeadlines.set(roomCode, deadlineAt);
      if (!io) {
        return;
      }
      void roomService
        .getSnapshot(roomCode)
        .then((snapshot) => {
          io.to(roomCode).emit("game:timer", {
            activeSeatId: snapshot.room.activeSeatId,
            deadlineAt,
            secondsRemaining: deadlineAt ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)) : null
          });
        })
        .catch((error: unknown) => app.log.error({ err: error, roomCode }, "Could not broadcast timer update"));
    },
    (context, error) => app.log.error({ err: error }, context)
  );

  const roomCreationLimiter = createRateLimiter(env.roomCreateLimitPerMinute, 60_000);
  const socketEventLimiter = createRateLimiter(40, 10_000);


  app.get("/health", async () => ({
    ok: true,
    releasedConfigs: roomService.listReleasedConfigs().map((config) => config.configId)
  }));

  app.get("/released-configs", async () => roomService.listReleasedConfigs());

  app.post<{ Body: CreateRoomRequest }>("/rooms", async (request) => {
    if (!roomCreationLimiter.allow(request.ip)) {
      throw new RoomServiceError("Too many rooms created from this address. Try again in a minute.", 429, "rate_limited");
    }
    return roomService.createRoom(request.body);
  });

  app.post<{ Params: { roomCode: string }; Body: JoinRoomRequest }>("/rooms/:roomCode/join", async (request) => {
    return roomService.joinRoom(request.params.roomCode, request.body);
  });

  app.post<{ Params: { roomCode: string }; Body: RejoinRoomRequest }>("/rooms/:roomCode/rejoin", async (request) => {
    return roomService.rejoinRoom(request.params.roomCode, request.body);
  });

  app.post<{ Params: { roomCode: string }; Body: { seatId: string; playerSecret: string } }>("/rooms/:roomCode/leave", async (request) => {
    await roomService.leaveRoom(request.params.roomCode, request.body);
    return { ok: true };
  });

  app.post<{ Params: { roomCode: string }; Body: StartRoomRequest }>("/rooms/:roomCode/start", async (request) => {
    return roomService.startRoom(request.params.roomCode, request.body);
  });

  app.post<{ Params: { roomCode: string }; Body: RestartRoomRequest }>("/rooms/:roomCode/restart", async (request) => {
    return roomService.restartRoom(request.params.roomCode, request.body);
  });

  app.get<{ Params: { roomCode: string } }>("/rooms/:roomCode", async (request) => {
    return roomService.getSnapshot(request.params.roomCode);
  });

  // A seat's own view. Credentials travel in the body: query strings end up in access logs.
  app.post<{ Params: { roomCode: string }; Body: { seatId?: string; playerSecret?: string } }>("/rooms/:roomCode/snapshot", async (request) => {
    const { seatId, playerSecret } = request.body ?? {};
    if (!seatId || !playerSecret) {
      throw new RoomServiceError("A seat snapshot requires room credentials.", 400, "missing_credentials");
    }
    return roomService.getSnapshot(request.params.roomCode, { seatId, playerSecret });
  });

  app.post<{ Params: { roomCode: string }; Body: { seatId?: string; playerSecret?: string } }>("/rooms/:roomCode/history", async (request) => {
    const { seatId, playerSecret } = request.body ?? {};
    if (!seatId || !playerSecret) {
      throw new RoomServiceError("History review requires room credentials.", 400, "missing_credentials");
    }
    return roomService.getReviewHistory(request.params.roomCode, { seatId, playerSecret });
  });

  await app.ready();
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
    cors: {
      origin: socketIoCorsOriginMatcher,
      credentials: true
    },
    maxHttpBufferSize: MAX_REQUEST_BYTES
  });

  io.engine.on("connection_error", (error) => {
    app.log.warn(
      {
        code: error.code,
        message: error.message,
        context: error.context,
        req: {
          url: error.req?.url,
          origin: error.req?.headers.origin,
          host: error.req?.headers.host
        }
      },
      "Engine.IO connection error"
    );
  });

  io.on("connection", (socket) => {
    let authKey: string | null = null;
    /** Set once `room:subscribe` has verified this connection's credentials. */
    let seat: { roomCode: string; session: SeatSession } | null = null;

    function requireSeat() {
      if (!seat) {
        throw new RoomServiceError("Join the room before sending this.", 403, "not_subscribed");
      }
      return seat;
    }

    socket.use((_packet, next) => {
      if (socketEventLimiter.allow(socket.id)) {
        next();
        return;
      }
      socket.emit("game:error", { message: "You are sending too fast. Wait a moment and try again." });
    });

    /** Releases this socket's hold on its seat; the seat goes offline when its last socket lets go. */
    function releaseSeat() {
      if (!authKey) {
        return;
      }
      const remaining = Math.max(0, (seatConnectionCounts.get(authKey) ?? 1) - 1);
      if (remaining === 0) {
        seatConnectionCounts.delete(authKey);
        const [roomCode, seatId] = authKey.split(":");
        void roomService
          .disconnectSeat(roomCode, seatId)
          .catch((error: unknown) => app.log.error({ err: error, roomCode }, "Could not mark seat disconnected"));
      } else {
        seatConnectionCounts.set(authKey, remaining);
      }
      authKey = null;
      seat = null;
    }

    socket.on("room:subscribe", async (payload) => {
      try {
        const session = await roomService.openSeatSession(payload.roomCode, {
          seatId: payload.seatId,
          playerSecret: payload.playerSecret
        });
        const snapshot = await roomService.connectSeat(payload.roomCode, session);

        // A socket holds one seat at a time. Subscribing again must not count it twice,
        // or the seat would stay "connected" after the socket is gone.
        const nextAuthKey = `${payload.roomCode}:${payload.seatId}`;
        if (authKey !== nextAuthKey) {
          if (authKey) {
            const previousAuthKey = authKey;
            releaseSeat();
            await socket.leave(previousAuthKey);
            await socket.leave(previousAuthKey.split(":")[0]);
          }
          authKey = nextAuthKey;
          seatConnectionCounts.set(authKey, (seatConnectionCounts.get(authKey) ?? 0) + 1);
        }
        seat = { roomCode: payload.roomCode, session };
        socket.join(payload.roomCode);
        socket.join(authKey);
        socket.emit("game:reconnected", snapshot);
        socket.emit("room:update", snapshot.room);
        if (snapshot.game) {
          socket.emit("game:update:public", snapshot.game);
        }
        socket.emit("game:update:private", snapshot.privateState);
        socket.emit("game:timer", {
          activeSeatId: snapshot.room.activeSeatId,
          deadlineAt: roomDeadlines.get(payload.roomCode) ?? null,
          secondsRemaining:
            roomDeadlines.get(payload.roomCode) != null
              ? Math.max(0, Math.ceil(((roomDeadlines.get(payload.roomCode) ?? 0) - Date.now()) / 1000))
              : null
        });
        socket.emit("chat:update", roomChatMessages.get(payload.roomCode) ?? []);
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not subscribe to the room."
        });
      }
    });

    socket.on("player:ready", async (payload) => {
      try {
        const { roomCode, session } = requireSeat();
        const snapshot = await roomService.setReady(roomCode, session, payload?.ready === true);
        io.to(roomCode).emit("room:update", snapshot.room);
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not update ready state."
        });
      }
    });

    socket.on("game:action", async (payload) => {
      try {
        const { roomCode, session } = requireSeat();
        await roomService.applyAction(roomCode, session, payload);
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not apply that action."
        });
      }
    });

    socket.on("chat:message", async (payload) => {
      try {
        if (typeof payload?.message !== "string") {
          return;
        }
        const message = payload.message.trim().slice(0, 280);
        if (!message) {
          return;
        }
        const { roomCode, session } = requireSeat();
        const snapshot = await roomService.getSnapshot(roomCode, session);
        const sender = snapshot.room.seats.find((entry) => entry.seatId === session.seatId);
        const nextMessage: ChatMessage = {
          id: `${Date.now()}-${session.seatId}-${Math.random().toString(36).slice(2, 8)}`,
          seatId: session.seatId,
          playerName: sender?.playerName ?? "Player",
          message,
          createdAt: new Date().toISOString()
        };
        const nextMessages = [...(roomChatMessages.get(roomCode) ?? []), nextMessage].slice(-50);
        roomChatMessages.set(roomCode, nextMessages);
        io.to(roomCode).emit("chat:update", nextMessages);
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not send chat message."
        });
      }
    });

    socket.on("disconnect", () => {
      socketEventLimiter.forget(socket.id);
      releaseSeat();
    });
  });

  // Rooms nobody is using leave memory; with them go their chat and timer bookkeeping.
  const sweep = setInterval(() => {
    for (const roomCode of roomService.evictIdleRooms(ROOM_IDLE_MS)) {
      roomChatMessages.delete(roomCode);
      roomDeadlines.delete(roomCode);
    }
    roomCreationLimiter.sweep();
    socketEventLimiter.sweep();
  }, ROOM_SWEEP_INTERVAL_MS);
  sweep.unref();

  /** Stops accepting work and releases timers, sockets and the database connection. */
  async function close(): Promise<void> {
    clearInterval(sweep);
    roomService.dispose();
    await io.close();
    await app.close();
    if (repository instanceof PostgresRoomRepository) {
      await repository.close();
    }
  }

  return { app, io, env, roomService, close };
}
