import type { RoomSummary, TimerUpdate } from "@hudson-hustle/game-core";
import {
  MapThumbnail,
  SetupActions,
  SetupBackButton,
  SetupShell,
  SetupStepPanel,
  SetupSummaryRow,
  type SetupStep
} from "./setup/SetupPrimitives";
import { Button } from "./system/Button";
import { Chip } from "./system/Chip";
import { StateSurface } from "./system/StateSurface";

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
  const canStart = realtimeReady && localSeat?.isHost && room.seats.every((seat) => seat.playerName) && room.seats.every((seat) => seat.ready);
  const occupiedCount = room.seats.filter((seat) => seat.playerName).length;
  const readyCount = room.seats.filter((seat) => seat.ready).length;
  const lobbyTone = realtimeMessage ? "failure" : canStart ? "active" : "waiting";
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
          {room.seats.map((seat) => (
            <article
              key={seat.seatId}
              className={`seat-row ${seat.seatId === localSeatId ? "seat-row--self" : ""}`}
              data-testid={`seat-row-${seat.seatId}`}
            >
              <div className="row-object__main">
                <strong className="row-object__title">{seat.playerName ?? "Open seat"}</strong>
                <p className="row-object__meta">
                  {seat.seatId}
                  {seat.isHost ? " · host" : ""}
                  {seat.controllerType === "bot" ? " · server-owned bot" : seat.playerName ? seat.connected ? " · connected" : " · offline" : ""}
                </p>
              </div>
              <div className="row-object__stats seat-status-stack">
                {seat.playerName === null ? (
                  <Chip tone="neutral" className="seat-ready">
                    Open
                  </Chip>
                ) : seat.controllerType === "bot" ? (
                  <>
                    <Chip tone="info" className="seat-ready">
                      Bot
                    </Chip>
                    <Chip tone="success" className="seat-ready" data-testid={`seat-connected-${seat.seatId}`}>
                      Server
                    </Chip>
                  </>
                ) : (
                  <>
                    <Chip tone={seat.ready ? "success" : "warning"} className="seat-ready">
                      {seat.ready ? "Ready" : "Waiting"}
                    </Chip>
                    <Chip tone={seat.connected ? "info" : "danger"} className="seat-ready" data-testid={`seat-connected-${seat.seatId}`}>
                      {seat.connected ? "Connected" : "Offline"}
                    </Chip>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
        {timer?.deadlineAt ? <p className="muted-copy">Timer will activate when the next live turn begins.</p> : null}
      </SetupStepPanel>
    </SetupShell>
  );
}
