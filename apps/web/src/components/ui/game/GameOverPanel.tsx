import { useState, type ReactNode } from "react";
import { SectionHeader } from "../primitives/SectionHeader";

interface GameOverPanelProps {
  title: string;
  subtitle: string;
  actions: ReactNode;
  /** When the headline may appear: after the last line of the count. */
  headlineDelayMs: number;
  children: ReactNode;
}

/**
 * The final count. Scores are read out a line at a time and the winner is named last;
 * a click or a key press anywhere skips straight to the result.
 */
export function GameOverPanel({ title, subtitle, actions, headlineDelayMs, children }: GameOverPanelProps): JSX.Element {
  const [settled, setSettled] = useState(false);
  const settle = () => setSettled(true);

  return (
    <section
      className={`game-over-layer ${settled ? "game-over-layer--settled" : ""}`}
      aria-label="Final scoreboard"
      onClick={settle}
      onKeyDown={settle}
    >
      <div className="game-over-layer__header">
        <div className="game-over-layer__headline" style={{ animationDelay: `${headlineDelayMs}ms` }}>
          <SectionHeader eyebrow="Game over" title={title} variant="ceremony" />
          <p>{subtitle}</p>
        </div>
        <div className="game-over-layer__actions">{actions}</div>
      </div>
      <div className="game-over-layer__scores">{children}</div>
    </section>
  );
}
