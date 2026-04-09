import { useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { ReconnectState, RoomSummary } from "@hudson-hustle/game-core";
import { Button } from "./system/Button";
import { Chip } from "./system/Chip";
import { FormField } from "./system/FormField";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { StateSurface } from "./system/StateSurface";

interface CreateRoomForm {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds: string[];
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
  const [botSeatIds, setBotSeatIds] = useState<string[]>([]);

  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("Player");
  const [preferredSeatId, setPreferredSeatId] = useState<string | undefined>(undefined);

  const [manualReconnectToken, setManualReconnectToken] = useState("");

  const openSeats = useMemo(
    () => roomPreview?.seats.filter((seat) => seat.playerName === null) ?? [],
    [roomPreview]
  );
  const setupSeatIds = useMemo(
    () => Array.from({ length: playerCount }, (_, index) => `seat-${index + 1}`),
    [playerCount]
  );
  const plannedBotCount = botSeatIds.filter((seatId) => seatId !== "seat-1" && setupSeatIds.includes(seatId)).length;
  const plannedHumanOpenSeats = Math.max(0, playerCount - 1 - plannedBotCount);
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
      ? "Saved reconnect token failed. Use the manual reconnect field below."
      : reconnectState === "attempting-reconnect"
        ? "Checking the saved reconnect token first."
        : "Host a table or join one by room code.";

  return (
    <main className="setup-shell setup-shell--mode">
      <section className="setup-card setup-card--mode">
        <div className="setup-mode-header">
          <div className="setup-mode-header__copy">
            <p className="eyebrow">Online mode</p>
            <h1>Separate-device multiplayer</h1>
            <p className="setup-mode-lead">Create a room, share a short code, and keep each hand private.</p>
          </div>
          <div className="setup-mode-switches">
            {onBack ? <Button onClick={onBack}>Back</Button> : null}
            {onOpenLocal ? <Button onClick={onOpenLocal}>Shared laptop</Button> : null}
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
          <Panel variant="status" className="multiplayer-setup-panel multiplayer-setup-panel--primary" data-testid="create-room-panel">
            <SectionHeader eyebrow="Host flow" title="Create room" meta="Start a new table" />
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
            <FormField as="div" label="Seat plan" helper={`${plannedBotCount} bot · ${plannedHumanOpenSeats} human open`}>
              <div className="seat-plan">
                {setupSeatIds.map((seatId, index) => {
                  const isHostSeat = seatId === "seat-1";
                  const isBotSeat = botSeatIds.includes(seatId);
                  return (
                    <div key={seatId} className={`seat-plan__row ${isBotSeat ? "seat-plan__row--bot" : ""}`} data-testid={`seat-plan-${seatId}`}>
                      <div className="seat-plan__copy">
                        <strong className="seat-plan__title">{seatId}</strong>
                        <span className="seat-plan__meta">
                          {isHostSeat ? "Host seat" : isBotSeat ? `Bot ${index}` : "Open human seat"}
                        </span>
                      </div>
                      {isHostSeat ? (
                        <Chip tone="info">Host</Chip>
                      ) : (
                        <button
                          type="button"
                          className={`chip-button seat-plan__toggle ${isBotSeat ? "chip-button--selected" : ""}`}
                          data-testid={`seat-plan-toggle-${seatId}`}
                          onClick={() =>
                            setBotSeatIds((current) =>
                              current.includes(seatId) ? current.filter((entry) => entry !== seatId) : [...current, seatId]
                            )
                          }
                        >
                          {isBotSeat ? "Bot" : "Open"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </FormField>
            <FormField label="Map">
              <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
                {releasedConfigs.map((config) => (
                  <option key={config.configId} value={config.configId}>
                    {config.version} · {config.mapName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField as="div" label="Timer" className="form-field--timer">
              <div className="timer-picker">
                <Button onClick={() => setTurnTimeLimitSeconds((current) => Math.max(0, current - 15))}>
                  −15
                </Button>
                <output className="timer-picker__value" aria-live="polite">
                  {turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`}
                </output>
                <Button onClick={() => setTurnTimeLimitSeconds((current) => current + 15)}>
                  +15
                </Button>
              </div>
            </FormField>
            <Button
              variant="primary"
              onClick={() =>
                onCreateRoom({
                  hostName: hostName.trim() || "Host",
                  playerCount,
                  configId,
                  turnTimeLimitSeconds,
                  botSeatIds: botSeatIds.filter((seatId) => setupSeatIds.includes(seatId))
                })
              }
            >
              Create room
            </Button>
          </Panel>

          <Panel variant="neutral" className="multiplayer-setup-panel multiplayer-setup-panel--secondary" data-testid="join-room-panel">
            <SectionHeader eyebrow="Guest flow" title="Join room" meta="Room code + seat" />
            <FormField label="Room code">
              <input value={joinRoomCode} onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())} maxLength={6} />
            </FormField>
            <Button className="join-preview-button" onClick={() => onPreviewRoom(joinRoomCode)}>
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
                {openSeats.length === 0 ? <p className="muted-copy room-preview__empty">No open human seats left in this room.</p> : null}
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

        <Panel
          variant={reconnectState === "reconnect-failed" ? "alert" : "neutral"}
          className="reconnect-panel multiplayer-setup-panel multiplayer-setup-panel--tertiary"
        >
          <SectionHeader eyebrow="Recovery" title="Reconnect" meta="Paste one token" />
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
