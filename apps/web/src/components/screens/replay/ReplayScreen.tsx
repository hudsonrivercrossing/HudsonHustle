import { useEffect, useMemo, useState } from "react";
import type { GameState, MapConfig } from "@hudson-hustle/game-core";
import type { getHudsonHustleVisualsByConfigId } from "@hudson-hustle/game-data";
import { BoardMap, BoardStage } from "../../ui/game";
import { Button } from "../../ui/primitives/Button";
import { buildReplaySteps } from "./replaySteps";

const AUTOPLAY_INTERVAL_MS = 900;

interface ReplayScreenProps {
  game: GameState;
  config: MapConfig;
  visuals: ReturnType<typeof getHudsonHustleVisualsByConfigId>;
  onClose: () => void;
}

/** Steps through a finished game one route or station at a time. */
export function ReplayScreen({ game, config, visuals, onClose }: ReplayScreenProps): JSX.Element {
  const steps = useMemo(() => buildReplaySteps(game, config), [config, game]);
  const lastIndex = steps.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const [playing, setPlaying] = useState(false);
  const step = steps[Math.min(index, lastIndex)];

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (index >= lastIndex) {
      setPlaying(false);
      return;
    }
    const timeout = window.setTimeout(() => setIndex((current) => Math.min(current + 1, lastIndex)), AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [index, lastIndex, playing]);

  function play() {
    if (index >= lastIndex) {
      setIndex(0);
    }
    setPlaying(true);
  }

  return (
    <div className="app-shell app-shell--gameplay-hud replay-screen" data-config-theme={visuals.theme}>
      <header className="replay-screen__header">
        <h1 className="replay-screen__title">Replay</h1>
        <Button onClick={onClose}>Back to results</Button>
      </header>

      <BoardStage className="board-panel replay-screen__board">
        <BoardMap
          config={config}
          backdrop={visuals.backdrop}
          backdropMode={visuals.backdropMode}
          boardLabelMode={visuals.boardLabelMode}
          cardPalette={visuals.palettes.cards}
          playerPalette={visuals.palettes.players}
          viewerPlayerId={step.playerId}
          game={{
            players: game.players.map((player) => ({ id: player.id, name: player.name, color: player.color })),
            activePlayerIndex: Math.max(0, game.players.findIndex((player) => player.id === step.playerId)),
            routeClaims: step.routeClaims,
            stations: step.stations
          }}
          selectedRouteId={null}
          selectedCityId={null}
          highlightedCityIds={[]}
          onSelectRoute={() => undefined}
          onSelectCity={() => undefined}
        />
      </BoardStage>

      <footer className="replay-screen__controls">
        <p className="replay-screen__caption" aria-live="polite">
          <span className="replay-screen__step">
            {index} / {lastIndex}
          </span>
          {step.caption}
        </p>
        <div className="replay-screen__transport">
          <Button onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} aria-label="Previous move">
            ‹
          </Button>
          <Button variant="primary" onClick={() => (playing ? setPlaying(false) : play())} disabled={lastIndex === 0}>
            {playing ? "Pause" : "Play"}
          </Button>
          <Button onClick={() => setIndex((current) => Math.min(lastIndex, current + 1))} disabled={index >= lastIndex} aria-label="Next move">
            ›
          </Button>
          <input
            className="replay-screen__slider"
            type="range"
            min={0}
            max={lastIndex}
            value={index}
            aria-label="Move"
            onChange={(event) => {
              setPlaying(false);
              setIndex(Number(event.target.value));
            }}
          />
        </div>
        <ul className="replay-screen__scores">
          {game.players.map((player) => (
            <li key={player.id} className={player.id === step.playerId ? "replay-screen__score replay-screen__score--active" : "replay-screen__score"}>
              <span className="replay-screen__swatch" style={{ background: visuals.palettes.players[player.color] }} aria-hidden="true" />
              <span>{player.name}</span>
              <span className="replay-screen__points">{step.routePoints[player.id] ?? 0}</span>
            </li>
          ))}
        </ul>
        <p className="replay-screen__note">Route points only. Tickets, stations and the longest network are scored when the game ends.</p>
      </footer>
    </div>
  );
}
