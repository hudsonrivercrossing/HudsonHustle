import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { io, type Socket } from "socket.io-client";
import {
  type ChatMessage,
  getAffordableRouteColors,
  getAffordableStationColors,
  getCityName,
  getTicketProgress,
  type ClientToServerEvents,
  type CreateRoomRequest,
  type CreateRoomResponse,
  type GameAction,
  type GameState,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type PublicGameState,
  type ReconnectState,
  type RejoinRoomRequest,
  type RejoinRoomResponse,
  type RestartRoomRequest,
  type RestartRoomResponse,
  type RoomSnapshot,
  type ServerToClientEvents,
  type StartRoomRequest,
  type TicketDef,
  type TimerUpdate,
  type TrainCardColor
} from "@hudson-hustle/game-core";
import {
  getHudsonHustleMapByConfigId,
  getHudsonHustleVisualsByConfigId,
  hudsonHustleReleasedConfigs,
  type HudsonHustleReleasedConfigSummary
} from "@hudson-hustle/game-data";
import { BoardMap } from "./components/BoardMap";
import { EndgameBreakdown } from "./components/EndgameBreakdown";
import {
  BoardStage,
  FloatingPlayerRoster,
  GameOverLayer,
  InspectorDock,
  NotificationPipe,
  PrivateHandRail,
  SupplyDock,
  TicketChoiceSheet,
  TicketDock,
  TurnIndicator,
  formatCardLabel,
  type GameplayNotification
} from "./components/GameplayHud";
import { GuidebookScreen } from "./components/GuidebookScreen";
import OnboardingTour, { shouldShowTour } from "./components/OnboardingTour";
import { LocalPlayScreen } from "./components/LocalPlayScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { MultiplayerSetupScreen } from "./components/MultiplayerSetupScreen";
import { ScoreGuide } from "./components/ScoreGuide";
import { SetupGateway } from "./components/SetupGateway";
import { Button } from "./components/system/Button";
import { ChoiceChipButton } from "./components/system/ChoiceChipButton";
import { ModalShell } from "./components/system/ModalShell";
import { SectionHeader } from "./components/system/SectionHeader";
import { SurfaceCard } from "./components/system/SurfaceCard";
import { encodeReconnectToken, readReconnectCredentials, type ReconnectCredentials } from "./reconnect-token";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const wsUrl = import.meta.env.VITE_WS_URL ?? apiBaseUrl;
const sessionKey = "hudson-hustle-multiplayer-session-v2";
type RealtimeStatus = "idle" | "connecting" | "subscribed" | "failed";
type SetupMode = "gateway" | "local" | "multiplayer" | "guide";

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

function clearSessionState(
  setCredentials: Dispatch<SetStateAction<ReconnectCredentials | null>>,
  setSnapshot: Dispatch<SetStateAction<RoomSnapshot | null>>,
  setRoomPreview: Dispatch<SetStateAction<RoomSnapshot["room"] | null>>,
  setTimer: Dispatch<SetStateAction<TimerUpdate | null>>,
  setMultiplayerError: Dispatch<SetStateAction<string | null>>,
  setReconnectState: Dispatch<SetStateAction<ReconnectState>>,
  setSetupMode: Dispatch<SetStateAction<SetupMode>>
): void {
  saveSession(null);
  setCredentials(null);
  setSnapshot(null);
  setRoomPreview(null);
  setTimer(null);
  setMultiplayerError(null);
  setReconnectState("fresh");
  setSetupMode("gateway");
}

function placeholderHand(playerId: string, count: number): GameState["players"][number]["hand"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `hidden-hand-${playerId}-${index}`,
    color: "locomotive" as const
  }));
}

function placeholderTickets(playerId: string, count: number): TicketDef[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `hidden-ticket-${playerId}-${index}`,
    from: "hidden",
    to: "hidden",
    points: 0,
    bucket: "regular"
  }));
}

