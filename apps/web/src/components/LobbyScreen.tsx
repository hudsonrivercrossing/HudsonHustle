import type { RoomSummary, RoomSeatSummary, TimerUpdate } from "@hudson-hustle/game-core";
import {
  MapThumbnail,
  SetupActions,
  SetupBackButton,
  SetupShell,
  SetupStepPanel,
  SetupSummaryRow,
  type SetupStep
} from "./setup";
import { Badge } from "./ui/primitives/Badge";
import { Button } from "./ui/primitives/Button";
import { StateSurface } from "./ui/primitives/StateSurface";

interface LobbyScreenProps {
  room: RoomSummary;
  localSeatId: string;
  onReadyChange: (ready: boolean) => void;
  onStart: () => void;
  onLeaveRoom: () => void;
  timer: TimerUpdate | null;
  realtimeReady: boolean;
  realtimeMessage: string | null;
}

type SeatStatus = { label: string; tone: "neutral" | "info" | "danger" | "success" | "warning" };

function getSeatStatus(seat: RoomSeatSummary): SeatStatus {
  if (!seat.playerName) return { label: "Open", tone: "neutral" };
  if (seat.controllerType === "bot") return { label: "Bot", tone: "info" };
  if (!seat.connected) return { label: "Offline", tone: "danger" };
  return seat.ready ? { label: "Ready", tone: "success" } : { label: "Waiting", tone: "warning" };
}

const AVATAR_NAMES = [
  "Conductor", "Milo", "Engineer", "Rosa", "Switchman",
  "Jack", "Dispatcher", "Lily", "Caboose", "Nellie"
];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffleAvatars(seed: string, count: number): string[] {
  const rng = seededRandom(seed);
  const pool = [...AVATAR_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function LobbyScreen({
  room,
  localSeatId,
  onReadyChange,
  onStart,
  onLeaveRoom,
  timer,
  realtimeReady,
  realtimeMessage
}: LobbyScreenProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.png";
  const localSeat = room.seats.find((seat) => seat.seatId === localSeatId);
  const seatAvatars = shuffleAvatars(room.roomCode, room.seats.length);
  const canStart = realtimeReady && localSeat?.isHost && room.seats.every((seat) => seat.playerName) && room.seats.every((seat) => seat.ready);
  const occupiedCount = room.seats.filter((seat) => seat.playerName).length;
  const readyCount = room.seats.filter((seat) => seat.ready).length;
  const lobbyTone = realtimeMessage ? "danger" : canStart ? "active" : "waiting";
  const lobbyHeadline = realtimeMessage
    ? "Realtime connection needs attention."
    : canStart
    ? "Table is ready to start."
    : localSeat?.isHost
      ? "Waiting for the full table."
      : "Waiting for host.";
  const lobbyCopy = realtimeMessage
    ? realtimeMessage
    : canStart
    ? "Everyone is seated and ready. Start the game when you want."
    : localSeat?.isHost
      ? `Seats occupied: ${occupiedCount}/${room.playerCount}. Ready: ${readyCount}/${room.playerCount}.`
      : "Share the room code, mark yourself ready, and wait for the host to start.";
  const lobbySteps: SetupStep[] = [
    { label: room.roomCode, meta: room.mapName, status: "current" },
    {
      label: "Seats",
      meta: `${occupiedCount}/${room.playerCount} occupied`,
      status: occupiedCount === room.playerCount ? "complete" : "current"
    },
    {
      label: "Departure",
      meta: canStart ? "Ready" : `${readyCount}/${room.playerCount} ready`,
      status: canStart ? "current" : "upcoming"
    }
  ];
  const lobbyPreflight = (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">Room board</span>
      <MapThumbnail configId={room.configId} mapName={room.mapName} version={room.configVersion} />
      <div className="setup-summary-stack">
        <SetupSummaryRow label="Room" value={room.roomCode} />
        <SetupSummaryRow label="Seats" value={`${occupiedCount}/${room.playerCount}`} detail={`${readyCount} ready`} />
        <SetupSummaryRow label="Timer" value={room.turnTimeLimitSeconds === 0 ? "Untimed" : `${room.turnTimeLimitSeconds}s`} />
      </div>
    </div>
  );

  return (
    <SetupShell
      eyebrow="Room lobby"
      title="Boarding"
      lead="Seats, readiness, and departure stay here until the host starts the table."
      backgroundImageUrl={setupHeroImageUrl}
      steps={lobbySteps}
      backAction={<SetupBackButton onClick={onLeaveRoom}>Leave room</SetupBackButton>}
      preflight={lobbyPreflight}
      className="setup-board-shell--lobby"
    >
      <div className="setup-counter__status">
        <StateSurface
          tone={lobbyTone}
          eyebrow={canStart ? "Ready to start" : localSeat?.isHost ? "Host status" : "Lobby status"}
          headline={lobbyHeadline}
          copy={lobbyCopy}
          testId="lobby-status-banner"
        />
      </div>

      <SetupStepPanel
        eyebrow="Now"
        title="Seats"
        meta={`${occupiedCount}/${room.playerCount} occupied · ${readyCount}/${room.playerCount} ready`}
        className="lobby-seat-panel"
        actions={
          <SetupActions>
            <Button disabled={!realtimeReady} onClick={() => onReadyChange(!localSeat?.ready)}>
              {localSeat?.ready ? "Mark not ready" : "Mark ready"}
            </Button>
            {localSeat?.isHost ? (
              <Button variant="primary" disabled={!canStart} onClick={onStart}>
                Start game
              </Button>
            ) : null}
          </SetupActions>
        }
      >
        <div className="seat-stack">
          {room.seats.map((seat, index) => {
            const isSelf = seat.seatId === localSeatId;
            const status = getSeatStatus(seat);
            const isEmpty = seat.playerName === null;
            const avatarName = seatAvatars[index];
            return (
              <article
                key={seat.seatId}
                className={`seat-row ${isSelf ? "seat-row--self" : ""} ${isEmpty ? "seat-row--open" : ""}`}
                data-testid={`seat-row-${seat.seatId}`}
              >
                <img
                  className={`seat-avatar ${isEmpty ? "seat-avatar--empty" : ""}`}
                  src={`/avatars/avatar-${avatarName}.svg`}
                  alt={`${seat.playerName || "Open seat"} avatar`}
                />
                <div className="row-object__main">
                  <strong className="row-object__title">
                    {seat.playerName ?? "Open seat"}
                  </strong>
                  <p className="row-object__meta">
                    {isEmpty ? "Waiting for player" : seat.seatId}
                  </p>
                </div>
                <div className="row-object__stats seat-status-stack">
                  <Badge tone={status.tone} className="seat-ready">{status.label}</Badge>
                </div>
              </article>
            );
          })}
        </div>
        {timer?.deadlineAt ? <p className="muted-copy">Timer will activate when the next live turn begins.</p> : null}
      </SetupStepPanel>
    </SetupShell>
  );
}
