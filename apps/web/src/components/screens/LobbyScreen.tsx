import type { RoomSummary, RoomSeatSummary, TimerUpdate } from "@hudson-hustle/game-core";
import {
  MapThumbnail,
  SetupActions,
  SetupBackButton,
  SetupShell,
  SetupStepPanel,
  SetupSummaryRow
} from "../setup";
import { Badge } from "../ui/primitives/Badge";
import { Button } from "../ui/primitives/Button";
import { InviteLinkButton } from "../online/InviteLinkButton";
import { StateSurface } from "../ui/primitives/StateSurface";

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

function describeSeat(seat: RoomSeatSummary, isSelf: boolean): string {
  if (seat.playerName === null) return "Waiting for a player";
  if (seat.controllerType === "bot") return "Plays automatically";
  const role = seat.isHost ? "Host" : "Player";
  return isSelf ? `${role} · you` : role;
}

/** One sentence on what the lobby is waiting for, and one on what to do about it. */
function describeLobby(room: RoomSummary, localSeat: RoomSeatSummary | undefined, canStart: boolean): { headline: string; copy: string } {
  if (canStart) {
    return { headline: "Everyone is ready.", copy: "Start the game when you like." };
  }
  const openSeats = room.seats.filter((seat) => seat.playerName === null).length;
  if (openSeats > 0) {
    return {
      headline: openSeats === 1 ? "Waiting for one more player." : `Waiting for ${openSeats} more players.`,
      copy: "Send the invite link. Anyone who opens it can take an open seat."
    };
  }
  if (localSeat && !localSeat.ready) {
    return { headline: "Mark yourself ready.", copy: "The game can start once every seat is ready." };
  }
  const waitingOn = room.seats.filter((seat) => !seat.ready && seat.playerName).map((seat) => seat.playerName as string);
  if (waitingOn.length > 0) {
    return { headline: `Waiting for ${waitingOn.join(" and ")}.`, copy: "The game can start once every seat is ready." };
  }
  return { headline: "Waiting for the host to start.", copy: "Every seat is ready." };
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
  const { headline: lobbyHeadline, copy: lobbyCopy } = realtimeMessage
    ? { headline: "Connection lost.", copy: realtimeMessage }
    : describeLobby(room, localSeat, Boolean(canStart));
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
      backAction={<SetupBackButton onClick={onLeaveRoom}>Leave room</SetupBackButton>}
      preflight={lobbyPreflight}
      className="setup-board-shell--lobby"
    >
      <div className="setup-counter__status">
        <StateSurface
          tone={lobbyTone}
          eyebrow={`Room ${room.roomCode}`}
          headline={lobbyHeadline}
          copy={lobbyCopy}
          testId="lobby-status-banner"
        />
      </div>

      <SetupStepPanel
        eyebrow="Table"
        title="Seats"
        meta={`${occupiedCount}/${room.playerCount} occupied · ${readyCount}/${room.playerCount} ready`}
        className="lobby-seat-panel"
        actions={
          <SetupActions>
            <InviteLinkButton roomCode={room.roomCode} />
            <Button variant={localSeat?.ready ? "secondary" : "primary"} disabled={!realtimeReady} onClick={() => onReadyChange(!localSeat?.ready)}>
              {localSeat?.ready ? "Mark not ready" : "Mark ready"}
            </Button>
            {localSeat?.isHost ? (
              <Button variant={localSeat.ready ? "primary" : "secondary"} disabled={!canStart} onClick={onStart}>
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
                data-host={seat.isHost}
                data-connection={isEmpty ? "open" : seat.controllerType === "bot" ? "server" : seat.connected ? "connected" : "offline"}
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
                    {describeSeat(seat, isSelf)}
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
