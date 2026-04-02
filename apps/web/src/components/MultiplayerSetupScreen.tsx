import { useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { ReconnectState, RoomSummary } from "@hudson-hustle/game-core";

interface CreateRoomForm {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
}

interface ManualReconnectForm {
  roomCode: string;
  seatId: string;
  playerSecret: string;
}

interface MultiplayerSetupScreenProps {
  releasedConfigs: HudsonHustleReleasedConfigSummary[];
  reconnectState: ReconnectState;
  roomPreview: RoomSummary | null;
  error: string | null;
  onPreviewRoom: (roomCode: string) => void;
  onCreateRoom: (form: CreateRoomForm) => void;
  onJoinRoom: (form: { roomCode: string; playerName: string; preferredSeatId?: string }) => void;
  onManualReconnect: (form: ManualReconnectForm) => void;
}

export function MultiplayerSetupScreen({
  releasedConfigs,
  reconnectState,
  roomPreview,
  error,
  onPreviewRoom,
  onCreateRoom,
  onJoinRoom,
  onManualReconnect
}: MultiplayerSetupScreenProps): JSX.Element {
  const latestConfigId = releasedConfigs.at(-1)?.configId ?? "v0.4-flushing-newark-airport";
  const [hostName, setHostName] = useState("Host");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [configId, setConfigId] = useState(latestConfigId);
  const [turnTimeLimitSeconds, setTurnTimeLimitSeconds] = useState(0);

  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("Player");
  const [preferredSeatId, setPreferredSeatId] = useState<string | undefined>(undefined);

  const [manualRoomCode, setManualRoomCode] = useState("");
  const [manualSeatId, setManualSeatId] = useState("");
  const [manualSecret, setManualSecret] = useState("");

  const openSeats = useMemo(
    () => roomPreview?.seats.filter((seat) => seat.playerName === null) ?? [],
    [roomPreview]
  );

  return (
    <main className="setup-shell">
      <section className="setup-card">
        <p className="eyebrow">MVP2 Multiplayer</p>
        <h1>Hudson Hustle</h1>
        <p className="lead">
          Create a room, share a code, and play the released NYC/NJ maps from separate devices with server-owned game state.
        </p>
        {error ? <p className="error-banner">{error}</p> : null}
        {reconnectState === "attempting-reconnect" ? <p className="muted-copy">Attempting silent reconnect…</p> : null}
        {reconnectState === "reconnect-failed" ? <p className="muted-copy">Saved room credentials failed. Use manual reconnect below.</p> : null}

        <div className="multiplayer-setup-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Create room</h2>
              <span>Host a new table</span>
            </div>
            <label className="field">
              <span>Your name</span>
              <input value={hostName} maxLength={24} onChange={(event) => setHostName(event.target.value)} />
            </label>
            <label className="field">
              <span>Players</span>
              <select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value) as 2 | 3 | 4)}>
                <option value={2}>2 players</option>
                <option value={3}>3 players</option>
                <option value={4}>4 players</option>
              </select>
            </label>
            <label className="field">
              <span>Released map</span>
              <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
                {releasedConfigs.map((config) => (
                  <option key={config.configId} value={config.configId}>
                    {config.version} · {config.mapName}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Turn timer</span>
              <div className="timer-picker">
                <button className="secondary-button" onClick={() => setTurnTimeLimitSeconds((current) => Math.max(0, current - 15))}>
                  −15
                </button>
                <strong>{turnTimeLimitSeconds}s</strong>
                <button className="secondary-button" onClick={() => setTurnTimeLimitSeconds((current) => current + 15)}>
                  +15
                </button>
              </div>
            </div>
            <button
              className="primary-button"
              onClick={() =>
                onCreateRoom({
                  hostName: hostName.trim() || "Host",
                  playerCount,
                  configId,
                  turnTimeLimitSeconds
                })
              }
            >
              Create room
            </button>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Join room</h2>
              <span>Pick an open seat</span>
            </div>
            <label className="field">
              <span>Room code</span>
              <input value={joinRoomCode} onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())} maxLength={6} />
            </label>
            <button className="secondary-button" onClick={() => onPreviewRoom(joinRoomCode)}>
              Preview room
            </button>
            {roomPreview ? (
              <div className="room-preview">
                <p className="muted-copy">
                  {roomPreview.configVersion} · {roomPreview.mapName} · {roomPreview.turnTimeLimitSeconds === 0 ? "Untimed" : `${roomPreview.turnTimeLimitSeconds}s`}
                </p>
                <div className="seat-choice-row">
                  {openSeats.map((seat) => (
                    <button
                      key={seat.seatId}
                      className={`chip-button ${preferredSeatId === seat.seatId ? "chip-button--selected" : ""}`}
                      onClick={() => setPreferredSeatId(seat.seatId)}
                    >
                      {seat.seatId}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="field">
              <span>Your name</span>
              <input value={joinPlayerName} maxLength={24} onChange={(event) => setJoinPlayerName(event.target.value)} />
            </label>
            <button
              className="primary-button"
              onClick={() =>
                onJoinRoom({
                  roomCode: joinRoomCode,
                  playerName: joinPlayerName.trim() || "Player",
                  preferredSeatId
                })
              }
            >
              Join room
            </button>
          </section>
        </div>

        <section className="panel reconnect-panel">
          <div className="panel-header">
            <h2>Manual reconnect</h2>
            <span>Use your hidden session chip</span>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Room code</span>
              <input value={manualRoomCode} onChange={(event) => setManualRoomCode(event.target.value.toUpperCase())} />
            </label>
            <label className="field">
              <span>Seat id</span>
              <input value={manualSeatId} onChange={(event) => setManualSeatId(event.target.value)} />
            </label>
            <label className="field">
              <span>Player secret</span>
              <input value={manualSecret} onChange={(event) => setManualSecret(event.target.value)} />
            </label>
          </div>
          <button
            className="secondary-button"
            onClick={() =>
              onManualReconnect({
                roomCode: manualRoomCode,
                seatId: manualSeatId,
                playerSecret: manualSecret
              })
            }
          >
            Reconnect
          </button>
        </section>
      </section>
    </main>
  );
}
