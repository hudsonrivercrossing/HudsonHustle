import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  getAffordableRouteColors,
  getAffordableStationColors,
  getCityName,
  getTicketProgress,
  summarizeEndgame,
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
  type RoomSnapshot,
  type ServerToClientEvents,
  type StartRoomRequest,
  type TicketDef,
  type TimerUpdate,
  trainCardColors
} from "@hudson-hustle/game-core";
import {
  getHudsonHustleMapByConfigId,
  getHudsonHustleVisualsByConfigId,
  hudsonHustleReleasedConfigs,
  type HudsonHustleReleasedConfigSummary
} from "@hudson-hustle/game-data";
import { BoardMap } from "./components/BoardMap";
import { IdentityChip } from "./components/IdentityChip";
import { LobbyScreen } from "./components/LobbyScreen";
import { MultiplayerSetupScreen } from "./components/MultiplayerSetupScreen";
import { TicketPicker } from "./components/TicketPicker";
import { TransitCard } from "./components/TransitCard";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";
const wsUrl = import.meta.env.VITE_WS_URL ?? apiBaseUrl;
const sessionKey = "hudson-hustle-multiplayer-session-v2";
type RealtimeStatus = "idle" | "connecting" | "subscribed" | "failed";

interface SessionCredentials {
  roomCode: string;
  seatId: string;
  playerSecret: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readSession(): SessionCredentials | null {
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionCredentials;
  } catch {
    return null;
  }
}

