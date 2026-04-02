import { useMemo, useState } from "react";
import { Button } from "./system/Button";
import { FormField } from "./system/FormField";
import { SectionHeader } from "./system/SectionHeader";
import { StatusBanner } from "./system/StatusBanner";
import { UtilityPill } from "./system/UtilityPill";

interface SetupScreenProps {
  onStart: (playerNames: string[]) => void;
  canResume: boolean;
  onResume: () => void;
  onOpenTutorial: () => void;
  onOpenMultiplayer?: () => void;
  configLabel: string;
  configSummary: string;
}

export function SetupScreen({
  onStart,
  canResume,
  onResume,
  onOpenTutorial,
  onOpenMultiplayer,
  configLabel,
  configSummary
}: SetupScreenProps): JSX.Element {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4"]);

  const activeNames = useMemo(() => names.slice(0, playerCount), [names, playerCount]);

  return (
    <main className="setup-shell">
      <section className="setup-card">
        <p className="eyebrow">Local Pass-and-Play</p>
        <h1>Hudson Hustle</h1>
        <p className="lead">
          Build your own route web across the core NYC/NJ transit map. Claim crossings, survive tunnel surprises,
          and hand the laptop to the next rival when your turn is done.
        </p>
        <div className="utility-pill-group">
          <div className="config-hover-card">
            <UtilityPill label="Running config" value={configLabel} tone="accent" />
            <span className="config-summary-tooltip">{configSummary}</span>
          </div>
        </div>
        <StatusBanner
          tone="neutral"
          eyebrow="Shared laptop session"
          headline="Pass the board between rivals."
          copy="Use one computer, hand off between turns, and keep private hands hidden during player changes."
        />

        <SectionHeader eyebrow="Table setup" title="Players" meta={`${playerCount} seated`} />
        <FormField label="Players">
          <select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))}>
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
        </FormField>

        <div className="field-grid">
          {activeNames.map((name, index) => (
            <FormField label={`Player ${index + 1}`} key={index}>
              <input
                value={name}
                maxLength={24}
                onChange={(event) =>
                  setNames((current) => {
                    const next = [...current];
                    next[index] = event.target.value;
                    return next;
                  })
                }
              />
            </FormField>
          ))}
        </div>

        <div className="setup-actions">
          <Button variant="primary" onClick={() => onStart(activeNames.map((name, index) => name.trim() || `Player ${index + 1}`))}>
            Start new game
          </Button>
          <Button onClick={onOpenTutorial}>
            How to play
          </Button>
          {canResume ? (
            <Button onClick={onResume}>
              Resume saved game
            </Button>
          ) : null}
          {onOpenMultiplayer ? (
            <Button onClick={onOpenMultiplayer}>
              Separate-device multiplayer
            </Button>
          ) : null}
        </div>
        <p className="muted-copy">
          New players can read the guided walkthrough. Experienced players can skip it and jump straight into setup.
        </p>
      </section>
    </main>
  );
}
