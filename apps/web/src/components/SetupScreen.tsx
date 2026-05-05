import { useMemo, useState } from "react";
import {
  MapThumbnail,
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
import { FormField } from "./system/FormField";
import { TimerPicker } from "./system/TimerPicker";
import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";

interface LocalStartSetup {
  playerNames: string[];
  botSeatIds: string[];
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
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4"]);
  const [botSeatIds, setBotSeatIds] = useState<string[]>([]);
  const [configId, setConfigId] = useState(initialConfigId);
  const [turnTimeLimitSeconds, setTurnTimeLimitSeconds] = useState(0);
  const [step, setStep] = useState<0 | 1 | 2>(0);

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
  const localSteps: SetupStep[] = [
    { label: "Seats", meta: "Players and bots", status: step === 0 ? "current" : "complete" },
    { label: "Map", meta: "Choose board", status: step === 1 ? "current" : step > 1 ? "complete" : "upcoming" },
    { label: "Timer", meta: "Pace label", status: step === 2 ? "current" : "upcoming" }
  ];
  const localPreflight = (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">Local table</span>
      {step >= 1 ? (
        <MapThumbnail configId={selectedConfig?.configId ?? configId} mapName={selectedConfig?.mapName ?? "Hudson Hustle"} version={selectedConfig?.version} />
      ) : (
        <SetupTicketSlip
          className="setup-room-code-plate--table"
          ariaLabel="Local table seats"
          label="Seats"
          value={`${plannedHumanCount} human`}
          detail={`${plannedBotCount} bot`}
        />
      )}
      <div className="setup-summary-stack">
        {step >= 1 ? <SetupSummaryRow label="Map" value={selectedConfig?.mapName ?? "Map"} /> : null}
        <SetupSummaryRow label="Seats" value={`${plannedHumanCount} human`} detail={`${plannedBotCount} bot`} />
        {step >= 2 ? (
          <SetupSummaryRow label="Timer" value={turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`} />
        ) : null}
        {canResume ? <SetupSummaryRow label="Save" value="Ready" /> : null}
      </div>
    </div>
  );

  return (
    <SetupShell
      eyebrow="Local table"
      title="Pass-and-play"
      lead="Seat the rivals, pass the laptop, and keep every private hand off-screen."
      backgroundImageUrl={setupHeroImageUrl}
      steps={localSteps}
      backAction={onBack ? <SetupBackButton onClick={onBack}>Back</SetupBackButton> : undefined}
      preflight={localPreflight}
      className="setup-board-shell--local"
    >
      <div className="setup-flow-grid setup-flow-grid--local" data-testid="local-setup-panel">
        {step === 0 ? (
          <SetupStepPanel
            eyebrow="Now"
            title="Seats"
            meta={`${plannedBotCount} bot · ${Math.max(0, plannedHumanCount - 1)} human open`}
            actions={
              <SetupActions>
                <Button onClick={onOpenGuide}>Guide</Button>
                {canResume ? <Button onClick={onResume}>Resume saved game</Button> : null}
                <Button variant="primary" onClick={() => setStep(1)}>
                  Pick board
                </Button>
              </SetupActions>
            }
          >
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

            <div className="seat-plan">
              {setupSeatIds.map((seatId, index) => {
                const isFirstSeat = seatId === "seat-1";
                const isBotSeat = botSeatIds.includes(seatId);
                return (
                  <div
                    key={seatId}
                    className={`seat-plan__row setup-local-seat-row ${isBotSeat ? "seat-plan__row--bot" : ""}`}
                    data-testid={`local-seat-plan-${seatId}`}
                  >
                    <div className="seat-plan__copy">
                      <strong className="seat-plan__title">{isBotSeat ? `Bot ${index}` : `Player ${index + 1}`}</strong>
                      <span className="seat-plan__meta">{isBotSeat ? "Bot seat" : "Human seat"}</span>
                    </div>
                    {!isBotSeat ? (
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
                    )}
                    <div className="seat-choice-row">
                      {isFirstSeat ? (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SetupStepPanel>
        ) : null}

        {step === 1 ? (
          <SetupStepPanel
            eyebrow="Now"
            title="Map"
            meta="Choose the local board"
            actions={
              <SetupActions>
                <Button onClick={() => setStep(0)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(2)}>
                  Set timer
                </Button>
              </SetupActions>
            }
          >
            <div className="setup-board-preflight">
              <MapThumbnail configId={selectedConfig?.configId ?? configId} mapName={selectedConfig?.mapName ?? "Hudson Hustle"} version={selectedConfig?.version} />
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

        {step === 2 ? (
          <SetupStepPanel
            eyebrow="Now"
            title="Timer"
            meta="Set the table pace"
            actions={
              <SetupActions>
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    onStart({
                      playerNames: activeNames.map((name, index) => name.trim() || `Player ${index + 1}`),
                      botSeatIds: botSeatIds.filter((seatId) => setupSeatIds.includes(seatId)),
                      configId,
                      turnTimeLimitSeconds
                    })
                  }
                >
                  Start local game
                </Button>
              </SetupActions>
            }
          >
            <div className="setup-timer-preflight">
              <FormField as="div" label="Timer" className="form-field--timer" helper="Enter seconds. 0 = untimed · 30 = 30 s · 60 = 1 min.">
                <TimerPicker value={turnTimeLimitSeconds} onChange={setTurnTimeLimitSeconds} />
              </FormField>
            </div>
          </SetupStepPanel>
        ) : null}
      </div>
    </SetupShell>
  );
}
