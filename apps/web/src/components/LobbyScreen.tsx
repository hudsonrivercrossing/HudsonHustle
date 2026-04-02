import type { RoomSummary, TimerUpdate } from "@hudson-hustle/game-core";
import { IdentityChip } from "./IdentityChip";
import { Chip } from "./system/Chip";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { StatusBanner } from "./system/StatusBanner";

interface LobbyScreenProps {
  room: RoomSummary;
  localSeatId: string;
  playerSecret: string;
  onReadyChange: (ready: boolean) => void;
  onStart: () => void;
  timer: TimerUpdate | null;
  realtimeReady: boolean;
  realtimeMessage: string | null;
}

export function LobbyScreen({
  room,
  localSeatId,
  playerSecret,
  onReadyChange,
  onStart,
  timer,
  realtimeReady,
  realtimeMessage
}: LobbyScreenProps): JSX.Element {
  const localSeat = room.seats.find((seat) => seat.seatId === localSeatId);
  const canStart = realtimeReady && localSeat?.isHost && room.seats.every((seat) => seat.playerName) && room.seats.every((seat) => seat.ready);
  const joinedCount = room.seats.filter((seat) => seat.playerName).length;
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
      ? `Seats joined: ${joinedCount}/${room.playerCount}. Ready: ${readyCount}/${room.playerCount}.`
      : "Share the room code, mark yourself ready, and wait for the host to start.";

  return (
    <main className="setup-shell">
      <section className="setup-card">
        <div className="lobby-header">
          <div>
            <p className="eyebrow">Room Lobby</p>
            <h1>Hudson Hustle</h1>
            <p className="lead">
              Share the room code, let everyone claim a seat, and start once the full table is ready.
            </p>
            <StatusBanner
              tone={lobbyTone}
              eyebrow={canStart ? "Ready to start" : localSeat?.isHost ? "Host status" : "Lobby status"}
              headline={lobbyHeadline}
              copy={lobbyCopy}
              timerLabel={room.turnTimeLimitSeconds === 0 ? "Untimed" : `${room.turnTimeLimitSeconds}s turns`}
              testId="lobby-status-banner"
            />
          </div>
          <IdentityChip roomCode={room.roomCode} seatId={localSeatId} playerSecret={playerSecret} />
        </div>

        <div className="lobby-grid">
          <Panel variant="status">
            <SectionHeader eyebrow="Session details" title="Room" meta={room.roomCode} />
            <p className="muted-copy">Map: {room.mapName}</p>
            <p className="muted-copy">Config: {room.configVersion} · {room.configId}</p>
            <p className="muted-copy">Turn timer: {room.turnTimeLimitSeconds === 0 ? "Untimed" : `${room.turnTimeLimitSeconds}s`}</p>
            {timer?.deadlineAt ? <p className="muted-copy">Next timer activates after game start.</p> : null}
          </Panel>

          <Panel variant="neutral">
            <SectionHeader
              eyebrow="Table state"
              title="Seats"
              meta={`${room.seats.filter((seat) => seat.playerName).length}/${room.playerCount} joined`}
            />
            <div className="seat-stack">
              {room.seats.map((seat) => (
                <article
                  key={seat.seatId}
                  className={`seat-row ${seat.seatId === localSeatId ? "seat-row--self" : ""}`}
                  data-testid={`seat-row-${seat.seatId}`}
                >
                  <div>
                    <strong>{seat.playerName ?? "Open seat"}</strong>
                    <p className="muted-copy">
                      {seat.seatId}
                      {seat.isHost ? " · host" : ""}
                      {seat.connected ? " · connected" : ""}
                    </p>
                  </div>
                  <div className="seat-status-stack">
                    <Chip tone={seat.ready ? "success" : "warning"} className="seat-ready">
                      {seat.ready ? "Ready" : "Waiting"}
                    </Chip>
                    <Chip tone={seat.connected ? "info" : "danger"} className="seat-ready" data-testid={`seat-connected-${seat.seatId}`}>
                      {seat.connected ? "Connected" : "Offline"}
                    </Chip>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="setup-actions">
          <button className="secondary-button" disabled={!realtimeReady} onClick={() => onReadyChange(!localSeat?.ready)}>
            {localSeat?.ready ? "Mark not ready" : "Mark ready"}
          </button>
          {localSeat?.isHost ? (
            <button className="primary-button" disabled={!canStart} onClick={onStart}>
              Start game
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
