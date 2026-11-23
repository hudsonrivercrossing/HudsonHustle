import { useEffect, useMemo, useState } from "react";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import type { BotDifficulty, ReconnectState, RoomSummary } from "@hudson-hustle/game-core";
import { StateSurface } from "../ui/primitives/StateSurface";
import {
  ModeSwitch,
  SetupBackButton,
  SetupShell
} from "../setup";
import {
  CreateRoomFlow,
  CreateRoomPreflight,
  JoinRoomFlow,
  JoinRoomPreflight,
  OnlineGateway,
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
  pendingRequest?: "preview" | "join" | "start" | "restart" | null;
  /** Room code from a shared link; opens the join flow with it filled in. */
  initialJoinRoomCode?: string;
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
  pendingRequest = null,
  initialJoinRoomCode,
  onBack,
  onClearRoomPreview,
  onPreviewRoom,
  onCreateRoom,
  onJoinRoom
}: OnlineSetupScreenProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.webp";
  const latestConfigId = releasedConfigs.at(-1)?.configId ?? "v0.4-flushing-newark-airport";

  // Create form state
  const [hostName, setHostName] = useState("Host");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [configId, setConfigId] = useState(latestConfigId);
  const [turnTimeLimitSeconds, setTurnTimeLimitSeconds] = useState(0);
  const [botSeatIds, setBotSeatIds] = useState<string[]>([]);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("standard");

  // Join form state
  const [joinRoomCode, setJoinRoomCode] = useState(initialJoinRoomCode ?? "");
  const [joinPlayerName, setJoinPlayerName] = useState("Player");
  const [preferredSeatId, setPreferredSeatId] = useState<string | undefined>(undefined);

  // Navigation state
  const [stage, setStage] = useState<OnlineSetupStage>(() =>
    initialJoinRoomCode || reconnectState === "attempting-reconnect" || reconnectState === "reconnect-failed" ? "join" : "gateway"
  );
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
    setJoinStep(0);
    setPreferredSeatId(undefined);
    onClearRoomPreview?.();
  }

  function chooseStage(nextStage: OnlineSetupStage) {
    if (nextStage === "create") { onClearRoomPreview?.(); setStage("create"); return; }
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
  const bannerEyebrow = error || reconnectState === "reconnect-failed" ? "Problem" : reconnectState === "attempting-reconnect" ? "Rejoining" : "Online play";
  const bannerHeadline =
    error ? "That did not work." :
    reconnectState === "reconnect-failed" ? "Could not get back into your room." :
    reconnectState === "attempting-reconnect" ? "Taking you back to your room…" : "Create a room or join a table.";
  const bannerCopy =
    error ? error :
    reconnectState === "reconnect-failed" ? "The room may have ended. Enter its code to try again, or start a new one." :
    reconnectState === "attempting-reconnect" ? "This browser was seated at a table. Checking that it is still there." : "Host a table or join one by room code.";

  const title = stage === "gateway" ? "Online" : stage === "create" ? "Start game" : "Join room";
  const subtitle =
    stage === "gateway" ? "Host a room or board by code." :
    stage === "create" ? "Seat the crew, pick the board, and send the room code." :
    "Punch in the code, claim a seat, and board before departure.";

  return (
    <SetupShell
      eyebrow="Station counter"
      title={title}
      lead={subtitle}
      backgroundImageUrl={setupHeroImageUrl}
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
          releasedConfigs={releasedConfigs}
          isCreatingRoom={isCreatingRoom}
          hostName={hostName}
          playerCount={playerCount}
          configId={configId}
          turnTimeLimitSeconds={turnTimeLimitSeconds}
          botSeatIds={botSeatIds}
          botDifficulty={botDifficulty}
          onChangeBotDifficulty={setBotDifficulty}
          setupSeatIds={setupSeatIds}
          plannedBotCount={plannedBotCount}
          plannedHumanOpenSeats={plannedHumanOpenSeats}
          selectedConfig={selectedConfig}
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

      {stage === "join" && reconnectState !== "attempting-reconnect" ? (
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
          pending={pendingRequest === "preview" || pendingRequest === "join" ? pendingRequest : null}
        />
      ) : null}
    </SetupShell>
  );
}
