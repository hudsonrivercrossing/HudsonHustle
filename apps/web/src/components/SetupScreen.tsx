import { useMemo, useState } from "react";

interface SetupScreenProps {
  onStart: (playerNames: string[]) => void;
  canResume: boolean;
  onResume: () => void;
  onOpenTutorial: () => void;
  configLabel: string;
  configSummary: string;
}

export function SetupScreen({ onStart, canResume, onResume, onOpenTutorial, configLabel, configSummary }: SetupScreenProps): JSX.Element {
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
        <div className="config-chip-group">
          <div className="config-hover-card">
            <span className="config-chip">Running config: {configLabel}</span>
            <span className="config-summary-tooltip">{configSummary}</span>
          </div>
        </div>

        <label className="field">
          <span>Players</span>
          <select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))}>
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
        </label>

        <div className="field-grid">
          {activeNames.map((name, index) => (
            <label className="field" key={index}>
              <span>Player {index + 1}</span>
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
            </label>
          ))}
        </div>

        <div className="setup-actions">
          <button
            className="primary-button"
            onClick={() => onStart(activeNames.map((name, index) => name.trim() || `Player ${index + 1}`))}
          >
            Start new game
          </button>
          <button className="secondary-button" onClick={onOpenTutorial}>
            How to play
          </button>
          {canResume ? (
            <button className="secondary-button" onClick={onResume}>
              Resume saved game
            </button>
          ) : null}
        </div>
        <p className="muted-copy">
          New players can read the guided walkthrough. Experienced players can skip it and jump straight into setup.
        </p>
      </section>
    </main>
  );
}
