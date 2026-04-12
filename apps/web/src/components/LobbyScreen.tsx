import type { RoomSummary, TimerUpdate } from "@hudson-hustle/game-core";
import { IdentityChip } from "./IdentityChip";
import { Button } from "./system/Button";
import { Chip } from "./system/Chip";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { StateSurface } from "./system/StateSurface";
import { UtilityPill } from "./system/UtilityPill";

interface LobbyScreenProps {
  room: RoomSummary;
  localSeatId: string;
  reconnectToken: string;
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
  reconnectToken,
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

  return (
    <main
      className="setup-shell setup-shell--mode setup-shell--atmospheric"
      style={{
        ["--setup-gateway-image" as string]: `url("${setupHeroImageUrl}")`
      }}
    >
      <section className="setup-card setup-card--mode setup-card--atmospheric">
        <aside className="setup-mode-rail lobby-mode-rail">
          <div className="setup-mode-rail__copy">
            <p className="setup-mode-rail__eyebrow">Room lobby</p>
            <h1>Boarding</h1>
            <p className="setup-mode-rail__lead">Seats, readiness, and departure stay here until the host starts the table.</p>
          </div>
          <div className="setup-mode-rail__track" aria-label="Lobby guide">
            <div className="setup-mode-rail__step setup-mode-rail__step--current">
              <span className="setup-mode-rail__step-index">NOW</span>
              <div className="setup-mode-rail__step-copy">
                <strong>{room.roomCode}</strong>
                <span>{room.mapName}</span>
              </div>
            </div>
            <div className="setup-mode-rail__step">
              <span className="setup-mode-rail__step-index">SEATS</span>
              <div className="setup-mode-rail__step-copy">
                <strong>{occupiedCount}/{room.playerCount} occupied</strong>
                <span>{readyCount}/{room.playerCount} ready</span>
              </div>
            </div>
            <div className="setup-mode-rail__step">
              <span className="setup-mode-rail__step-index">TIMER</span>
              <div className="setup-mode-rail__step-copy">
                <strong>{room.turnTimeLimitSeconds === 0 ? "Untimed" : `${room.turnTimeLimitSeconds}s`}</strong>
                <span>{canStart ? "Ready to depart" : "Waiting in lobby"}</span>
              </div>
            </div>
          </div>
          <IdentityChip reconnectToken={reconnectToken} />
        </aside>

        <div className="setup-mode-stage lobby-mode-stage">
          <StateSurface
            tone={lobbyTone}
            eyebrow={canStart ? "Ready to start" : localSeat?.isHost ? "Host status" : "Lobby status"}
            headline={lobbyHeadline}
            copy={lobbyCopy}
            testId="lobby-status-banner"
          />

          <Panel variant="status" className="setup-wizard-card lobby-wizard-card lobby-seat-panel">
            <SectionHeader
              eyebrow="Now"
              title="Seats"
              meta={`${occupiedCount}/${room.playerCount} occupied · ${readyCount}/${room.playerCount} ready`}
            />
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

            <div className="setup-mode-panel__actions setup-mode-panel__actions--split">
              <Button onClick={onLeaveRoom}>Leave room</Button>
              <div className="setup-actions">
                <Button disabled={!realtimeReady} onClick={() => onReadyChange(!localSeat?.ready)}>
                  {localSeat?.ready ? "Mark not ready" : "Mark ready"}
                </Button>
                {localSeat?.isHost ? (
                  <Button variant="primary" disabled={!canStart} onClick={onStart}>
                    Start game
                  </Button>
                ) : null}
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