function buildProjectedGameState(game: PublicGameState, privateState: RoomSnapshot["privateState"]): GameState {
  return {
    version: game.version,
    mapId: game.mapId,
    players: game.players.map((player) => {
      const isLocal = privateState?.playerId === player.id;
      return {
        id: player.id,
        name: player.name,
        color: player.color,
        hand: isLocal ? privateState?.hand ?? [] : placeholderHand(player.id, player.handCount),
        tickets: isLocal ? privateState?.tickets ?? [] : placeholderTickets(player.id, player.ticketCount),
        pendingTickets: isLocal ? privateState?.pendingTickets ?? [] : placeholderTickets(player.id, player.pendingTicketCount),
        score: player.score,
        trainsLeft: player.trainsLeft,
        stationsLeft: player.stationsLeft,
        endgame: player.endgame
      };
    }),
    activePlayerIndex: game.activePlayerIndex,
    phase: game.phase,
    routeClaims: game.routeClaims,
    stations: game.stations,
    trainDeck: [],
    discardPile: [],
    market: game.market,
    regularTickets: [],
    longTickets: [],
    discardedTickets: [],
    turn: game.turn,
    rngState: 0,
    finalRoundRemaining: game.finalRoundRemaining,
    finalRoundTriggeredBy: game.finalRoundTriggeredBy,
    log: game.log
  };
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

export default function App(): JSX.Element {
  const [setupMode, setSetupMode] = useState<SetupMode>("gateway");
  const [releasedConfigs, setReleasedConfigs] = useState<HudsonHustleReleasedConfigSummary[]>(hudsonHustleReleasedConfigs);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [credentials, setCredentials] = useState<ReconnectCredentials | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomSnapshot["room"] | null>(null);
  const [reconnectState, setReconnectState] = useState<ReconnectState>("fresh");
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [timer, setTimer] = useState<TimerUpdate | null>(null);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [focusedTicket, setFocusedTicket] = useState<TicketDef | null>(null);
  const [pinnedTicket, setPinnedTicket] = useState<TicketDef | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<{ color: TrainCardColor; totalCost: number; minimumLocomotives?: number } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notifications, setNotifications] = useState<GameplayNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const awaitingSocketHandshakeRef = useRef(false);
  const lastPendingTicketKeyRef = useRef("");
  const notificationIdRef = useRef(0);
  const lastAnnouncedLogRef = useRef<string | null>(null);
  const lastAnnouncedLogLengthRef = useRef(0);
  const timerWarningRef = useRef<string | null>(null);

  useEffect(() => {
    void requestJson<HudsonHustleReleasedConfigSummary[]>("/released-configs")
      .then(setReleasedConfigs)
      .catch(() => {
        setReleasedConfigs(hudsonHustleReleasedConfigs);
      });
  }, []);

  useEffect(() => {
    setShowLeaveConfirm(false);
  }, [credentials?.roomCode, snapshot?.room.status]);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      return;
    }
    setSetupMode("multiplayer");
    setReconnectState("attempting-reconnect");
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
        setCredentials(nextCredentials);
        saveSession(nextCredentials);
        setSnapshot(response.snapshot);
      })
      .catch((caught) => {
        if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
          saveSession(null);
        }
        awaitingSocketHandshakeRef.current = false;
        setReconnectState("reconnect-failed");
        setMultiplayerError(caught instanceof Error ? caught.message : "Reconnect failed.");
      });
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
      setMultiplayerError("Realtime connection timed out before the room subscription was confirmed.");
      setReconnectState("reconnect-failed");
      socket.disconnect();
    }, 8000);

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
      announceGameLog(game);
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

    socket.on("game:timer", (nextTimer) => {
      setTimer(nextTimer);
    });

    socket.on("chat:update", (messages) => {
      setChatMessages(messages);
    });

    socket.on("game:error", (payload) => {
      resolveHandshake();
      setRealtimeStatus("failed");
      if (awaitingSocketHandshakeRef.current) {
        awaitingSocketHandshakeRef.current = false;
        setReconnectState("reconnect-failed");
      }
      setMultiplayerError(payload.message);
      pushNotification(payload.message, "warning");
    });

    socket.on("connect_error", (connectError) => {
      resolveHandshake();
      awaitingSocketHandshakeRef.current = false;
      setRealtimeStatus("failed");
      setMultiplayerError(connectError.message || "Could not connect to the room.");
      setReconnectState("reconnect-failed");
    });

    socket.on("disconnect", (reason) => {
      resolveHandshake();
      awaitingSocketHandshakeRef.current = false;
      if (reason === "io client disconnect") {
        return;
      }
      setRealtimeStatus("failed");
      setMultiplayerError("Connection lost. Reconnect using your saved session details.");
      setReconnectState("reconnect-failed");
    });

    return () => {
      resolveHandshake();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [credentials]);

  const realtimeMessage =
    realtimeStatus === "connecting"
      ? "Realtime connection is still being established. Ready and start stay disabled until the live room link is confirmed."
      : realtimeStatus === "failed"
        ? "Realtime connection failed. Seat presence and ready/start controls are disabled until the live room link recovers."
        : null;

  useEffect(() => {
    if (!timer?.deadlineAt) {
      return;
    }

    setTimerNow(Date.now());
    const interval = window.setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timer?.deadlineAt]);

  const mapConfig = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return getHudsonHustleMapByConfigId(snapshot.room.configId);
  }, [snapshot]);

  const visuals = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return getHudsonHustleVisualsByConfigId(snapshot.room.configId);
  }, [snapshot]);

  const projectedGame = useMemo(() => {
    if (!snapshot?.game) {
      return null;
    }
    return buildProjectedGameState(snapshot.game, snapshot.privateState);
  }, [snapshot]);

  useEffect(() => {
    if (projectedGame) {
      setTourOpen(shouldShowTour());
    }
  }, [!!projectedGame]);

  const localPlayer = useMemo(() => {
    if (!projectedGame || !snapshot?.privateState?.playerId) {
      return null;
    }
    return projectedGame.players.find((player) => player.id === snapshot.privateState?.playerId) ?? null;
  }, [projectedGame, snapshot]);

  const localIsActive = useMemo(() => {
    if (!snapshot?.game || !snapshot.privateState?.playerId) {
      return false;
    }
    return snapshot.game.players[snapshot.game.activePlayerIndex]?.id === snapshot.privateState.playerId;
  }, [snapshot]);

  const endgameWinnerScore = useMemo(() => {
    if (!projectedGame) return 0;
    return Math.max(...projectedGame.players.map((p) => p.score));
  }, [projectedGame]);

  const playerAvatars = useMemo(() => {
    if (!snapshot?.game) return {};
    const AVATAR_NAMES = [
      "Conductor", "Milo", "Engineer", "Rosa", "Switchman",
      "Jack", "Dispatcher", "Lily", "Caboose", "Nellie"
    ];
    const seed = snapshot.room.roomCode;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    const rng = () => {
      h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
      h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
    const pool = [...AVATAR_NAMES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const map: Record<string, string> = {};
    snapshot.game.players.forEach((p, idx) => { map[p.id] = pool[idx % pool.length]; });
    return map;
  }, [snapshot?.game?.players.map((p) => p.id).join("|"), snapshot?.room.roomCode]);

  const rosterPlayers = useMemo(() => {
    if (!snapshot?.game) return [];
    return snapshot.game.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      trainsLeft: p.trainsLeft,
      stationsLeft: p.stationsLeft,
      ticketCount: p.ticketCount,
      avatarName: playerAvatars[p.id] ?? null
    }));
  }, [snapshot?.game, playerAvatars]);

  useEffect(() => {
    const pending = snapshot?.privateState?.pendingTickets ?? [];
    const pendingKey = pending.map((ticket) => ticket.id).join("|");
    if (pending.length === 0) {
      lastPendingTicketKeyRef.current = "";
      setSelectedTicketIds([]);
      return;
    }
    if (lastPendingTicketKeyRef.current === pendingKey) {
      return;
    }
    lastPendingTicketKeyRef.current = pendingKey;
    const minimumKeep = snapshot?.game?.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pending.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [snapshot?.game?.phase, snapshot?.privateState?.pendingTickets]);

  function pushNotification(message: string, tone: GameplayNotification["tone"] = "neutral") {
    notificationIdRef.current += 1;
    const id = `multi-${Date.now()}-${notificationIdRef.current}`;
    setNotifications((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, 4200);
  }

  function announceGameLog(game: PublicGameState) {
    const latestLog = game.log.at(-1);
    if (!latestLog) {
      return;
    }

    if (!lastAnnouncedLogRef.current) {
      lastAnnouncedLogRef.current = latestLog;
      lastAnnouncedLogLengthRef.current = game.log.length;
      return;
    }

    if (game.log.length <= lastAnnouncedLogLengthRef.current) {
      return;
    }

    lastAnnouncedLogRef.current = latestLog;
    lastAnnouncedLogLengthRef.current = game.log.length;
    pushNotification(latestLog, game.phase === "gameOver" ? "success" : "neutral");
  }

  useEffect(() => {
    const latestLog = snapshot?.game?.log.at(-1);
    if (!snapshot?.game || !latestLog) {
      return;
    }

    if (!lastAnnouncedLogRef.current) {
      lastAnnouncedLogRef.current = latestLog;
      lastAnnouncedLogLengthRef.current = snapshot.game.log.length;
      return;
    }

    if (snapshot.game.log.length <= lastAnnouncedLogLengthRef.current) {
      return;
    }

    lastAnnouncedLogRef.current = latestLog;
    lastAnnouncedLogLengthRef.current = snapshot.game.log.length;
    pushNotification(latestLog, snapshot.game.phase === "gameOver" ? "success" : "neutral");
  }, [snapshot?.game?.log.length, snapshot?.game?.phase]);

  const liveTimerSecondsRemaining =
    timer?.deadlineAt
      ? Math.max(0, Math.ceil((timer.deadlineAt - timerNow) / 1000))
      : timer?.secondsRemaining ?? null;

  useEffect(() => {
    if (!timer || !credentials || timer.activeSeatId !== credentials.seatId || liveTimerSecondsRemaining === null) {
      timerWarningRef.current = null;
      return;
    }

    const deadlineKey = `${timer.deadlineAt ?? "no-deadline"}`;
    if (liveTimerSecondsRemaining <= 10 && timerWarningRef.current !== deadlineKey) {
      timerWarningRef.current = deadlineKey;
      pushNotification("10 seconds left.", "warning");
    }

    if (liveTimerSecondsRemaining > 10) {
      timerWarningRef.current = null;
    }
  }, [credentials, liveTimerSecondsRemaining, timer]);

  const ticketProgress = useMemo(() => {
    if (!projectedGame || !mapConfig || !localPlayer) {
      return [];
    }
    return getTicketProgress(projectedGame, mapConfig, localPlayer.id).sort((left, right) => Number(left.completed) - Number(right.completed));
  }, [localPlayer, mapConfig, projectedGame]);

  const routeOptions = useMemo(() => {
    if (!localIsActive || !projectedGame || !mapConfig || !selectedRouteId) {
      return [];
    }
    if (!mapConfig.routes.find((route) => route.id === selectedRouteId)) {
      return [];
    }
    return getAffordableRouteColors(projectedGame, mapConfig, selectedRouteId);
  }, [localIsActive, mapConfig, projectedGame, selectedRouteId]);

  const stationOptions = useMemo(() => {
    if (!localIsActive || !projectedGame || !mapConfig || !selectedCityId) {
      return [];
    }
    return getAffordableStationColors(projectedGame, mapConfig);
  }, [localIsActive, mapConfig, projectedGame, selectedCityId]);

  const currentRouteUnavailableReason = useMemo(() => {
    if (!snapshot?.game || !mapConfig || !selectedRouteId) {
      return null;
    }

    const currentRoute = mapConfig.routes.find((route) => route.id === selectedRouteId);
    if (!currentRoute) {
      return null;
    }

    const currentRouteClaim = snapshot.game.routeClaims.find((claim) => claim.routeId === currentRoute.id);
    const currentRouteOwner = currentRouteClaim ? snapshot.game.players.find((player) => player.id === currentRouteClaim.playerId) : null;

    if (!localIsActive) {
      return "Wait for your turn to claim a route.";
    }

    if (currentRouteClaim && currentRouteOwner) {
      return `This route is already claimed by ${currentRouteOwner.name}.`;
    }

    if (snapshot.game.phase !== "main") {
      return "Finish the current ticket choice before claiming a route.";
    }

    if (snapshot.game.turn.stage !== "idle") {
      return "Finish the current draw before claiming a route.";
    }

    if (currentRoute.twinGroup && snapshot.game.players.length <= 3) {
      const twinIds = mapConfig.routes.filter((route) => route.twinGroup === currentRoute.twinGroup && route.id !== currentRoute.id).map((route) => route.id);
      const twinClaim = snapshot.game.routeClaims.find((claim) => twinIds.includes(claim.routeId));
      if (twinClaim) {
        const twinOwner = snapshot.game.players.find((player) => player.id === twinClaim.playerId);
        return `This parallel route is unavailable because its twin is already claimed${twinOwner ? ` by ${twinOwner.name}` : ""}.`;
      }
    }

    return "No affordable claim options right now.";
  }, [localIsActive, mapConfig, selectedRouteId, snapshot]);

  async function createRoom(form: CreateRoomRequest) {
    setIsCreatingRoom(true);
    setMultiplayerError(null);
    try {
      const response = await requestJson<CreateRoomResponse>("/rooms", {
        method: "POST",
        body: JSON.stringify(form)
      });
      const nextCredentials = {
        roomCode: response.roomCode,
        seatId: response.seatId,
        playerSecret: response.playerSecret
      };
      awaitingSocketHandshakeRef.current = true;
      setSetupMode("multiplayer");
      setCredentials(nextCredentials);
      saveSession(nextCredentials);
      setSnapshot(response.snapshot);
      setMultiplayerError(null);
    } catch (caught) {
      setMultiplayerError(
        caught instanceof TypeError
          ? "Could not reach the multiplayer server. Make sure the local backend is running and this web port is allowed."
          : caught instanceof Error
            ? caught.message
            : "Could not create the room."
      );
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function previewRoom(roomCode: string) {
    try {
      const room = await requestJson<RoomSnapshot>(`/rooms/${roomCode}`);
      setRoomPreview(room.room);
      setMultiplayerError(null);
    } catch (caught) {
      setRoomPreview(null);
      setMultiplayerError(caught instanceof Error ? caught.message : "Could not preview that room.");
    }
  }

  async function joinRoom(form: JoinRoomRequest & { roomCode: string }) {
    try {
      const response = await requestJson<JoinRoomResponse>(`/rooms/${form.roomCode}/join`, {
        method: "POST",
        body: JSON.stringify({
          playerName: form.playerName,
          preferredSeatId: form.preferredSeatId
        } satisfies JoinRoomRequest)
      });
      const nextCredentials = {
        roomCode: response.roomCode,
        seatId: response.seatId,
        playerSecret: response.playerSecret
      };
      awaitingSocketHandshakeRef.current = true;
      setSetupMode("multiplayer");
      setCredentials(nextCredentials);
      saveSession(nextCredentials);
      setSnapshot(response.snapshot);
      setMultiplayerError(null);
    } catch (caught) {
      setMultiplayerError(caught instanceof Error ? caught.message : "Could not join that room.");
    }
  }

  async function startRoom() {
    if (!credentials || !snapshot) {
      return;
    }
    try {
      const response = await requestJson<{ snapshot: RoomSnapshot }>(`/rooms/${snapshot.room.roomCode}/start`, {
        method: "POST",
        body: JSON.stringify({
          playerSecret: credentials.playerSecret
        } satisfies StartRoomRequest)
      });
      setSnapshot(response.snapshot);
      setMultiplayerError(null);
    } catch (caught) {
      setMultiplayerError(caught instanceof Error ? caught.message : "Could not start the room.");
    }
  }

  async function restartRoom() {
    if (!credentials || !snapshot) {
      return;
    }
    try {
      const response = await requestJson<RestartRoomResponse>(`/rooms/${snapshot.room.roomCode}/restart`, {
        method: "POST",
        body: JSON.stringify({
          playerSecret: credentials.playerSecret
        } satisfies RestartRoomRequest)
      });
      setSnapshot(response.snapshot);
      setSelectedRouteId(null);
      setSelectedCityId(null);
      setFocusedTicket(null);
      setPinnedTicket(null);
      setPaymentPreview(null);
      lastAnnouncedLogRef.current = null;
      lastAnnouncedLogLengthRef.current = 0;
      timerWarningRef.current = null;
      setMultiplayerError(null);
      pushNotification("New game started with the same room settings.", "success");
    } catch (caught) {
      setMultiplayerError(caught instanceof Error ? caught.message : "Could not restart the room.");
      pushNotification(caught instanceof Error ? caught.message : "Could not restart the room.", "warning");
    }
  }

  function sendReady(ready: boolean) {
    if (!credentials) {
      return;
    }
    socketRef.current?.emit("player:ready", {
      ...credentials,
      ready
    });
  }

  function sendGameAction(action: GameAction) {
    if (!credentials) {
      return;
    }
    setPaymentPreview(null);
    setMultiplayerError(null);
    socketRef.current?.emit("game:action", {
      ...credentials,
      action
    });
  }

  function sendChatMessage(message: string) {
    if (!credentials) {
      return;
    }
    socketRef.current?.emit("chat:message", {
      ...credentials,
      message
    });
  }

  async function leaveRoom() {
    awaitingSocketHandshakeRef.current = false;
    if (snapshot?.room.status === "lobby" && credentials) {
      try {
        await requestJson<{ ok: true }>(`/rooms/${credentials.roomCode}/leave`, {
          method: "POST",
          body: JSON.stringify({
            seatId: credentials.seatId,
            playerSecret: credentials.playerSecret
          })
        });
      } catch (caught) {
        if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
          clearSessionState(setCredentials, setSnapshot, setRoomPreview, setTimer, setMultiplayerError, setReconnectState, setSetupMode);
          return;
        }
        setMultiplayerError(caught instanceof Error ? caught.message : "Could not leave the room.");
        return;
      }
    }

    clearSessionState(setCredentials, setSnapshot, setRoomPreview, setTimer, setMultiplayerError, setReconnectState, setSetupMode);
  }

  if (!snapshot || !credentials) {
    if (setupMode === "gateway") {
      return (
        <SetupGateway
          onChooseLocal={() => setSetupMode("local")}
          onChooseOnline={() => {
            setSetupMode("multiplayer");
            setMultiplayerError(null);
          }}
          onOpenGuide={() => setSetupMode("guide")}
        />
      );
    }

    if (setupMode === "guide") {
      return (
        <GuidebookScreen
          onBack={() => setSetupMode("gateway")}
          onReplayTour={() => {
            localStorage.removeItem("hh-tour-seen");
            setTourOpen(true);
          }}
        />
      );
    }

    if (setupMode === "local") {
      return (
        <LocalPlayScreen
          onReturnToGateway={() => setSetupMode("gateway")}
        />
      );
    }

    return (
      <MultiplayerSetupScreen
        releasedConfigs={releasedConfigs}
        reconnectState={reconnectState}
        roomPreview={roomPreview}
        error={multiplayerError}
        isCreatingRoom={isCreatingRoom}
        onOpenLocal={() => {
          setSetupMode("local");
          setMultiplayerError(null);
        }}
        onBack={() => {
          setSetupMode("gateway");
          setMultiplayerError(null);
        }}
        onClearRoomPreview={() => {
          setRoomPreview(null);
          setMultiplayerError(null);
        }}
        onPreviewRoom={(roomCode) => void previewRoom(roomCode)}
        onCreateRoom={(form) => void createRoom(form)}
        onJoinRoom={(form) => void joinRoom(form)}
      />
    );
  }

  if (guideOpen) {
    return (
      <GuidebookScreen
        onBack={() => setGuideOpen(false)}
        onReplayTour={() => {
          localStorage.removeItem("hh-tour-seen");
          setTourOpen(true);
        }}
      />
    );
  }

  if (snapshot.room.status === "lobby" || !snapshot.game || !mapConfig || !visuals || !projectedGame || !localPlayer) {
    return (
      <LobbyScreen
        room={snapshot.room}
        localSeatId={credentials.seatId}
        onReadyChange={sendReady}
        onStart={() => void startRoom()}
        onLeaveRoom={leaveRoom}
        timer={timer}
        realtimeReady={realtimeStatus === "subscribed"}
        realtimeMessage={realtimeMessage}
      />
    );
  }

  const publicGame = snapshot.game;
  const currentRoute = selectedRouteId ? mapConfig.routes.find((route) => route.id === selectedRouteId) : null;
  const currentRouteClaim = currentRoute ? publicGame.routeClaims.find((claim) => claim.routeId === currentRoute.id) : null;
  const currentRouteOwner = currentRouteClaim ? publicGame.players.find((player) => player.id === currentRouteClaim.playerId) : null;
  const currentCity = selectedCityId ? mapConfig.cities.find((city) => city.id === selectedCityId) : null;
  const currentCityOccupied = currentCity ? publicGame.stations.some((station) => station.cityId === currentCity.id) : false;
  const canTakeTurnAction = localIsActive && publicGame.phase === "main" && publicGame.turn.stage === "idle";
  const canContinueDrawing =
    localIsActive &&
    publicGame.phase === "main" &&
    (publicGame.turn.stage === "idle" || publicGame.turn.stage === "drawing") &&
    !publicGame.turn.tookFaceUpLocomotive &&
    publicGame.turn.drawsTaken < 2;
  const localPendingTickets = snapshot.privateState?.pendingTickets ?? [];
  const currentStationCost = mapConfig.settings.stationsPerPlayer - localPlayer.stationsLeft + 1;
  const highlightedTicket = focusedTicket ?? pinnedTicket;
  const highlightedCityIds = highlightedTicket ? [highlightedTicket.from, highlightedTicket.to] : [];
  const activePlayer = publicGame.players[publicGame.activePlayerIndex];
  const turnStatusLabel = localIsActive ? "Your turn" : "Waiting";
  const turnStatusCopy = localIsActive
    ? "Your turn"
    : `Waiting for ${activePlayer?.name ?? "the active player"} to finish their move.`;
  const turnTimerBadge =
    liveTimerSecondsRemaining === null
      ? snapshot.room.turnTimeLimitSeconds === 0
        ? "Untimed room"
        : `Timer ${snapshot.room.turnTimeLimitSeconds}s`
      : `${liveTimerSecondsRemaining}s left`;

  return (
    <div className="app-shell app-shell--gameplay-hud" data-config-theme={visuals.theme}>
      <header className="topbar topbar--gameplay-actions">
        <div className="topbar-private-spacer" aria-hidden="true" />
        <TurnIndicator
          playerName={projectedGame.players[snapshot.game.activePlayerIndex]?.name ?? ""}
          secondsRemaining={liveTimerSecondsRemaining}
        />
        <div className="topbar-actions">
          <Button onClick={() => setGuideOpen(true)}>Guide</Button>
          <ScoreGuide className="score-guide--subtle" label="Score" />
          <Button className="topbar-actions__leave" onClick={() => setShowLeaveConfirm(true)}>
            Leave room
          </Button>
        </div>
      </header>

      <div className="game-layout">
        <aside className="side-panel">
          <div className="side-panel__private-stack">
            <div data-tour-target="hand">
              <PrivateHandRail hand={localPlayer.hand} cardPalette={visuals.palettes.cards} paymentPreview={paymentPreview} />
            </div>
            <div data-tour-target="tickets">
            <TicketDock
              ticketProgress={ticketProgress}
              config={mapConfig}
              focusedTicketId={focusedTicket?.id ?? null}
              pinnedTicketId={pinnedTicket?.id ?? null}
              onFocusTicket={setFocusedTicket}
              onTogglePinnedTicket={(ticket) => setPinnedTicket((current) => current?.id === ticket.id ? null : ticket)}
            />
            </div>
          </div>
        </aside>

        <main className="board-column">
          <BoardStage className="board-panel" isMyTurn={localIsActive && publicGame.phase === "main"}>
            <BoardMap
              config={mapConfig}
              backdrop={visuals.backdrop}
              backdropMode={visuals.backdropMode}
              boardLabelMode={visuals.boardLabelMode}
              cardPalette={visuals.palettes.cards}
              playerPalette={visuals.palettes.players}
              viewerPlayerId={snapshot.privateState?.playerId ?? null}
              game={{
                players: projectedGame.players.map((player) => ({
                  id: player.id,
                  name: player.name,
                  color: player.color
                })),
                activePlayerIndex: projectedGame.activePlayerIndex,
                routeClaims: projectedGame.routeClaims,
                stations: projectedGame.stations
              }}
              selectedRouteId={selectedRouteId}
              selectedCityId={selectedCityId}
              highlightedCityIds={highlightedCityIds}
              onSelectRoute={(routeId) => {
                setSelectedRouteId(routeId);
                setSelectedCityId(null);
                setPaymentPreview(null);
              }}
              onSelectCity={(cityId) => {
                setSelectedCityId(cityId);
                setSelectedRouteId(null);
                setPaymentPreview(null);
              }}
            />
            <FloatingPlayerRoster
              players={rosterPlayers}
              activePlayerIndex={snapshot.game.activePlayerIndex}
              playerPalette={visuals.palettes.players}
              viewerPlayerId={snapshot.privateState?.playerId ?? null}
            />
          </BoardStage>

          <div data-tour-target="actions" style={{ display: "contents" }}>
          <InspectorDock
            summary={publicGame.turn.summary}
            className="action-panel"
            activeBuildKey={selectedRouteId ?? selectedCityId}
            chatMessages={chatMessages}
            onSendChat={sendChatMessage}
            marketContent={
              <div data-tour-target="market">
                <SupplyDock
                  market={publicGame.market}
                  deckCount={publicGame.trainDeckCount}
                  cardPalette={visuals.palettes.cards}
                  disabled={!canContinueDrawing}
                  isMarketCardDisabled={(card) => publicGame.turn.drawsTaken === 1 && card.color === "locomotive"}
                  onDrawFromMarket={(marketIndex) => sendGameAction({ type: "draw_card", source: "market", marketIndex })}
                  onDrawFromDeck={() => sendGameAction({ type: "draw_card", source: "deck" })}
                  onDrawTickets={() => sendGameAction({ type: "draw_tickets" })}
                  drawTicketsDisabled={!canTakeTurnAction}
                  className="supply-dock--board"
                />
              </div>
            }
            buildContent={
              <>
                {publicGame.phase === "main" && !currentRoute && !currentCity ? (
              <div className="action-empty-prompt" data-testid="action-empty-state">
                <span className="action-empty-prompt__title">Select a route or station.</span>
                <span className="action-empty-prompt__copy">Build options appear here.</span>
              </div>
                ) : null}

                {currentRoute && publicGame.phase === "main" ? (
              <SurfaceCard
                variant="detail"
                className="detail-card"
                data-detail-kind="route"
                title={`${getCityName(mapConfig, currentRoute.from)} → ${getCityName(mapConfig, currentRoute.to)}`}
              >
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">{currentRoute.length} train{currentRoute.length === 1 ? "" : "s"}</span>
                    <span className="detail-card__fact">{currentRoute.type}</span>
                    <span className="detail-card__fact">{currentRoute.color === "gray" ? "gray route" : currentRoute.color}</span>
                    {currentRoute.locomotiveCost ? (
                      <span className="detail-card__fact">{currentRoute.locomotiveCost} locomotive{currentRoute.locomotiveCost === 1 ? "" : "s"}</span>
                    ) : null}
                  </div>
                  <p className="detail-card__prompt">
                    {currentRouteOwner ? `Claimed by ${currentRouteOwner.name}.` : "Choose a payment color."}
                  </p>
                </div>
                <div className="detail-card__decision-shelf chip-row">
                  {routeOptions.length > 0 ? (
                    routeOptions.map((color) => (
                      <ChoiceChipButton
                        key={color}
                        style={{ ["--choice-chip-accent" as string]: visuals.palettes.cards[color] }}
                        disabled={!canTakeTurnAction}
                        onMouseEnter={() =>
                          setPaymentPreview({ color, totalCost: currentRoute.length, minimumLocomotives: currentRoute.locomotiveCost ?? 0 })
                        }
                        onMouseLeave={() => setPaymentPreview(null)}
                        onFocus={() =>
                          setPaymentPreview({ color, totalCost: currentRoute.length, minimumLocomotives: currentRoute.locomotiveCost ?? 0 })
                        }
                        onBlur={() => setPaymentPreview(null)}
                        onClick={() => sendGameAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      >
                        Claim {formatCardLabel(color)}
                      </ChoiceChipButton>
                    ))
                  ) : (
                    <span className="muted-copy">{currentRouteUnavailableReason}</span>
                  )}
                </div>
              </SurfaceCard>
                ) : null}

                {currentCity && publicGame.phase === "main" ? (
              <SurfaceCard variant="detail" className="detail-card" title={currentCity.name}>
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">Station</span>
                  </div>
                  <p className="detail-card__prompt">Choose a payment color.</p>
                </div>
                <div className="detail-card__decision-shelf chip-row">
                  {currentCityOccupied ? (
                    <span className="muted-copy">A station already exists in this city.</span>
                  ) : stationOptions.length > 0 ? (
                    stationOptions.map((color) => (
                      <ChoiceChipButton
                        key={color}
                        style={{ ["--choice-chip-accent" as string]: visuals.palettes.cards[color] }}
                        disabled={!canTakeTurnAction}
                        onMouseEnter={() => setPaymentPreview({ color, totalCost: currentStationCost })}
                        onMouseLeave={() => setPaymentPreview(null)}
                        onFocus={() => setPaymentPreview({ color, totalCost: currentStationCost })}
                        onBlur={() => setPaymentPreview(null)}
                        onClick={() => sendGameAction({ type: "build_station", cityId: currentCity.id, color })}
                      >
                        Build {formatCardLabel(color)}
                      </ChoiceChipButton>
                    ))
                  ) : (
                    <span className="muted-copy">
                      {localIsActive ? "No affordable station payment colors right now." : "Wait for your turn to build a station."}
                    </span>
                  )}
                </div>
              </SurfaceCard>
                ) : null}
              </>
            }
          />
          </div>
        </main>
      </div>

      {publicGame.phase === "gameOver" ? (
        <GameOverLayer
          title="Final board locked."
          subtitle="Review the completed routes, station saves, and ticket swings before leaving the room."
          actions={
            <>
              <Button disabled>Share result</Button>
              <Button variant="primary" onClick={() => void restartRoom()}>
                Play again
              </Button>
              <Button variant="primary" onClick={() => setShowLeaveConfirm(true)}>
                Leave room
              </Button>
            </>
          }
        >
          <div className="endgame-grid">
            {projectedGame.players.map((player) => {
              const isWinner = player.score === endgameWinnerScore;
              return (
                <SurfaceCard
                  key={player.id}
                  as="article"
                  variant="summary"
                  eyebrow={isWinner ? "Winner" : "Final score"}
                  title={player.name}
                  className={`endgame-card ${isWinner ? "endgame-card--winner" : ""}`}
                >
                  <div className="endgame-card__hero">
                    <p className="endgame-score">{player.score}</p>
                    <span className="endgame-score__label">points</span>
                  </div>
                  <EndgameBreakdown player={player} config={mapConfig} />
                </SurfaceCard>
              );
            })}
          </div>
        </GameOverLayer>
      ) : null}

      {localPendingTickets.length > 0 ? (
        <TicketChoiceSheet
          title={publicGame.phase === "initialTickets" ? "Choose starting tickets" : "Keep new tickets"}
          subtitle={
            publicGame.phase === "initialTickets"
              ? "Keep at least two. Ticket choice does not auto-time out in MVP2."
              : "Keep at least one. This consumes your turn."
          }
          tickets={localPendingTickets}
          config={mapConfig}
          minimumKeep={publicGame.phase === "initialTickets" ? 2 : 1}
          selectedIds={selectedTicketIds}
          focusedTicketId={focusedTicket?.id ?? null}
          onFocusTicket={setFocusedTicket}
          onToggle={(ticketId) =>
            setSelectedTicketIds((current) =>
              current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]
            )
          }
          onConfirm={() =>
            sendGameAction(
              publicGame.phase === "initialTickets"
                ? { type: "select_initial_tickets", keptTicketIds: selectedTicketIds }
                : { type: "keep_drawn_tickets", keptTicketIds: selectedTicketIds }
            )
          }
        />
      ) : null}

      {showLeaveConfirm ? (
        <ModalShell width="md" align="center" cardClassName="leave-confirm-card">
          <SectionHeader title="Leave this game?" variant="ceremony" />
          <p>You will return to setup and clear this room from the current browser.</p>
          <div className="setup-actions">
            <Button onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="leave-button" onClick={leaveRoom}>
              Leave
            </Button>
          </div>
        </ModalShell>
      ) : null}

      {tourOpen && (
        <OnboardingTour onDismiss={() => setTourOpen(false)} />
      )}

      <NotificationPipe notifications={notifications} />
    </div>
  );
}
