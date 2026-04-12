import { useEffect, useMemo, useState } from "react";
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
  isCreatingRoom?: boolean;
  onOpenLocal?: () => void;
  onBack?: () => void;
  onClearRoomPreview?: () => void;
  onPreviewRoom: (roomCode: string) => void;
  onCreateRoom: (form: CreateRoomForm) => void;
  onJoinRoom: (form: { roomCode: string; playerName: string; preferredSeatId?: string }) => void;
  onManualReconnect: (reconnectToken: string) => void;
}

type OnlineSetupStage = "gateway" | "create" | "join";
type SetupFlowStep = 0 | 1 | 2;
type SetupRailStepStatus = "current" | "complete" | "upcoming";

export function MultiplayerSetupScreen({
  releasedConfigs,
  reconnectState,
  roomPreview,
  error,
  isCreatingRoom = false,
  onOpenLocal,
  onBack,
  onClearRoomPreview,
  onPreviewRoom,
  onCreateRoom,
  onJoinRoom,
  onManualReconnect
}: MultiplayerSetupScreenProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.png";
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
  const [stage, setStage] = useState<OnlineSetupStage>(() =>
    reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed" ? "join" : "gateway"
  );
  const [createStep, setCreateStep] = useState<SetupFlowStep>(0);
  const [joinStep, setJoinStep] = useState<SetupFlowStep>(0);

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

  useEffect(() => {
    if (reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed") {
      setStage("join");
      setJoinStep(2);
    }
  }, [reconnectState]);

  useEffect(() => {
    if (stage === "join" && roomPreview && joinStep === 0) {
      setJoinStep(1);
    }
  }, [joinStep, roomPreview, stage]);

  useEffect(() => {
    if (!preferredSeatId) {
      return;
    }

    if (!roomPreview || !openSeats.some((seat) => seat.seatId === preferredSeatId)) {
      setPreferredSeatId(undefined);
    }
  }, [openSeats, preferredSeatId, roomPreview]);

  function getStepStatus(index: number, currentStep: SetupFlowStep): SetupRailStepStatus {
    if (index < currentStep) {
      return "complete";
    }

    if (index === currentStep) {
      return "current";
    }

    return "upcoming";
  }

  const title =
    stage === "gateway" ? "Online" : stage === "create" ? "Start game" : "Join room";
  const subtitle =
    stage === "gateway"
      ? "Choose how this table begins."
      : stage === "create"
        ? "Set the seats and create the room."
        : "Enter a code, choose a seat, or restore a session.";
  const backLabel = stage === "gateway" ? "Back" : "Back";
  const showBanner =
    Boolean(error) || (stage === "join" && (reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed"));
  const railSteps =
    stage === "gateway"
      ? [
          { label: "Choose line", meta: "Host or guest", status: "current" as const },
          { label: "Start game", meta: "Build the room", status: "upcoming" as const },
          { label: "Join room", meta: "Enter by code", status: "upcoming" as const }
        ]
      : stage === "create"
        ? [
            { label: "Host", meta: "Who is starting", status: getStepStatus(0, createStep) },
            { label: "Seats", meta: "Players and bots", status: getStepStatus(1, createStep) },
            { label: "Board", meta: "Map and timer", status: getStepStatus(2, createStep) }
          ]
        : [
            { label: "Room code", meta: "Preview first", status: getStepStatus(0, joinStep) },
            { label: "Seat", meta: "Open human seat", status: getStepStatus(1, joinStep) },
            { label: "Enter room", meta: "Name and join", status: getStepStatus(2, joinStep) }
          ];

  function returnToGateway(): void {
    setStage("gateway");
    setCreateStep(0);
    setJoinStep(0);
    setPreferredSeatId(undefined);
    onClearRoomPreview?.();
  }

  return (
    <main
      className="setup-shell setup-shell--mode setup-shell--atmospheric"
      style={{
        ["--setup-gateway-image" as string]: `url("${setupHeroImageUrl}")`
      }}
    >
      <section className="setup-card setup-card--mode setup-card--atmospheric">
        <aside className="setup-mode-rail">
          <div className="setup-mode-rail__copy">
            <p className="setup-mode-rail__eyebrow">Station guide</p>
            <h1>{title}</h1>
            <p className="setup-mode-rail__lead">{subtitle}</p>
          </div>
          <div className="setup-mode-rail__track" aria-label="Setup flow">
            {railSteps.map((step, index) => (
              <div key={step.label} className={`setup-mode-rail__step setup-mode-rail__step--${step.status}`}>
                <span className="setup-mode-rail__step-index">{step.status === "complete" ? "OK" : `0${index + 1}`}</span>
                <div className="setup-mode-rail__step-copy">
                  <strong>{step.label}</strong>
                  <span>{step.meta}</span>
                </div>
                <em className="setup-mode-rail__step-state">
                  {step.status === "current" ? "Now" : step.status === "complete" ? "Done" : "Next"}
                </em>
              </div>
            ))}
          </div>
        </aside>

        <div className="setup-mode-stage">
          <div className="setup-mode-stage__header">
            <div className="setup-mode-stage__switches">
              {stage === "gateway" ? null : (
                <>
                  <button
                    type="button"
                    className={`setup-mode-switch ${stage === "create" ? "setup-mode-switch--active" : ""}`}
                    onClick={() => {
                      onClearRoomPreview?.();
                      setCreateStep(0);
                      setStage("create");
                    }}
                  >
                    Start game
                  </button>
                  <button
                    type="button"
                    className={`setup-mode-switch ${stage === "join" ? "setup-mode-switch--active" : ""}`}
                    onClick={() => {
                      setStage("join");
                      setJoinStep(roomPreview ? 1 : 0);
                    }}
                  >
                    Join room
                  </button>
                </>
              )}
            </div>
            <div className="setup-mode-switches">
              {stage === "gateway"
                ? onBack
                  ? <Button className="setup-mode-back" onClick={onBack}>{backLabel}</Button>
                  : null
                : <Button className="setup-mode-back" onClick={returnToGateway}>{backLabel}</Button>}
            </div>
          </div>

          {showBanner ? (
            <div className="setup-mode-toolbar">
              <StateSurface
                tone={setupBannerTone}
                eyebrow={setupBannerEyebrow}
                headline={setupBannerHeadline}
                copy={setupBannerCopy}
              />
            </div>
          ) : null}

          {stage === "gateway" ? (
            <div className="setup-entry-grid" data-testid="online-mode-gateway">
              <button
                type="button"
                className="setup-entry-card"
                onClick={() => {
                  onClearRoomPreview?.();
                  setCreateStep(0);
                  setStage("create");
                }}
                data-testid="online-start-game"
              >
                <span className="setup-entry-card__eyebrow">Host flow</span>
                <strong className="setup-entry-card__title">Start game</strong>
                <span className="setup-entry-card__copy">Build the table, set seats, then share the code.</span>
              </button>
              <button
                type="button"
                className="setup-entry-card"
                onClick={() => {
                  setJoinStep(roomPreview ? 1 : 0);
                  setStage("join");
                }}
                data-testid="online-join-room"
              >
                <span className="setup-entry-card__eyebrow">Guest flow</span>
                <strong className="setup-entry-card__title">Join room</strong>
                <span className="setup-entry-card__copy">Preview the room, claim a seat, and enter.</span>
              </button>
            </div>
          ) : null}

          {stage === "create" ? (
            <div className="setup-flow-grid setup-flow-grid--create" data-testid="create-room-panel">
              {createStep === 0 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Host" meta="Who is starting this room" />
                  <div className="setup-mode-panel__field-grid">
                    <FormField label="Your name">
                      <input value={hostName} maxLength={24} onChange={(event) => setHostName(event.target.value)} />
                    </FormField>
                  </div>
                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Host</span>
                      <strong>{hostName.trim() || "Host"}</strong>
                    </div>
                  </div>
                  <div className="setup-mode-panel__actions">
                    <Button variant="primary" onClick={() => setCreateStep(1)}>
                      Continue to seats
                    </Button>
                  </div>
                </Panel>
              ) : null}

              {createStep === 1 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Seats" meta={`${plannedBotCount} bot · ${plannedHumanOpenSeats} human open`} />
                  <div className="setup-mode-panel__field-grid">
                    <FormField label="Players">
                      <select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value) as 2 | 3 | 4)}>
                        <option value={2}>2 players</option>
                        <option value={3}>3 players</option>
                        <option value={4}>4 players</option>
                      </select>
                    </FormField>
                  </div>

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

                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Human seats</span>
                      <strong>{Math.max(1, playerCount - plannedBotCount)}</strong>
                    </div>
                    <div className="setup-mode-summary__item">
                      <span>Bot seats</span>
                      <strong>{plannedBotCount}</strong>
                    </div>
                  </div>
                  <div className="setup-mode-panel__actions setup-mode-panel__actions--split">
                    <Button onClick={() => setCreateStep(0)}>Back</Button>
                    <Button variant="primary" onClick={() => setCreateStep(2)}>
                      Continue to board
                    </Button>
                  </div>
                </Panel>
              ) : null}

              {createStep === 2 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Board" meta="Map, timer, and launch" />
                  <div className="setup-mode-panel__field-grid setup-mode-panel__field-grid--split">
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
                        <Button onClick={() => setTurnTimeLimitSeconds((current) => Math.max(0, current - 15))}>−15</Button>
                        <output className="timer-picker__value" aria-live="polite">
                          {turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`}
                        </output>
                        <Button onClick={() => setTurnTimeLimitSeconds((current) => current + 15)}>+15</Button>
                      </div>
                    </FormField>
                  </div>
                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Map</span>
                      <strong>{releasedConfigs.find((config) => config.configId === configId)?.mapName ?? "Map"}</strong>
                    </div>
                    <div className="setup-mode-summary__item">
                      <span>Timer</span>
                      <strong>{turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`}</strong>
                    </div>
                  </div>
                  <div className="setup-mode-panel__actions setup-mode-panel__actions--split">
                    <Button onClick={() => setCreateStep(1)}>Back</Button>
                    <Button
                      variant="primary"
                      disabled={isCreatingRoom}
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
                      {isCreatingRoom ? "Creating room..." : "Create room"}
                    </Button>
                  </div>
                </Panel>
              ) : null}
            </div>
          ) : null}

          {stage === "join" ? (
            <div className="setup-flow-grid setup-flow-grid--join" data-testid="join-room-panel">
              {joinStep === 0 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Room code" meta="Preview first" />
                  <div className="setup-mode-panel__field-grid setup-mode-panel__field-grid--launch">
                    <FormField label="Room code">
                      <input
                        value={joinRoomCode}
                        onChange={(event) => {
                          setJoinRoomCode(event.target.value.toUpperCase());
                          setPreferredSeatId(undefined);
                          onClearRoomPreview?.();
                        }}
                        maxLength={6}
                      />
                    </FormField>
                    <Button className="join-preview-button" onClick={() => onPreviewRoom(joinRoomCode)}>
                      Preview
                    </Button>
                  </div>
                  {roomPreview ? (
                    <div className="room-preview">
                      <p className="muted-copy">
                        {roomPreview.configVersion} · {roomPreview.mapName} · {roomPreview.turnTimeLimitSeconds === 0 ? "Untimed" : `${roomPreview.turnTimeLimitSeconds}s`}
                      </p>
                    </div>
                  ) : null}
                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Room</span>
                      <strong>{joinRoomCode || "------"}</strong>
                    </div>
                  </div>
                </Panel>
              ) : null}

              {joinStep === 1 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Seat" meta={roomPreview ? `${openSeats.length} open` : "Preview a room to reveal seats."} />
                  {roomPreview ? (
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
                  ) : null}
                  {roomPreview && openSeats.length === 0 ? <p className="muted-copy room-preview__empty">No open human seats left in this room.</p> : null}
                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Room</span>
                      <strong>{joinRoomCode || "------"}</strong>
                    </div>
                    <div className="setup-mode-summary__item">
                      <span>Chosen seat</span>
                      <strong>{preferredSeatId ?? "Pick one"}</strong>
                    </div>
                  </div>
                  <div className="setup-mode-panel__actions setup-mode-panel__actions--split">
                    <Button onClick={() => setJoinStep(0)}>Back</Button>
                    <Button
                      variant="primary"
                      disabled={!roomPreview || !preferredSeatId || !openSeats.some((seat) => seat.seatId === preferredSeatId)}
                      onClick={() => setJoinStep(2)}
                    >
                      Continue to enter
                    </Button>
                  </div>
                </Panel>
              ) : null}

              {joinStep === 2 ? (
                <Panel variant="status" className="setup-wizard-card">
                  <SectionHeader eyebrow="Now" title="Enter room" meta="Name first, recovery second" />
                  <FormField label="Your name">
                    <input value={joinPlayerName} maxLength={24} onChange={(event) => setJoinPlayerName(event.target.value)} />
                  </FormField>

                  <details className="setup-recovery-details">
                    <summary>Use reconnect token instead</summary>
                    <div className="setup-subsection setup-subsection--compact">
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
                      <Button disabled={!manualReconnectToken.trim()} onClick={() => onManualReconnect(manualReconnectToken)}>
                        Reconnect
                      </Button>
                    </div>
                  </details>

                  <div className="setup-mode-summary setup-mode-summary--compact">
                    <div className="setup-mode-summary__item">
                      <span>Room</span>
                      <strong>{joinRoomCode || "------"}</strong>
                    </div>
                    <div className="setup-mode-summary__item">
                      <span>Seat</span>
                      <strong>{preferredSeatId ?? "Pick one"}</strong>
                    </div>
                  </div>
                  <div className="setup-mode-panel__actions setup-mode-panel__actions--split">
                    <Button onClick={() => setJoinStep(1)}>Back</Button>
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
                  </div>
                </Panel>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
