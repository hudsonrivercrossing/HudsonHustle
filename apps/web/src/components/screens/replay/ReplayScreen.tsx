import { useEffect, useMemo, useState } from "react";
import type { GameState, MapConfig } from "@hudson-hustle/game-core";
import type { getHudsonHustleVisualsByConfigId } from "@hudson-hustle/game-data";
import { BoardMap } from "../../ui/game";
import { Panel } from "../../ui/primitives/Panel";
import { Button } from "../../ui/primitives/Button";
import { buildReplaySteps } from "./replaySteps";

const AUTOPLAY_INTERVAL_MS = 900;

interface ReplayScreenProps {
  game: GameState;
  config: MapConfig;
  visuals: ReturnType<typeof getHudsonHustleVisualsByConfigId>;
  onClose: () => void;
}

/** Steps through a finished game one public move at a time. */
export function ReplayScreen({ game, config, visuals, onClose }: ReplayScreenProps): JSX.Element {
  const [boardOnly, setBoardOnly] = useState(false);
  const steps = useMemo(() => buildReplaySteps(game, config, { boardOnly }), [boardOnly, config, game]);
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

  function toggleBoardOnly() {
    // The two lists number their steps differently, so go back to the finished board.
    setPlaying(false);
    setBoardOnly((current) => !current);
  }

  useEffect(() => {
    setIndex(lastIndex);
    // Only when the filter flips: lastIndex is then the end of the newly built list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardOnly]);

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

      <Panel variant="neutral" className="board-stage board-panel replay-screen__board">
        <div className="board-stage__map">
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
          interactive={false}
          onSelectRoute={() => undefined}
          onSelectCity={() => undefined}
        />
        </div>
      </Panel>

      <footer className="replay-screen__controls">
        <p className="replay-screen__caption" aria-live="polite">
          <span className="replay-screen__step">
            {Math.min(index, lastIndex)} / {lastIndex}
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
              <span className="replay-screen__tally">
                {step.cardsDrawn[player.id] ?? 0} cards · {step.ticketsKept[player.id] ?? 0} tickets
              </span>
            </li>
          ))}
        </ul>
        <label className="replay-screen__filter">
          <input type="checkbox" checked={boardOnly} onChange={toggleBoardOnly} />
          Routes and stations only
        </label>
        <p className="replay-screen__note">
          Points shown are from routes. Tickets, stations and the longest network are scored when the game ends, and cards drawn from the deck stay
          face down.
        </p>
      </footer>
    </div>
  );
}
