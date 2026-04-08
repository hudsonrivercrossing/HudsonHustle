import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  CreateRoomRequest,
  JoinRoomRequest,
  RejoinRoomRequest,
  ServerToClientEvents,
  StartRoomRequest
} from "@hudson-hustle/game-core";
import { hudsonHustleReleasedConfigs } from "@hudson-hustle/game-data";
import { readServerEnv } from "./env.js";
import { MemoryRoomRepository } from "./persistence/memory-room-repository.js";
import { PostgresRoomRepository } from "./persistence/postgres-room-repository.js";
import type { RoomRepository } from "./persistence/types.js";
import { RoomService, RoomServiceError } from "./room-service.js";

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

  if (configuredOrigins.length === 0) {
    return true;
  }

  return async (origin: string | undefined) => {
    return isOriginAllowed(rules, origin) ? origin ?? true : false;
  };
}

export function createSocketIoCorsOriginMatcher(configuredOrigins: string[]) {
  const rules = buildOriginRules(configuredOrigins);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    callback(null, configuredOrigins.length === 0 ? true : isOriginAllowed(rules, origin));
  };
}

function escapeRegexForPattern(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createServerApp() {
  const env = readServerEnv();
  const app = Fastify({ logger: true });
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
    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error." });
  });

  const repository: RoomRepository = env.databaseUrl ? new PostgresRoomRepository(env.databaseUrl) : new MemoryRoomRepository();

  let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  const seatConnectionCounts = new Map<string, number>();
  const roomDeadlines = new Map<string, number | null>();

  const roomService = new RoomService(
    repository,
    hudsonHustleReleasedConfigs,
    (roomCode) => {
      if (!io) {
        return;
      }
      void roomService.getSnapshot(roomCode).then((snapshot) => {
        io.to(roomCode).emit("room:update", snapshot.room);
        if (snapshot.game) {
          io.to(roomCode).emit("game:update:public", snapshot.game);
        }
        snapshot.room.seats.forEach((seat) => {
          void roomService.getSnapshot(roomCode, { seatId: seat.seatId, playerSecret: seatConnectionSecrets.get(`${roomCode}:${seat.seatId}`) ?? "" }).then((seatSnapshot) => {
            if (seatSnapshot.privateState) {
              io.to(`${roomCode}:${seat.seatId}`).emit("game:update:private", seatSnapshot.privateState);
            }
          }).catch(() => {
            io.to(`${roomCode}:${seat.seatId}`).emit("game:update:private", null);
          });
        });
      });
    },
    (roomCode, deadlineAt) => {
      roomDeadlines.set(roomCode, deadlineAt);
      if (!io) {
        return;
      }
      void roomService.getSnapshot(roomCode).then((snapshot) => {
        io.to(roomCode).emit("game:timer", {
          activeSeatId: snapshot.room.activeSeatId,
          deadlineAt,
          secondsRemaining: deadlineAt ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)) : null
        });
      });
    }
  );

  const seatConnectionSecrets = new Map<string, string>();

  app.get("/health", async () => ({
    ok: true,
    releasedConfigs: roomService.listReleasedConfigs().map((config) => config.configId)
  }));

  app.get("/released-configs", async () => roomService.listReleasedConfigs());

  app.post<{ Body: CreateRoomRequest }>("/rooms", async (request) => {
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

  app.get<{ Params: { roomCode: string }; Querystring: { seatId?: string; playerSecret?: string } }>("/rooms/:roomCode", async (request) => {
    const { seatId, playerSecret } = request.query;
    if (seatId && playerSecret) {
      return roomService.getSnapshot(request.params.roomCode, { seatId, playerSecret });
    }
    return roomService.getSnapshot(request.params.roomCode);
  });

  await app.ready();
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
    cors: {
      origin: socketIoCorsOriginMatcher,
      credentials: true
    }
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

    socket.on("room:subscribe", async (payload) => {
      try {
        const snapshot = await roomService.connectSeat(payload.roomCode, {
          seatId: payload.seatId,
          playerSecret: payload.playerSecret
        });

        authKey = `${payload.roomCode}:${payload.seatId}`;
        seatConnectionSecrets.set(authKey, payload.playerSecret);
        seatConnectionCounts.set(authKey, (seatConnectionCounts.get(authKey) ?? 0) + 1);
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
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not subscribe to the room."
        });
      }
    });

    socket.on("player:ready", async (payload) => {
      try {
        const snapshot = await roomService.setReady(
          payload.roomCode,
          { seatId: payload.seatId, playerSecret: payload.playerSecret },
          payload.ready
        );
        io.to(payload.roomCode).emit("room:update", snapshot.room);
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not update ready state."
        });
      }
    });

    socket.on("game:action", async (payload) => {
      try {
        await roomService.applyAction(
          payload.roomCode,
          { seatId: payload.seatId, playerSecret: payload.playerSecret },
          payload
        );
      } catch (error) {
        socket.emit("game:error", {
          message: error instanceof Error ? error.message : "Could not apply that action."
        });
      }
    });

    socket.on("disconnect", () => {
      if (!authKey) {
        return;
      }
      const remaining = Math.max(0, (seatConnectionCounts.get(authKey) ?? 1) - 1);
      if (remaining === 0) {
        seatConnectionCounts.delete(authKey);
        seatConnectionSecrets.delete(authKey);
        const [roomCode, seatId] = authKey.split(":");
        void roomService.disconnectSeat(roomCode, seatId);
      } else {
        seatConnectionCounts.set(authKey, remaining);
      }
    });
  });

  return { app, io, env };
}
