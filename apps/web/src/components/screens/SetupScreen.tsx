import { useMemo, useState } from "react";
import {
  BotDifficultyField,
  MapThumbnail,
  SeatPlan,
  SetupActions,
  SetupBackButton,
  SetupSection,
  SetupShell,
  SetupStepPanel,
  SetupSummaryRow,
  TokenButton,
  type SeatRow
} from "../setup";
import { Button } from "../ui/primitives/Button";
import { FormField } from "../ui/primitives/FormField";
import { TimerPicker } from "../ui/primitives/TimerPicker";
import type { BotDifficulty } from "@hudson-hustle/game-core";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { readLastLocalSetup, saveLastLocalSetup } from "../local";

interface LocalStartSetup {
  playerNames: string[];
  botSeatIds: string[];
  botDifficulty: BotDifficulty;
  configId: string;
  turnTimeLimitSeconds: number;
}

interface SetupScreenProps {
  onStart: (setup: LocalStartSetup) => void;
  canResume: boolean;
  onResume: () => void;
  onOpenGuide: () => void;
  onBack?: () => void;
  releasedConfigs: HudsonHustleReleasedConfigSummary[];
  initialConfigId: string;
}

export function SetupScreen({
  onStart,
  canResume,
  onResume,
  onOpenGuide,
  onBack,
  releasedConfigs,
  initialConfigId
}: SetupScreenProps): JSX.Element {
  // Start from the last game's choices; a group that plays again should not retype them.
  const [lastSetup] = useState(() => readLastLocalSetup(releasedConfigs.map((config) => config.configId)));
  const [playerCount, setPlayerCount] = useState<number>(lastSetup?.playerCount ?? 2);
  const [names, setNames] = useState<string[]>(lastSetup?.names ?? ["Player 1", "Player 2", "Player 3", "Player 4"]);
  const [botSeatIds, setBotSeatIds] = useState<string[]>(lastSetup?.botSeatIds ?? []);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(lastSetup?.botDifficulty ?? "standard");
  const [configId, setConfigId] = useState(lastSetup?.configId ?? initialConfigId);
  const [turnTimeLimitSeconds, setTurnTimeLimitSeconds] = useState(lastSetup?.turnTimeLimitSeconds ?? 0);

  const setupSeatIds = useMemo(() => Array.from({ length: playerCount }, (_, index) => `seat-${index + 1}`), [playerCount]);
  const activeNames = useMemo(
    () =>
      names.slice(0, playerCount).map((name, index) => {
        const seatId = `seat-${index + 1}`;
        if (botSeatIds.includes(seatId)) {
          return `Bot ${index}`;
        }
        return name;
      }),
    [botSeatIds, names, playerCount]
  );
  const selectedConfig = releasedConfigs.find((config) => config.configId === configId) ?? releasedConfigs[0];
  const plannedBotCount = botSeatIds.filter((seatId) => setupSeatIds.includes(seatId)).length;
  const plannedHumanCount = Math.max(1, playerCount - plannedBotCount);
  const setupHeroImageUrl = "/setup/landing-bg.png";
  const localPreflight = (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">Local table</span>
      <MapThumbnail configId={selectedConfig?.configId ?? configId} mapName={selectedConfig?.mapName ?? "Hudson Hustle"} version={selectedConfig?.version} />
      <div className="setup-summary-stack">
        <SetupSummaryRow label="Map" value={selectedConfig?.mapName ?? "Map"} />
        <SetupSummaryRow label="Seats" value={`${plannedHumanCount} human`} detail={`${plannedBotCount} bot`} />
        <SetupSummaryRow label="Timer" value={turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`} />
        {canResume ? <SetupSummaryRow label="Save" value="Ready" /> : null}
      </div>
    </div>
  );

  function start() {
    saveLastLocalSetup({
      playerCount: playerCount as 2 | 3 | 4,
      names: [names[0], names[1], names[2], names[3]],
      botSeatIds,
      botDifficulty,
      configId,
      turnTimeLimitSeconds
    });
    onStart({
      playerNames: activeNames.map((name, index) => name.trim() || `Player ${index + 1}`),
      botSeatIds: botSeatIds.filter((seatId) => setupSeatIds.includes(seatId)),
      botDifficulty,
      configId,
      turnTimeLimitSeconds
    });
  }

  return (
    <SetupShell
      eyebrow="Local table"
      title="Pass-and-play"
      lead="Seat the rivals, pass the laptop, and keep every private hand off-screen."
      backgroundImageUrl={setupHeroImageUrl}
      backAction={onBack ? <SetupBackButton onClick={onBack}>Back</SetupBackButton> : undefined}
      preflight={localPreflight}
      className="setup-board-shell--local"
    >
      <div className="setup-flow-grid setup-flow-grid--local" data-testid="local-setup-panel">
        <SetupStepPanel
          eyebrow="Table"
          title="Set the table"
          meta={`${plannedHumanCount} human · ${plannedBotCount} bot · ${selectedConfig?.mapName ?? "Map"}`}
          actions={
            <SetupActions>
              <Button onClick={onOpenGuide}>Guide</Button>
              {canResume ? <Button onClick={onResume}>Resume saved game</Button> : null}
              <Button variant="primary" onClick={start}>
                Start local game
              </Button>
            </SetupActions>
          }
        >
          <SetupSection title="Seats" meta="Seat 1 is always a person. Turn any other seat into a bot.">
            <div className="setup-field-grid">
              <FormField label="Players">
                <select
                  value={playerCount}
                  onChange={(event) => {
                    const nextCount = Number(event.target.value);
                    setPlayerCount(nextCount);
                    setBotSeatIds((current) => current.filter((seatId) => Number(seatId.replace("seat-", "")) <= nextCount));
                  }}
                >
                  <option value={2}>2 players</option>
                  <option value={3}>3 players</option>
                  <option value={4}>4 players</option>
                </select>
              </FormField>
            </div>

            <SeatPlan
              seats={setupSeatIds.map((seatId, index): SeatRow => {
                const isFirstSeat = seatId === "seat-1";
                const isBotSeat = botSeatIds.includes(seatId);
                return {
                  id: seatId,
                  title: isBotSeat ? `Bot ${index}` : `Player ${index + 1}`,
                  meta: isBotSeat ? "Bot seat" : "Human seat",
                  isBot: isBotSeat,
                  testId: `local-seat-plan-${seatId}`,
                  rowClassName: "setup-local-seat-row",
                  input: !isBotSeat ? (
                    <input
                      className="setup-seat-name-input"
                      aria-label={`Player ${index + 1} name`}
                      value={names[index]}
                      maxLength={24}
                      onChange={(event) =>
                        setNames((current) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                    />
                  ) : (
                    <span className="setup-seat-name-input setup-seat-name-input--bot" aria-label={`Bot ${index} seat`}>
                      Automated rival
                    </span>
                  ),
                  action: isFirstSeat ? (
                    <TokenButton label="Human" tone="human" className="seat-plan__toggle seat-plan__toggle--fixed setup-seat-token" />
                  ) : (
                    <TokenButton
                      label={isBotSeat ? "Bot" : "Human"}
                      tone={isBotSeat ? "bot" : "human"}
                      selected={isBotSeat}
                      className="seat-plan__toggle"
                      testId={`local-seat-plan-toggle-${seatId}`}
                      onClick={() =>
                        setBotSeatIds((current) =>
                          current.includes(seatId) ? current.filter((entry) => entry !== seatId) : [...current, seatId]
                        )
                      }
                    />
                  )
                };
              })}
            />
            {plannedBotCount > 0 ? <BotDifficultyField value={botDifficulty} onChange={setBotDifficulty} /> : null}
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
              <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
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
              <TimerPicker value={turnTimeLimitSeconds} onChange={setTurnTimeLimitSeconds} />
            </FormField>
          </SetupSection>
        </SetupStepPanel>
      </div>
    </SetupShell>
  );
}
