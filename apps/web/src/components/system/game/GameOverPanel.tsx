import type { ReactNode } from "react";
import { SectionHeader } from "../SectionHeader";

interface GameOverPanelProps {
  title: string;
  subtitle: string;
  actions: ReactNode;
  children: ReactNode;
}

export function GameOverPanel({ title, subtitle, actions, children }: GameOverPanelProps): JSX.Element {
  return (
    <section className="game-over-layer" aria-label="Final scoreboard">
      <div className="game-over-layer__header">
        <SectionHeader eyebrow="Game over" title={title} density="ceremony" />
        <p>{subtitle}</p>
        <div className="game-over-layer__actions">{actions}</div>
      </div>
      <div className="game-over-layer__scores">{children}</div>
    </section>
  );
}
