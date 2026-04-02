import { useMemo, useState } from "react";
import { Button } from "./system/Button";
import { FormField } from "./system/FormField";
import { SectionHeader } from "./system/SectionHeader";
import { StateSurface } from "./system/StateSurface";
import { UtilityPill } from "./system/UtilityPill";

interface SetupScreenProps {
  onStart: (playerNames: string[]) => void;
  canResume: boolean;
  onResume: () => void;
  onOpenTutorial: () => void;
  onOpenMultiplayer?: () => void;
  onBack?: () => void;
  configLabel: string;
  configSummary: string;
}

export function SetupScreen({
  onStart,
  canResume,
  onResume,
  onOpenTutorial,
  onOpenMultiplayer,
  onBack,
  configLabel,
  configSummary
}: SetupScreenProps): JSX.Element {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4"]);

  const activeNames = useMemo(() => names.slice(0, playerCount), [names, playerCount]);

  return (
    <main className="setup-shell setup-shell--mode">
      <section className="setup-card setup-card--mode">
        <div className="setup-mode-header">
          <div className="setup-mode-header__copy">
            <p className="eyebrow">Local mode</p>
            <h1>Local pass-and-play</h1>
            <p className="setup-mode-lead">One shared laptop. Enter the table, keep hands hidden during handoff, and start a match without extra setup chrome.</p>
          </div>
          <div className="setup-mode-switches">
            {onBack ? <Button onClick={onBack}>All modes</Button> : null}
            {onOpenMultiplayer ? <Button onClick={onOpenMultiplayer}>Online</Button> : null}
          </div>
        </div>
        <div className="setup-mode-toolbar">
          <div className="config-hover-card">
            <UtilityPill label="Running config" value={configLabel} tone="accent" />
            <span className="config-summary-tooltip">{configSummary}</span>
          </div>
          <StateSurface
            tone="neutral"
            eyebrow="Shared laptop session"
            headline="Pass the board between rivals."
            copy="Keep private hands hidden during handoff. The public board stays visible throughout the match."
          />
        </div>

        <div className="setup-mode-grid">
          <div className="setup-mode-panel">
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
          </div>

          <div className="setup-mode-panel setup-mode-panel--actions">
            <SectionHeader eyebrow="Start" title="Ready to begin" meta="No gameplay changes here" density="compact" />
            <p className="muted-copy">New players can open the guided walkthrough first. Returning players can start immediately or resume the saved table.</p>
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
