import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { FormField } from "../ui/primitives/FormField";
import { Button } from "../ui/primitives/Button";
import { TimerPicker } from "../ui/primitives/TimerPicker";
import {
  MapThumbnail,
  SeatPlan,
  SetupActions,
  SetupStepPanel,
  TokenButton,
  type SeatRow
} from "../setup";
import type { CreateRoomForm, SetupFlowStep } from "./multiplayerSetup.types";

interface CreateRoomFlowProps {
  step: SetupFlowStep;
  releasedConfigs: HudsonHustleReleasedConfigSummary[];
  isCreatingRoom: boolean;
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds: string[];
  setupSeatIds: string[];
  plannedBotCount: number;
  plannedHumanOpenSeats: number;
  selectedConfig: HudsonHustleReleasedConfigSummary | undefined;
  onChangeStep: (step: SetupFlowStep) => void;
  onChangeHostName: (v: string) => void;
  onChangePlayerCount: (v: 2 | 3 | 4) => void;
  onChangeConfigId: (v: string) => void;
  onChangeTurnTimeLimit: (v: number) => void;
  onToggleBotSeat: (seatId: string) => void;
  onCreateRoom: (form: CreateRoomForm) => void;
}

export function CreateRoomFlow({
  step,
  releasedConfigs,
  isCreatingRoom,
  hostName,
  playerCount,
  configId,
  turnTimeLimitSeconds,
  botSeatIds,
  setupSeatIds,
  plannedBotCount,
  plannedHumanOpenSeats,
  selectedConfig,
  onChangeStep,
  onChangeHostName,
  onChangePlayerCount,
  onChangeConfigId,
  onChangeTurnTimeLimit,
  onToggleBotSeat,
  onCreateRoom
}: CreateRoomFlowProps): JSX.Element {
  return (
    <div className="setup-flow-grid setup-flow-grid--create" data-testid="create-room-panel">
      {step === 0 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Host"
          meta="Name the room captain"
          actions={
            <SetupActions>
              <Button variant="primary" onClick={() => onChangeStep(1)}>Seat table</Button>
            </SetupActions>
          }
        >
          <div className="setup-field-grid">
            <FormField label="Your name">
              <input value={hostName} maxLength={24} onChange={(e) => onChangeHostName(e.target.value)} />
            </FormField>
          </div>
        </SetupStepPanel>
      ) : null}

      {step === 1 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Seats"
          meta={`${plannedBotCount} bot · ${plannedHumanOpenSeats} human open`}
          actions={
            <SetupActions>
              <Button onClick={() => onChangeStep(0)}>Back</Button>
              <Button variant="primary" onClick={() => onChangeStep(2)}>Pick board</Button>
            </SetupActions>
          }
        >
          <div className="setup-field-grid">
            <FormField label="Players">
              <select value={playerCount} onChange={(e) => onChangePlayerCount(Number(e.target.value) as 2 | 3 | 4)}>
                <option value={2}>2 players</option>
                <option value={3}>3 players</option>
                <option value={4}>4 players</option>
              </select>
            </FormField>
          </div>
          <SeatPlan
            seats={setupSeatIds.map((seatId, index): SeatRow => {
              const isHostSeat = seatId === "seat-1";
              const isBotSeat = botSeatIds.includes(seatId);
              return {
                id: seatId,
                title: seatId,
                meta: isHostSeat ? "Host seat" : isBotSeat ? `Bot ${index}` : "Open human seat",
                isBot: isBotSeat,
                testId: `seat-plan-${seatId}`,
                action: isHostSeat ? (
                  <TokenButton label="Host" tone="host" className="seat-plan__toggle seat-plan__toggle--fixed" />
                ) : (
                  <TokenButton
                    label={isBotSeat ? "Bot" : "Open"}
                    tone={isBotSeat ? "bot" : "open"}
                    selected={isBotSeat}
                    className="seat-plan__toggle"
                    testId={`seat-plan-toggle-${seatId}`}
                    onClick={() => onToggleBotSeat(seatId)}
                  />
                )
              };
            })}
          />
        </SetupStepPanel>
      ) : null}

      {step === 2 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Map"
          meta="Choose the board"
          actions={
            <SetupActions>
              <Button onClick={() => onChangeStep(1)}>Back</Button>
              <Button variant="primary" onClick={() => onChangeStep(3)}>Set timer</Button>
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
                <select value={configId} onChange={(e) => onChangeConfigId(e.target.value)}>
                  {releasedConfigs.map((config) => (
                    <option key={config.configId} value={config.configId}>
                      {config.version} · {config.mapName}
                    </option>
                  ))}
                </select>
              </FormField>
              {selectedConfig ? (
                <p className="map-picker-meta">
                  {/* ~0.6 min per route + 20 min base from playtesting */}
                  {selectedConfig.cityCount} stations · {selectedConfig.routeCount} routes · ~{Math.round(selectedConfig.routeCount * 0.6 + 20)} min
                </p>
              ) : null}
            </div>
          </div>
        </SetupStepPanel>
      ) : null}

      {step === 3 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Timer"
          meta="Set the pace and launch"
          actions={
            <SetupActions>
              <Button onClick={() => onChangeStep(2)}>Back</Button>
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
            <FormField as="div" label="Timer" className="form-field--timer" helper="Enter seconds. 0 = untimed · 30 = 30 s · 60 = 1 min.">
              <TimerPicker value={turnTimeLimitSeconds} onChange={onChangeTurnTimeLimit} />
            </FormField>
          </div>
        </SetupStepPanel>
      ) : null}
    </div>
  );
}
