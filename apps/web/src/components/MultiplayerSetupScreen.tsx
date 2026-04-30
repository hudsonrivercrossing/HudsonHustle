import { useEffect, useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { ReconnectState, RoomSummary } from "@hudson-hustle/game-core";
import { FormField } from "./system/FormField";
import { StateSurface } from "./system/StateSurface";
import {
  DepartureBoardTile,
  MapThumbnail,
  ModeSwitch,
  SetupActions,
  SetupBackButton,
  SetupShell,
  SetupStepPanel,
  SetupSummaryRow,
  SetupTicketSlip,
  TokenButton,
  type SetupStep
} from "./setup";
import { Button } from "./system/Button";

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
}

type OnlineSetupStage = "gateway" | "create" | "join";
type SetupFlowStep = 0 | 1 | 2 | 3;

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
  onJoinRoom
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
      ? "Saved room recovery failed. Enter the room code again to board."
      : reconnectState === "attempting-reconnect"
        ? "Checking the saved room session first."
        : "Host a table or join one by room code.";

  useEffect(() => {
    if (reconnectState === "attempting-reconnect") {
      setStage("join");
      setJoinStep(2);
      return;
    }

    if (reconnectState === "reconnect-failed") {
      setStage("join");
      setJoinStep(0);
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

  function getStepStatus(index: number, currentStep: SetupFlowStep): SetupStep["status"] {
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
      ? "Host a room or board by code."
      : stage === "create"
        ? "Seat the crew, pick the board, and send the room code."
        : "Punch in the code, claim a seat, and board before departure.";
  const backLabel = stage === "gateway" ? "Back" : "Back";
  const showBanner =
    Boolean(error) || (stage === "join" && (reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed"));
  const selectedConfig = releasedConfigs.find((config) => config.configId === configId);
  const previewConfig =
    roomPreview
      ? { configId: roomPreview.configId, version: roomPreview.configVersion, mapName: roomPreview.mapName, summary: "" }
      : null;
  const railSteps: SetupStep[] =
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
          { label: "Map", meta: "Choose board", status: getStepStatus(2, createStep) },
          { label: "Timer", meta: "Launch check", status: getStepStatus(3, createStep) }
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

  function chooseStage(nextStage: OnlineSetupStage): void {
    if (nextStage === "create") {
      onClearRoomPreview?.();
      setCreateStep(0);
      setStage("create");
      return;
    }
    if (nextStage === "join") {
      setStage("join");
      setJoinStep(roomPreview ? 1 : 0);
    }
  }

  const modeSwitch =
    stage === "gateway" ? null : (
      <ModeSwitch
        value={stage}
        options={[
          { value: "create", label: "Start game" },
          { value: "join", label: "Join room" }
        ]}
        onChange={chooseStage}
      />
    );

  const createPreflight = (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">{createStep >= 3 ? "Table preflight" : "Table ticket"}</span>
      {createStep >= 2 ? (
        <MapThumbnail
          configId={selectedConfig?.configId ?? configId}
          mapName={selectedConfig?.mapName ?? "Hudson Hustle"}
          version={selectedConfig?.version}
        />
      ) : (
        <SetupTicketSlip
          className="setup-room-code-plate--table"
          ariaLabel="Table setup ticket"
          label={createStep === 0 ? "Host" : "Seats"}
          value={createStep === 0 ? hostName.trim() || "Host" : `${Math.max(1, playerCount - plannedBotCount)} human`}
          detail={createStep >= 1 ? `${plannedBotCount} bot` : undefined}
        />
      )}
      {createStep >= 1 ? (
        <div className="setup-summary-stack">
          <SetupSummaryRow label="Host" value={hostName.trim() || "Host"} />
          {createStep >= 2 ? (
            <SetupSummaryRow label="Seats" value={`${Math.max(1, playerCount - plannedBotCount)} human`} detail={`${plannedBotCount} bot`} />
          ) : null}
          {createStep >= 3 ? (
            <>
              <SetupSummaryRow label="Map" value={selectedConfig?.mapName ?? "Map"} />
              <SetupSummaryRow label="Timer" value={turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const joinPreflight = (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">{roomPreview ? "Room board" : "Room ticket"}</span>
      {previewConfig ? (
        <MapThumbnail configId={previewConfig.configId} mapName={previewConfig.mapName} version={previewConfig.version} />
      ) : (
        <SetupTicketSlip ariaLabel="No room preview yet" label="Room" value={joinRoomCode || "------"} />
      )}
      {joinStep > 0 || roomPreview ? (
        <div className="setup-summary-stack">
          <SetupSummaryRow label="Room" value={joinRoomCode || "------"} />
          {roomPreview ? <SetupSummaryRow label="Status" value={`${openSeats.length} open`} /> : null}
          {joinStep >= 2 ? <SetupSummaryRow label="Seat" value={preferredSeatId ?? "Pick one"} /> : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <SetupShell
      eyebrow="Station counter"
      title={title}
      lead={subtitle}
      backgroundImageUrl={setupHeroImageUrl}
      steps={railSteps}
      modeSwitch={modeSwitch}
      backAction={
        stage === "gateway"
          ? onBack
            ? <SetupBackButton onClick={onBack}>{backLabel}</SetupBackButton>
            : null
          : <SetupBackButton onClick={returnToGateway}>{backLabel}</SetupBackButton>
      }
      preflight={stage === "create" ? createPreflight : stage === "join" ? joinPreflight : undefined}
    >
      {showBanner ? (
        <div className="setup-counter__status">
          <StateSurface
            tone={setupBannerTone}
            eyebrow={setupBannerEyebrow}
            headline={setupBannerHeadline}
            copy={setupBannerCopy}
          />
        </div>
      ) : null}

      {stage === "gateway" ? (
        <div className="setup-entry-grid setup-entry-grid--artifacts" data-testid="online-mode-gateway">
          <DepartureBoardTile
            onClick={() => {
              onClearRoomPreview?.();
              setCreateStep(0);
              setStage("create");
            }}
            testId="online-start-game"
            ariaLabel="Start an online room"
            kicker="Host flow"
            code="START_"
            copy="Seat the table, pick the board, then share the code."
            status="Room board"
          />
          <DepartureBoardTile
            onClick={() => {
              setJoinStep(roomPreview ? 1 : 0);
              setStage("join");
            }}
            testId="online-join-room"
            ariaLabel="Join an online room"
            kicker="Guest flow"
            code="JOIN__"
            copy="Preview the table, claim a seat, and board."
            status="Code ticket"
          />
        </div>
      ) : null}

      {stage === "create" ? (
        <div className="setup-flow-grid setup-flow-grid--create" data-testid="create-room-panel">
          {createStep === 0 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Host"
              meta="Name the room captain"
              actions={
                <SetupActions>
                  <Button variant="primary" onClick={() => setCreateStep(1)}>
                    Seat table
                  </Button>
                </SetupActions>
              }
            >
              <div className="setup-field-grid">
                <FormField label="Your name">
                  <input value={hostName} maxLength={24} onChange={(event) => setHostName(event.target.value)} />
                </FormField>
              </div>
            </SetupStepPanel>
          ) : null}

          {createStep === 1 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Seats"
              meta={`${plannedBotCount} bot · ${plannedHumanOpenSeats} human open`}
              actions={
                <SetupActions>
                  <Button onClick={() => setCreateStep(0)}>Back</Button>
                  <Button variant="primary" onClick={() => setCreateStep(2)}>
                    Pick board
                  </Button>
                </SetupActions>
              }
            >
              <div className="setup-field-grid">
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
                        <TokenButton label="Host" tone="host" className="seat-plan__toggle seat-plan__toggle--fixed" />
                      ) : (
                        <TokenButton
                          label={isBotSeat ? "Bot" : "Open"}
                          tone={isBotSeat ? "bot" : "open"}
                          selected={isBotSeat}
                          className="seat-plan__toggle"
                          testId={`seat-plan-toggle-${seatId}`}
                          onClick={() =>
                            setBotSeatIds((current) =>
                              current.includes(seatId) ? current.filter((entry) => entry !== seatId) : [...current, seatId]
                            )
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

            </SetupStepPanel>
          ) : null}

          {createStep === 2 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Map"
              meta="Choose the board"
              actions={
                <SetupActions>
                  <Button onClick={() => setCreateStep(1)}>Back</Button>
                  <Button variant="primary" onClick={() => setCreateStep(3)}>
                    Set timer
                  </Button>
                </SetupActions>
              }
            >
              <div className="setup-board-preflight">
                <MapThumbnail
                  configId={selectedConfig?.configId ?? configId}
                  mapName={selectedConfig?.mapName ?? "Hudson Hustle"}
                  version={selectedConfig?.version}
                />
                <div className="setup-board-preflight__controls">
                  <FormField label="Map">
                    <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
                      {releasedConfigs.map((config) => (
                        <option key={config.configId} value={config.configId}>
                          {config.version} · {config.mapName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </SetupStepPanel>
          ) : null}

          {createStep === 3 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Timer"
              meta="Set the pace and launch"
              actions={
                <SetupActions>
                  <Button onClick={() => setCreateStep(2)}>Back</Button>
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
                </SetupActions>
              }
            >
              <div className="setup-timer-preflight">
                <FormField as="div" label="Timer" className="form-field--timer">
                  <div className="timer-picker">
                    <Button onClick={() => setTurnTimeLimitSeconds((current) => Math.max(0, current - 15))}>-15</Button>
                    <output className="timer-picker__value" aria-live="polite">
                      {turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`}
                    </output>
                    <Button onClick={() => setTurnTimeLimitSeconds((current) => current + 15)}>+15</Button>
                  </div>
                </FormField>
              </div>
            </SetupStepPanel>
          ) : null}
        </div>
      ) : null}

      {stage === "join" ? (
        <div className="setup-flow-grid setup-flow-grid--join" data-testid="join-room-panel">
          {joinStep === 0 ? (
            <SetupStepPanel eyebrow="Now" title="Room code" meta="Check the table before choosing a seat">
              <div className="setup-field-grid setup-field-grid--launch">
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
                <div className="room-preview room-preview--ticket">
                  <MapThumbnail configId={roomPreview.configId} mapName={roomPreview.mapName} version={roomPreview.configVersion} />
                  <p className="muted-copy">
                    {roomPreview.turnTimeLimitSeconds === 0 ? "Untimed" : `${roomPreview.turnTimeLimitSeconds}s`} · {openSeats.length} open
                  </p>
                </div>
              ) : null}
            </SetupStepPanel>
          ) : null}

          {joinStep === 1 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Seat"
              meta={roomPreview ? `${openSeats.length} open` : "Preview a room to reveal seats."}
              actions={
                <SetupActions>
                  <Button onClick={() => setJoinStep(0)}>Back</Button>
                  <Button
                    variant="primary"
                    disabled={!roomPreview || !preferredSeatId || !openSeats.some((seat) => seat.seatId === preferredSeatId)}
                    onClick={() => setJoinStep(2)}
                  >
                    Enter table
                  </Button>
                </SetupActions>
              }
            >
              {roomPreview ? (
                <div className="seat-choice-row">
                  {openSeats.map((seat) => (
                    <TokenButton
                      key={seat.seatId}
                      label={seat.seatId}
                      tone="open"
                      selected={preferredSeatId === seat.seatId}
                      onClick={() => setPreferredSeatId(seat.seatId)}
                    />
                  ))}
                </div>
              ) : null}
              {roomPreview && openSeats.length === 0 ? <p className="muted-copy room-preview__empty">No open human seats left in this room.</p> : null}
            </SetupStepPanel>
          ) : null}

          {joinStep === 2 ? (
            <SetupStepPanel
              eyebrow="Now"
              title="Enter room"
              meta="Name the seat and enter"
              actions={
                <SetupActions>
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
                </SetupActions>
              }
            >
              <FormField label="Your name">
                <input value={joinPlayerName} maxLength={24} onChange={(event) => setJoinPlayerName(event.target.value)} />
              </FormField>

            </SetupStepPanel>
          ) : null}
        </div>
      ) : null}
    </SetupShell>
  );
}
