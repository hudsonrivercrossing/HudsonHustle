import { useEffect, useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { ReconnectState, RoomSummary } from "@hudson-hustle/game-core";
import { StateSurface } from "../ui/primitives/StateSurface";
import {
  ModeSwitch,
  SetupBackButton,
  SetupShell,
  type SetupStep
} from "../setup";
import {
  CreateRoomFlow,
  CreateRoomPreflight,
  JoinRoomFlow,
  JoinRoomPreflight,
  OnlineGateway,
  getStepStatus,
  type CreateRoomForm,
  type OnlineSetupStage,
  type SetupFlowStep
} from "../online";

interface OnlineSetupScreenProps {
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

export function OnlineSetupScreen({
  releasedConfigs,
  reconnectState,
  roomPreview,
  error,
  isCreatingRoom = false,
  onBack,
  onClearRoomPreview,
  onPreviewRoom,
  onCreateRoom,
  onJoinRoom
}: OnlineSetupScreenProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.png";
  const latestConfigId = releasedConfigs.at(-1)?.configId ?? "v0.4-flushing-newark-airport";

  // Create form state
  const [hostName, setHostName] = useState("Host");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [configId, setConfigId] = useState(latestConfigId);
  const [turnTimeLimitSeconds, setTurnTimeLimitSeconds] = useState(0);
  const [botSeatIds, setBotSeatIds] = useState<string[]>([]);

  // Join form state
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("Player");
  const [preferredSeatId, setPreferredSeatId] = useState<string | undefined>(undefined);

  // Navigation state
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
    () => Array.from({ length: playerCount }, (_, i) => `seat-${i + 1}`),
    [playerCount]
  );
  const plannedBotCount = botSeatIds.filter((id) => id !== "seat-1" && setupSeatIds.includes(id)).length;
  const plannedHumanOpenSeats = Math.max(0, playerCount - 1 - plannedBotCount);
  const selectedConfig = releasedConfigs.find((c) => c.configId === configId);

  useEffect(() => {
    if (reconnectState === "attempting-reconnect") { setStage("join"); setJoinStep(2); return; }
    if (reconnectState === "reconnect-failed") { setStage("join"); setJoinStep(0); }
  }, [reconnectState]);

  useEffect(() => {
    if (stage === "join" && roomPreview && joinStep === 0) setJoinStep(1);
  }, [joinStep, roomPreview, stage]);

  useEffect(() => {
    if (!preferredSeatId) return;
    if (!roomPreview || !openSeats.some((s) => s.seatId === preferredSeatId)) setPreferredSeatId(undefined);
  }, [openSeats, preferredSeatId, roomPreview]);

  function returnToGateway() {
    setStage("gateway");
    setCreateStep(0);
    setJoinStep(0);
    setPreferredSeatId(undefined);
    onClearRoomPreview?.();
  }

  function chooseStage(nextStage: OnlineSetupStage) {
    if (nextStage === "create") { onClearRoomPreview?.(); setCreateStep(0); setStage("create"); return; }
    if (nextStage === "join") { setStage("join"); setJoinStep(roomPreview ? 1 : 0); }
  }

  function handleChangeJoinRoomCode(code: string) {
    setJoinRoomCode(code.toUpperCase());
    setPreferredSeatId(undefined);
    onClearRoomPreview?.();
  }

  const showBanner =
    Boolean(error) || (stage === "join" && (reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed"));
  const bannerTone = error || reconnectState === "reconnect-failed" ? "danger" : reconnectState === "attempting-reconnect" ? "waiting" : "neutral";
  const bannerEyebrow = error || reconnectState === "reconnect-failed" ? "Connection issue" : reconnectState === "attempting-reconnect" ? "Reconnect" : "Separate-device multiplayer";
  const bannerHeadline =
    error || reconnectState === "reconnect-failed" ? "Multiplayer setup needs attention." :
    reconnectState === "attempting-reconnect" ? "Attempting to restore your room." : "Create a room or join a table.";
  const bannerCopy =
    error ? error :
    reconnectState === "reconnect-failed" ? "Saved room recovery failed. Enter the room code again to board." :
    reconnectState === "attempting-reconnect" ? "Checking the saved room session first." : "Host a table or join one by room code.";

  const title = stage === "gateway" ? "Online" : stage === "create" ? "Start game" : "Join room";
  const subtitle =
    stage === "gateway" ? "Host a room or board by code." :
    stage === "create" ? "Seat the crew, pick the board, and send the room code." :
    "Punch in the code, claim a seat, and board before departure.";

  const railSteps: SetupStep[] =
    stage === "gateway"
      ? [
          { label: "Choose line", meta: "Host or guest", status: "current" },
          { label: "Start game", meta: "Build the room", status: "upcoming" },
          { label: "Join room", meta: "Enter by code", status: "upcoming" }
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

  return (
    <SetupShell
      eyebrow="Station counter"
      title={title}
      lead={subtitle}
      backgroundImageUrl={setupHeroImageUrl}
      steps={railSteps}
      modeSwitch={
        stage === "gateway" ? null : (
          <ModeSwitch
            value={stage}
            options={[
              { value: "create", label: "Start game" },
              { value: "join", label: "Join room" }
            ]}
            onChange={chooseStage}
          />
        )
      }
      backAction={
        stage === "gateway"
          ? onBack ? <SetupBackButton onClick={onBack}>Back</SetupBackButton> : null
          : <SetupBackButton onClick={returnToGateway}>Back</SetupBackButton>
      }
      preflight={
        stage === "create" ? (
          <CreateRoomPreflight
            step={createStep}
            hostName={hostName}
            playerCount={playerCount}
            plannedBotCount={plannedBotCount}
            turnTimeLimitSeconds={turnTimeLimitSeconds}
            selectedConfig={selectedConfig}
            configId={configId}
          />
        ) : stage === "join" ? (
          <JoinRoomPreflight
            step={joinStep}
            joinRoomCode={joinRoomCode}
            roomPreview={roomPreview}
            openSeatCount={openSeats.length}
            preferredSeatId={preferredSeatId}
          />
        ) : undefined
      }
    >
      {showBanner ? (
        <div className="setup-counter__status">
          <StateSurface tone={bannerTone} eyebrow={bannerEyebrow} headline={bannerHeadline} copy={bannerCopy} />
        </div>
      ) : null}

      {stage === "gateway" ? (
        <OnlineGateway
          onStartGame={() => chooseStage("create")}
          onJoinRoom={() => chooseStage("join")}
        />
      ) : null}

      {stage === "create" ? (
        <CreateRoomFlow
          step={createStep}
          releasedConfigs={releasedConfigs}
          isCreatingRoom={isCreatingRoom}
          hostName={hostName}
          playerCount={playerCount}
          configId={configId}
          turnTimeLimitSeconds={turnTimeLimitSeconds}
          botSeatIds={botSeatIds}
          setupSeatIds={setupSeatIds}
          plannedBotCount={plannedBotCount}
          plannedHumanOpenSeats={plannedHumanOpenSeats}
          selectedConfig={selectedConfig}
          onChangeStep={setCreateStep}
          onChangeHostName={setHostName}
          onChangePlayerCount={setPlayerCount}
          onChangeConfigId={setConfigId}
          onChangeTurnTimeLimit={setTurnTimeLimitSeconds}
          onToggleBotSeat={(seatId) =>
            setBotSeatIds((curr) => curr.includes(seatId) ? curr.filter((id) => id !== seatId) : [...curr, seatId])
          }
          onCreateRoom={onCreateRoom}
        />
      ) : null}

      {stage === "join" ? (
        <JoinRoomFlow
          step={joinStep}
          roomPreview={roomPreview}
          openSeats={openSeats}
          joinRoomCode={joinRoomCode}
          joinPlayerName={joinPlayerName}
          preferredSeatId={preferredSeatId}
          onChangeStep={setJoinStep}
          onChangeJoinRoomCode={handleChangeJoinRoomCode}
          onChangeJoinPlayerName={setJoinPlayerName}
          onChangePreferredSeatId={setPreferredSeatId}
          onPreviewRoom={onPreviewRoom}
          onJoinRoom={onJoinRoom}
        />
      ) : null}
    </SetupShell>
  );
}
