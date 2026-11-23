import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  ClientToServerEvents,
  CreateRoomRequest,
  CreateRoomResponse,
  GameAction,
  JoinRoomRequest,
  JoinRoomResponse,
  ReconnectState,
  RejoinRoomRequest,
  RejoinRoomResponse,
  RestartRoomRequest,
  RestartRoomResponse,
  RoomSnapshot,
  ServerToClientEvents,
  StartRoomRequest,
  TimerUpdate
} from "@hudson-hustle/game-core";
import { hudsonHustleReleasedConfigs, type HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { encodeReconnectToken, readReconnectCredentials, type ReconnectCredentials } from "../../reconnect-token";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const wsUrl = import.meta.env.VITE_WS_URL ?? apiBaseUrl;
const sessionKey = "hudson-hustle-multiplayer-session-v2";
const HANDSHAKE_TIMEOUT_MS = 8000;

export type RealtimeStatus = "idle" | "connecting" | "subscribed" | "failed";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readSession(): ReconnectCredentials | null {
  const raw = window.localStorage.getItem(sessionKey);
  const credentials = readReconnectCredentials(raw);
  if (!raw || !credentials || raw.trim().startsWith("hh1.")) {
    return credentials;
  }

  window.localStorage.setItem(sessionKey, encodeReconnectToken(credentials));
  return credentials;
}

function saveSession(credentials: ReconnectCredentials | null): void {
  if (!credentials) {
    window.localStorage.removeItem(sessionKey);
    return;
  }
  window.localStorage.setItem(sessionKey, encodeReconnectToken(credentials));
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(payload?.message ?? `Request failed: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

interface UseOnlineRoomOptions {
  /** Try to rejoin the room saved in this browser when the app opens. */
  reconnectOnMount: boolean;
  /** Called with messages the player should see even if no error surface is on screen. */
  onNotice?: (message: string, tone: "warning" | "success") => void;
}

/** One browser's seat in an online room: the saved session, the HTTP calls and the live socket. */
export function useOnlineRoom({ reconnectOnMount, onNotice }: UseOnlineRoomOptions) {
  const [releasedConfigs, setReleasedConfigs] = useState<HudsonHustleReleasedConfigSummary[]>(hudsonHustleReleasedConfigs);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [credentials, setCredentials] = useState<ReconnectCredentials | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomSnapshot["room"] | null>(null);
  const [reconnectState, setReconnectState] = useState<ReconnectState>(() =>
    reconnectOnMount && readSession() ? "attempting-reconnect" : "fresh"
  );
  const [error, setError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [timer, setTimer] = useState<TimerUpdate | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameNumber, setGameNumber] = useState(0);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const awaitingSocketHandshakeRef = useRef(false);
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;

  useEffect(() => {
    void requestJson<HudsonHustleReleasedConfigSummary[]>("/released-configs")
      .then(setReleasedConfigs)
      .catch(() => {
        setReleasedConfigs(hudsonHustleReleasedConfigs);
      });
  }, []);

  useEffect(() => {
    const saved = reconnectOnMount ? readSession() : null;
    if (!saved) {
      return;
    }
    awaitingSocketHandshakeRef.current = true;
    void requestJson<RejoinRoomResponse>(`/rooms/${saved.roomCode}/rejoin`, {
      method: "POST",
      body: JSON.stringify({
        seatId: saved.seatId,
        playerSecret: saved.playerSecret
      } satisfies RejoinRoomRequest)
    })
      .then((response) => {
        const nextCredentials = {
          roomCode: response.roomCode,
          seatId: response.seatId,
          playerSecret: response.playerSecret
        };
        // Keep the same object when nothing changed, so the live socket is not torn down and reopened.
        setCredentials((current) =>
          current?.roomCode === nextCredentials.roomCode &&
          current.seatId === nextCredentials.seatId &&
          current.playerSecret === nextCredentials.playerSecret
            ? current
            : nextCredentials
        );
        saveSession(nextCredentials);
        setSnapshot(response.snapshot);
      })
      .catch((caught) => {
        if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
          saveSession(null);
        }
        awaitingSocketHandshakeRef.current = false;
        setReconnectState("reconnect-failed");
        setError(errorMessage(caught, "Reconnect failed."));
      });
    // Runs once: the saved session is only consulted when the app opens.
  }, []);

  useEffect(() => {
    if (!credentials) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setRealtimeStatus("idle");
      return;
    }

    setRealtimeStatus("connecting");
    const socket = io(wsUrl);
    socketRef.current = socket;
    let handshakeResolved = false;
    const handshakeTimeout = window.setTimeout(() => {
      if (handshakeResolved) {
        return;
      }
      awaitingSocketHandshakeRef.current = false;
      setRealtimeStatus("failed");
      setError("Realtime connection timed out before the room subscription was confirmed.");
      setReconnectState("reconnect-failed");
      socket.disconnect();
    }, HANDSHAKE_TIMEOUT_MS);

    const resolveHandshake = () => {
      handshakeResolved = true;
      window.clearTimeout(handshakeTimeout);
    };

    socket.on("connect", () => {
      socket.emit("room:subscribe", credentials);
    });

    socket.on("room:update", (room) => {
      resolveHandshake();
      setRealtimeStatus("subscribed");
      setSnapshot((current) => (current ? { ...current, room } : { room, game: null, privateState: null }));
    });

    socket.on("game:update:public", (game) => {
      setSnapshot((current) => (current ? { ...current, game } : current));
    });

    socket.on("game:update:private", (privateState) => {
      setSnapshot((current) => (current ? { ...current, privateState } : current));
    });

    socket.on("game:reconnected", (nextSnapshot) => {
      resolveHandshake();
      awaitingSocketHandshakeRef.current = false;
      setRealtimeStatus("subscribed");
      setSnapshot(nextSnapshot);
      setReconnectState("reconnected");
    });

    socket.on("game:timer", setTimer);
    socket.on("chat:update", setChatMessages);

    socket.on("game:error", (payload) => {
      resolveHandshake();
      // A refused move ("It is not your turn.") says nothing about the connection.
      // Only an error while the room link is still being confirmed means the link failed.
      if (awaitingSocketHandshakeRef.current) {
        awaitingSocketHandshakeRef.current = false;
        setRealtimeStatus("failed");
        setReconnectState("reconnect-failed");
      }
      setError(payload.message);
      onNoticeRef.current?.(payload.message, "warning");
    });

    socket.on("connect_error", (connectError) => {
      resolveHandshake();
      awaitingSocketHandshakeRef.current = false;
      setRealtimeStatus("failed");
      setError(connectError.message || "Could not connect to the room.");
      setReconnectState("reconnect-failed");
    });

    socket.on("disconnect", (reason) => {
      resolveHandshake();
      awaitingSocketHandshakeRef.current = false;
      if (reason === "io client disconnect") {
        return;
      }
      setRealtimeStatus("failed");
      setError("Connection lost. Reconnect using your saved session details.");
      setReconnectState("reconnect-failed");
    });

    return () => {
      resolveHandshake();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [credentials]);

  function enterRoom(response: CreateRoomResponse | JoinRoomResponse) {
    const nextCredentials = {
      roomCode: response.roomCode,
      seatId: response.seatId,
      playerSecret: response.playerSecret
    };
    awaitingSocketHandshakeRef.current = true;
    setCredentials(nextCredentials);
    saveSession(nextCredentials);
    setSnapshot(response.snapshot);
    setError(null);
  }

  const clearSession = useCallback(() => {
    saveSession(null);
    setCredentials(null);
    setSnapshot(null);
    setRoomPreview(null);
    setTimer(null);
    setChatMessages([]);
    setError(null);
    setReconnectState("fresh");
  }, []);

  async function createRoom(form: CreateRoomRequest) {
    setIsCreatingRoom(true);
    setError(null);
    try {
      enterRoom(await requestJson<CreateRoomResponse>("/rooms", { method: "POST", body: JSON.stringify(form) }));
    } catch (caught) {
      setError(
        caught instanceof TypeError
          ? "Could not reach the multiplayer server. Make sure the local backend is running and this web port is allowed."
          : errorMessage(caught, "Could not create the room.")
      );
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function previewRoom(roomCode: string) {
    try {
      const room = await requestJson<RoomSnapshot>(`/rooms/${roomCode}`);
      setRoomPreview(room.room);
      setError(null);
    } catch (caught) {
      setRoomPreview(null);
      setError(errorMessage(caught, "Could not preview that room."));
    }
  }

  async function joinRoom(form: JoinRoomRequest & { roomCode: string }) {
    try {
      enterRoom(
        await requestJson<JoinRoomResponse>(`/rooms/${form.roomCode}/join`, {
          method: "POST",
          body: JSON.stringify({
            playerName: form.playerName,
            preferredSeatId: form.preferredSeatId
          } satisfies JoinRoomRequest)
        })
      );
    } catch (caught) {
      setError(errorMessage(caught, "Could not join that room."));
    }
  }

  async function startRoom() {
    if (!credentials || !snapshot) {
      return;
    }
    try {
      const response = await requestJson<{ snapshot: RoomSnapshot }>(`/rooms/${snapshot.room.roomCode}/start`, {
        method: "POST",
        body: JSON.stringify({ playerSecret: credentials.playerSecret } satisfies StartRoomRequest)
      });
      setSnapshot(response.snapshot);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught, "Could not start the room."));
    }
  }

  async function restartRoom() {
    if (!credentials || !snapshot) {
      return;
    }
    try {
      const response = await requestJson<RestartRoomResponse>(`/rooms/${snapshot.room.roomCode}/restart`, {
        method: "POST",
        body: JSON.stringify({ playerSecret: credentials.playerSecret } satisfies RestartRoomRequest)
      });
      setSnapshot(response.snapshot);
      setGameNumber((current) => current + 1);
      setError(null);
      onNoticeRef.current?.("New game started with the same room settings.", "success");
    } catch (caught) {
      const message = errorMessage(caught, "Could not restart the room.");
      setError(message);
      onNoticeRef.current?.(message, "warning");
    }
  }

  function sendReady(ready: boolean) {
    if (credentials) {
      socketRef.current?.emit("player:ready", { ready });
    }
  }

  function sendGameAction(action: GameAction) {
    if (credentials) {
      setError(null);
      socketRef.current?.emit("game:action", { action });
    }
  }

  function sendChatMessage(message: string) {
    if (credentials) {
      socketRef.current?.emit("chat:message", { message });
    }
  }

  /** Gives up the seat while still in the lobby; mid-game the seat stays reserved and only this browser forgets it. */
  async function leaveRoom() {
    awaitingSocketHandshakeRef.current = false;
    if (snapshot?.room.status === "lobby" && credentials) {
      try {
        await requestJson<{ ok: true }>(`/rooms/${credentials.roomCode}/leave`, {
          method: "POST",
          body: JSON.stringify({ seatId: credentials.seatId, playerSecret: credentials.playerSecret })
        });
      } catch (caught) {
        const roomAlreadyGone = caught instanceof ApiError && (caught.status === 403 || caught.status === 404);
        if (!roomAlreadyGone) {
          setError(errorMessage(caught, "Could not leave the room."));
          return false;
        }
      }
    }
    clearSession();
    return true;
  }

  return {
    releasedConfigs,
    snapshot,
    credentials,
    roomPreview,
    reconnectState,
    error,
    isCreatingRoom,
    timer,
    realtimeStatus,
    chatMessages,
    /** Changes whenever the room starts a fresh game, so per-game UI state can reset. */
    gameNumber,
    clearError: () => setError(null),
    clearRoomPreview: () => {
      setRoomPreview(null);
      setError(null);
    },
    createRoom,
    previewRoom,
    joinRoom,
    startRoom,
    restartRoom,
    sendReady,
    sendGameAction,
    sendChatMessage,
    leaveRoom
  };
}

export type OnlineRoom = ReturnType<typeof useOnlineRoom>;
