import { useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { ReconnectState, RoomSummary } from "@hudson-hustle/game-core";
import { Button } from "./system/Button";
import { FormField } from "./system/FormField";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { StateSurface } from "./system/StateSurface";

interface CreateRoomForm {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
}

interface MultiplayerSetupScreenProps {
  releasedConfigs: HudsonHustleReleasedConfigSummary[];
  reconnectState: ReconnectState;
  roomPreview: RoomSummary | null;
  error: string | null;
  onOpenLocal?: () => void;
  onBack?: () => void;
  onPreviewRoom: (roomCode: string) => void;
  onCreateRoom: (form: CreateRoomForm) => void;
  onJoinRoom: (form: { roomCode: string; playerName: string; preferredSeatId?: string }) => void;
  onManualReconnect: (reconnectToken: string) => void;
}

export function MultiplayerSetupScreen({
  releasedConfigs,
  reconnectState,
  roomPreview,
  error,
  onOpenLocal,
  onBack,
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

  const [manualReconnectToken, setManualReconnectToken] = useState("");

  const openSeats = useMemo(
    () => roomPreview?.seats.filter((seat) => seat.playerName === null) ?? [],
    [roomPreview]
  );
  const setupBannerTone = error || reconnectState === "reconnect-failed" ? "failure" : reconnectState === "attempting-reconnect" ? "waiting" : "neutral";
  const setupBannerEyebrow =
    error || reconnectState === "reconnect-failed" ? "Connection issue" : reconnectState === "attempting-reconnect" ? "Reconnect" : "Separate-device multiplayer";
  const setupBannerHeadline =
    error || reconnectState === "reconnect-failed"
      ? "Multiplayer setup needs attention."
      : reconnectState === "attempting-reconnect"
        ? "Attempting to restore your room."
        : "Create a room or join a table.";
  const setupBannerCopy = error
    ? error
    : reconnectState === "reconnect-failed"
      ? "Saved reconnect token could not reconnect. Use the manual reconnect token below."
      : reconnectState === "attempting-reconnect"
        ? "Checking the saved reconnect token before showing the normal join flow."
        : "Host a released map, share the room code, and move the game state to the server-owned multiplayer flow.";

  return (
    <main className="setup-shell setup-shell--mode">
      <section className="setup-card setup-card--mode">
        <div className="setup-mode-header">
          <div className="setup-mode-header__copy">
            <p className="eyebrow">Online mode</p>
            <h1>Separate-device multiplayer</h1>
            <p className="setup-mode-lead">Create a room, share a short code, and let the server own the game state while each player keeps a private device.</p>
          </div>
          <div className="setup-mode-switches">
            {onBack ? <Button onClick={onBack}>All modes</Button> : null}
            {onOpenLocal ? <Button onClick={onOpenLocal}>Local</Button> : null}
          </div>
        </div>

        <div className="setup-mode-toolbar">
        <StateSurface
          tone={setupBannerTone}
          eyebrow={setupBannerEyebrow}
          headline={setupBannerHeadline}
          copy={setupBannerCopy}
        />
        </div>

        <div className="multiplayer-setup-grid">
          <Panel variant="status" data-testid="create-room-panel">
            <SectionHeader eyebrow="Host flow" title="Create room" meta="Host a new table" />
            <FormField label="Your name">
              <input value={hostName} maxLength={24} onChange={(event) => setHostName(event.target.value)} />
            </FormField>
            <FormField label="Players">
              <select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value) as 2 | 3 | 4)}>
                <option value={2}>2 players</option>
                <option value={3}>3 players</option>
                <option value={4}>4 players</option>
              </select>
            </FormField>
            <FormField label="Released map">
              <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
                {releasedConfigs.map((config) => (
                  <option key={config.configId} value={config.configId}>
                    {config.version} · {config.mapName}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="field">
              <span>Turn timer</span>
              <div className="timer-picker">
                <Button onClick={() => setTurnTimeLimitSeconds((current) => Math.max(0, current - 15))}>
                  −15
                </Button>
                <strong>{turnTimeLimitSeconds}s</strong>
                <Button onClick={() => setTurnTimeLimitSeconds((current) => current + 15)}>
                  +15
                </Button>
              </div>
            </div>
            <Button
              variant="primary"
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
            </Button>
          </Panel>

          <Panel variant="neutral" data-testid="join-room-panel">
            <SectionHeader eyebrow="Guest flow" title="Join room" meta="Pick an open seat" />
            <FormField label="Room code">
              <input value={joinRoomCode} onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())} maxLength={6} />
            </FormField>
            <Button onClick={() => onPreviewRoom(joinRoomCode)}>
              Preview room
            </Button>
            {roomPreview ? (
              <div className="room-preview">
                <p className="muted-copy">
                  {roomPreview.configVersion} · {roomPreview.mapName} · {roomPreview.turnTimeLimitSeconds === 0 ? "Untimed" : `${roomPreview.turnTimeLimitSeconds}s`}
                </p>
                <div className="seat-choice-row">
                  {openSeats.map((seat) => (
                    <Button
                      key={seat.seatId}
                      className={`chip-button ${preferredSeatId === seat.seatId ? "chip-button--selected" : ""}`}
                      onClick={() => setPreferredSeatId(seat.seatId)}
                    >
                      {seat.seatId}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            <FormField label="Your name">
              <input value={joinPlayerName} maxLength={24} onChange={(event) => setJoinPlayerName(event.target.value)} />
            </FormField>
            <Button
              variant="primary"
              onClick={() =>
                onJoinRoom({
                  roomCode: joinRoomCode,
                  playerName: joinPlayerName.trim() || "Player",
                  preferredSeatId
                })
              }
            >
              Join room
            </Button>
          </Panel>
        </div>

        <Panel variant={reconnectState === "reconnect-failed" ? "alert" : "neutral"} className="reconnect-panel">
          <SectionHeader eyebrow="Recovery" title="Manual reconnect" meta="Paste one reconnect token" />
          <FormField label="Reconnect token">
            <input
              value={manualReconnectToken}
              onChange={(event) => setManualReconnectToken(event.target.value)}
              placeholder="hh1."
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </FormField>
          <Button
            disabled={!manualReconnectToken.trim()}
            onClick={() => onManualReconnect(manualReconnectToken)}
          >
            Reconnect
          </Button>
        </Panel>
      </section>
    </main>
  );
}
