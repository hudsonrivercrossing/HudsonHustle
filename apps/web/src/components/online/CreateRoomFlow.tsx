import type { BotDifficulty } from "@hudson-hustle/game-core";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { FormField } from "../ui/primitives/FormField";
import { Button } from "../ui/primitives/Button";
import { TimerPicker } from "../ui/primitives/TimerPicker";
import {
  BotDifficultyField,
  SeatPlan,
  SetupActions,
  SetupSection,
  SetupStepPanel,
  TokenButton,
  type SeatRow
} from "../setup";
import type { CreateRoomForm } from "./multiplayerSetup.types";

interface CreateRoomFlowProps {
  releasedConfigs: HudsonHustleReleasedConfigSummary[];
  isCreatingRoom: boolean;
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
  setupSeatIds: string[];
  plannedBotCount: number;
  plannedHumanOpenSeats: number;
  selectedConfig: HudsonHustleReleasedConfigSummary | undefined;
  onChangeHostName: (v: string) => void;
  onChangePlayerCount: (v: 2 | 3 | 4) => void;
  onChangeConfigId: (v: string) => void;
  onChangeTurnTimeLimit: (v: number) => void;
  onToggleBotSeat: (seatId: string) => void;
  onChangeBotDifficulty: (difficulty: BotDifficulty) => void;
  onCreateRoom: (form: CreateRoomForm) => void;
}

export function CreateRoomFlow({
  releasedConfigs,
  isCreatingRoom,
  hostName,
  playerCount,
  configId,
  turnTimeLimitSeconds,
  botSeatIds,
  botDifficulty,
  setupSeatIds,
  plannedBotCount,
  plannedHumanOpenSeats,
  selectedConfig,
  onChangeHostName,
  onChangePlayerCount,
  onChangeConfigId,
  onChangeTurnTimeLimit,
  onToggleBotSeat,
  onChangeBotDifficulty,
  onCreateRoom
}: CreateRoomFlowProps): JSX.Element {
  const createRoom = () =>
    onCreateRoom({
      hostName: hostName.trim() || "Host",
      playerCount,
      configId,
      turnTimeLimitSeconds,
      botSeatIds: botSeatIds.filter((seatId) => setupSeatIds.includes(seatId)),
      botDifficulty
    });

  return (
    <form
      className="setup-flow-grid setup-flow-grid--create"
      data-testid="create-room-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isCreatingRoom) {
          createRoom();
        }
      }}
    >
      <SetupStepPanel
        eyebrow="Table"
        title="Set the table"
        meta={`${plannedBotCount} bot · ${plannedHumanOpenSeats} human open · ${selectedConfig?.mapName ?? "Map"}`}
        actions={
          <SetupActions>
            <Button type="submit" variant="primary" loading={isCreatingRoom}>
              {isCreatingRoom ? "Creating room…" : "Create room"}
            </Button>
          </SetupActions>
        }
      >
        <SetupSection title="Host" meta="You take seat 1 and start the game when everyone is ready.">
          <FormField label="Your name">
            <input value={hostName} maxLength={24} autoComplete="nickname" onChange={(e) => onChangeHostName(e.target.value)} />
          </FormField>
        </SetupSection>

        <SetupSection title="Seats" meta="Leave a seat open for a friend to join by code, or fill it with a bot.">
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
                title: `Seat ${index + 1}`,
                meta: isHostSeat ? "You, the host" : isBotSeat ? "Played by a bot" : "Open for a friend to join",
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
          {plannedBotCount > 0 ? <BotDifficultyField value={botDifficulty} onChange={onChangeBotDifficulty} /> : null}
        </SetupSection>

        <SetupSection
          title="Board"
          meta={
            selectedConfig
              ? // ~0.6 min per route + 20 min base from playtesting
                `${selectedConfig.cityCount} stations · ${selectedConfig.routeCount} routes · about ${Math.round(selectedConfig.routeCount * 0.6 + 20)} min`
              : undefined
          }
        >
          <FormField label="Map">
            <select value={configId} onChange={(e) => onChangeConfigId(e.target.value)}>
              {releasedConfigs.map((config) => (
                <option key={config.configId} value={config.configId}>
                  {config.mapName}
                </option>
              ))}
            </select>
          </FormField>
        </SetupSection>

        <SetupSection title="Pace" meta="Seconds per turn. Leave at 0 for an untimed game.">
          <FormField as="div" label="Timer" className="form-field--timer">
            <TimerPicker value={turnTimeLimitSeconds} onChange={onChangeTurnTimeLimit} />
          </FormField>
        </SetupSection>
      </SetupStepPanel>
    </form>
  );
}