function saveSession(credentials: SessionCredentials | null): void {
  if (!credentials) {
    window.localStorage.removeItem(sessionKey);
    return;
  }
  window.localStorage.setItem(sessionKey, JSON.stringify(credentials));
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
  const [releasedConfigs, setReleasedConfigs] = useState<HudsonHustleReleasedConfigSummary[]>(hudsonHustleReleasedConfigs);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [credentials, setCredentials] = useState<SessionCredentials | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomSnapshot["room"] | null>(null);
  const [reconnectState, setReconnectState] = useState<ReconnectState>("fresh");
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<TimerUpdate | null>(null);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const awaitingSocketHandshakeRef = useRef(false);

  useEffect(() => {
    void requestJson<HudsonHustleReleasedConfigSummary[]>("/released-configs")
      .then(setReleasedConfigs)
      .catch(() => {
        setReleasedConfigs(hudsonHustleReleasedConfigs);
      });
  }, []);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      return;
    }
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
        setError(caught instanceof Error ? caught.message : "Reconnect failed.");
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
      setError("Realtime connection timed out before the room subscription was confirmed.");
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

    socket.on("game:error", (payload) => {
      resolveHandshake();
      setRealtimeStatus("failed");
      if (awaitingSocketHandshakeRef.current) {
        awaitingSocketHandshakeRef.current = false;
        setReconnectState("reconnect-failed");
      }
      setError(payload.message);
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

  useEffect(() => {
    const pending = snapshot?.privateState?.pendingTickets ?? [];
    if (pending.length === 0) {
      setSelectedTicketIds([]);
      return;
    }
    const minimumKeep = snapshot?.game?.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pending.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [snapshot]);

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
      setCredentials(nextCredentials);
      saveSession(nextCredentials);
      setSnapshot(response.snapshot);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the room.");
    }
  }

  async function previewRoom(roomCode: string) {
    try {
      const room = await requestJson<RoomSnapshot>(`/rooms/${roomCode}`);
      setRoomPreview(room.room);
      setError(null);
    } catch (caught) {
      setRoomPreview(null);
      setError(caught instanceof Error ? caught.message : "Could not preview that room.");
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
      setCredentials(nextCredentials);
      saveSession(nextCredentials);
      setSnapshot(response.snapshot);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not join that room.");
    }
  }

  async function manualReconnect(form: SessionCredentials) {
    try {
      const response = await requestJson<RejoinRoomResponse>(`/rooms/${form.roomCode}/rejoin`, {
        method: "POST",
        body: JSON.stringify({
          seatId: form.seatId,
          playerSecret: form.playerSecret
        } satisfies RejoinRoomRequest)
      });
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
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
        saveSession(null);
      }
      setReconnectState("reconnect-failed");
      setError(caught instanceof Error ? caught.message : "Could not reconnect.");
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
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the room.");
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
    setError(null);
    socketRef.current?.emit("game:action", {
      ...credentials,
      action
    });
  }

  function leaveRoom() {
    awaitingSocketHandshakeRef.current = false;
    saveSession(null);
    setCredentials(null);
    setSnapshot(null);
    setRoomPreview(null);
    setTimer(null);
    setError(null);
    setReconnectState("fresh");
  }

  if (!snapshot || !credentials) {
    return (
      <MultiplayerSetupScreen
        releasedConfigs={releasedConfigs}
        reconnectState={reconnectState}
        roomPreview={roomPreview}
        error={error}
        onPreviewRoom={(roomCode) => void previewRoom(roomCode)}
        onCreateRoom={(form) => void createRoom(form)}
        onJoinRoom={(form) => void joinRoom(form)}
        onManualReconnect={(form) => void manualReconnect(form)}
      />
    );
  }

  if (snapshot.room.status === "lobby" || !snapshot.game || !mapConfig || !visuals || !projectedGame || !localPlayer) {
    return (
      <LobbyScreen
        room={snapshot.room}
        localSeatId={credentials.seatId}
        playerSecret={credentials.playerSecret}
        onReadyChange={sendReady}
        onStart={() => void startRoom()}
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
  const canAdvanceTurn = localIsActive && publicGame.turn.stage === "awaitingHandoff";
  const localPendingTickets = snapshot.privateState?.pendingTickets ?? [];
  const activePlayer = publicGame.players[publicGame.activePlayerIndex];
  const turnBannerTone = localIsActive ? "active" : "waiting";
  const turnBannerLabel = localIsActive ? "Your turn" : "Waiting";
  const turnBannerCopy = !localIsActive
    ? `Waiting for ${activePlayer?.name ?? "the active player"} to finish their move.`
    : publicGame.turn.stage === "drawing"
      ? "Your draw is still in progress. Take the second card or finish the draw."
      : publicGame.turn.stage === "awaitingHandoff"
        ? "Your action is complete. End your turn to pass play to the next seat."
        : "Claim a route, build a station, or draw cards before the timer runs out.";
  const timerCopy =
    timer?.deadlineAt
      ? `${Math.max(0, Math.ceil((timer.deadlineAt - timerNow) / 1000))}s left`
      : snapshot.room.turnTimeLimitSeconds === 0
        ? "Untimed room"
        : `Timer ${snapshot.room.turnTimeLimitSeconds}s`;

  return (
    <div className="app-shell" data-config-theme={visuals.theme}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Hudson Hustle Multiplayer</p>
          <h1>{mapConfig.name}</h1>
          <div className="config-chip-group">
            <div className="config-hover-card">
              <span className="config-chip">Config: {snapshot.room.configVersion} · {snapshot.room.configId}</span>
              <span className="config-summary-tooltip">{snapshot.room.configSummary}</span>
            </div>
          </div>
          <div className={`status-banner status-banner--${turnBannerTone}`} data-testid="turn-status-banner">
            <div>
              <span className="status-banner__eyebrow">{turnBannerLabel}</span>
              <strong className="status-banner__headline">
                {localIsActive ? "Make your move." : `${activePlayer?.name ?? "Another player"} is acting.`}
              </strong>
              <span className="status-banner__copy">{turnBannerCopy}</span>
            </div>
            <span className="status-banner__timer" data-testid="turn-timer-badge">
              {timerCopy}
            </span>
          </div>
        </div>
        <div className="topbar-actions">
          <IdentityChip roomCode={credentials.roomCode} seatId={credentials.seatId} playerSecret={credentials.playerSecret} />
          <button className="secondary-button" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </header>

      <div className="game-layout">
        <aside className="side-panel">
          <section className="panel">
            <div className="panel-header">
              <h2>Round table</h2>
              <span>{activePlayer?.name ?? "Unknown"} active</span>
            </div>
            <div className="scoreboard">
              {snapshot.game.players.map((player, index) => (
                <article key={player.id} className={`player-strip ${index === snapshot.game?.activePlayerIndex ? "player-strip--active" : ""}`}>
                  <span className="player-swatch" style={{ background: visuals.palettes.players[player.color] }} />
                  <strong>{player.name}</strong>
                  <span>{player.score} pts</span>
                  <span>{player.trainsLeft} trains</span>
                  <span>{player.stationsLeft} stations</span>
                  <span>{player.ticketCount} tickets</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Your hand</h2>
              <span>{localPlayer.hand.length} cards</span>
            </div>
            <div className="card-grid">
              {localPlayer.hand.map((card) => (
                <TransitCard key={card.id} color={card.color} context="hand" />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Your tickets</h2>
              <span>
                {ticketProgress.filter((entry) => entry.completed).length}/{ticketProgress.length} connected
              </span>
            </div>
            <div className="ticket-stack">
              {ticketProgress.map(({ ticket, completed }) => (
                <div key={ticket.id} className={`ticket-row ${completed ? "ticket-row--done" : ""}`}>
                  <div className="ticket-route">
                    <strong className={`ticket-status ${completed ? "ticket-status--done" : ""}`}>
                      {completed ? "Connected" : "Pending"}
                    </strong>
                    <span className="ticket-route__cities">
                      {getCityName(mapConfig, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(mapConfig, ticket.to)}
                    </span>
                  </div>
                  <strong className="ticket-points">{ticket.points}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Market</h2>
              <span>{publicGame.trainDeckCount} deck</span>
            </div>
            <div className="market-grid">
              {publicGame.market.map((card, index) => (
                <TransitCard
                  key={card.id}
                  className="market-card"
                  color={card.color}
                  context="market"
                  disabled={!canContinueDrawing || (publicGame.turn.drawsTaken === 1 && card.color === "locomotive")}
                  onClick={() => sendGameAction({ type: "draw_card", source: "market", marketIndex: index })}
                  tag={card.color === "locomotive" ? "Ends draw" : undefined}
                />
              ))}
            </div>
            <button className="secondary-button" disabled={!canContinueDrawing} onClick={() => sendGameAction({ type: "draw_card", source: "deck" })}>
              Draw from deck
            </button>
          </section>
        </aside>

        <main className="board-column">
          <section className="panel board-panel">
            <div className="panel-header">
              <h2>Board</h2>
              <span>All players see the same public network state.</span>
            </div>
            <BoardMap
              config={mapConfig}
              backdrop={visuals.backdrop}
              backdropMode={visuals.backdropMode}
              boardLabelMode={visuals.boardLabelMode}
              cardPalette={visuals.palettes.cards}
              playerPalette={visuals.palettes.players}
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
              onSelectRoute={(routeId) => {
                setSelectedRouteId(routeId);
                setSelectedCityId(null);
              }}
              onSelectCity={(cityId) => {
                setSelectedCityId(cityId);
                setSelectedRouteId(null);
              }}
            />
          </section>

          <section className="panel action-panel">
              <div className="panel-header">
                <h2>Action rail</h2>
                <span>{publicGame.turn.summary ?? "Choose a route, city, or ticket action."}</span>
              </div>
              {error ? <p className="error-banner">{error}</p> : null}

            {publicGame.phase === "gameOver" ? (
              <div className="endgame-grid">
                {projectedGame.players.map((player) => (
                  <article key={player.id} className="endgame-card">
                    <h3>{player.name}</h3>
                    <p className="endgame-score">{player.score} pts</p>
                    {summarizeEndgame(player, mapConfig).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </article>
                ))}
              </div>
            ) : null}

            {publicGame.phase === "main" ? (
              <div className="action-rail">
                <button className="secondary-button" disabled={!canTakeTurnAction} onClick={() => sendGameAction({ type: "draw_tickets" })}>
                  Draw tickets
                </button>
                <button className="primary-button" disabled={!canAdvanceTurn} onClick={() => sendGameAction({ type: "advance_turn" })}>
                  End turn
                </button>
                <button className="secondary-button" disabled>
                  {snapshot.room.turnTimeLimitSeconds === 0 ? "Untimed room" : `Timer ${snapshot.room.turnTimeLimitSeconds}s`}
                </button>
              </div>
            ) : null}

            {currentRoute && publicGame.phase === "main" ? (
              <div className="detail-card">
                <h3>{getCityName(mapConfig, currentRoute.from)} → {getCityName(mapConfig, currentRoute.to)}</h3>
                <p>
                  {currentRoute.length} train{currentRoute.length === 1 ? "" : "s"} · {currentRoute.type}
                  {currentRoute.color === "gray" ? " · gray route" : ` · ${currentRoute.color}`}
                  {currentRoute.locomotiveCost ? ` · ${currentRoute.locomotiveCost} locomotives` : ""}
                </p>
                {currentRouteOwner ? <p className="muted-copy">Claimed by {currentRouteOwner.name}.</p> : null}
                <div className="chip-row">
                  {routeOptions.length > 0 ? (
                    routeOptions.map((color) => (
                      <button
                        key={color}
                        className="chip-button"
                        style={{ background: visuals.palettes.cards[color] }}
                        disabled={!canTakeTurnAction}
                        onClick={() => sendGameAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      >
                        Claim with {color}
                      </button>
                    ))
                  ) : (
                    <span className="muted-copy">{currentRouteUnavailableReason}</span>
                  )}
                </div>
              </div>
            ) : null}

            {currentCity && publicGame.phase === "main" ? (
              <div className="detail-card">
                <h3>{currentCity.name}</h3>
                <p>Build a station here to borrow one rival connection during final scoring.</p>
                <div className="chip-row">
                  {currentCityOccupied ? (
                    <span className="muted-copy">A station already exists in this city.</span>
                  ) : stationOptions.length > 0 ? (
                    stationOptions.map((color) => (
                      <button
                        key={color}
                        className="chip-button"
                        style={{ background: visuals.palettes.cards[color] }}
                        disabled={!canTakeTurnAction}
                        onClick={() => sendGameAction({ type: "build_station", cityId: currentCity.id, color })}
                      >
                        Build with {color}
                      </button>
                    ))
                  ) : (
                    <span className="muted-copy">
                      {localIsActive ? "No affordable station payment colors right now." : "Wait for your turn to build a station."}
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </div>

      {localPendingTickets.length > 0 ? (
        <TicketPicker
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
          onCancel={publicGame.phase === "ticketChoice" ? () => sendGameAction({ type: "cancel_ticket_draw" }) : undefined}
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
    </div>
  );
}
