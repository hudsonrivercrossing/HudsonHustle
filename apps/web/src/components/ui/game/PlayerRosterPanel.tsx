import { useState } from "react";
import { Panel } from "../primitives/Panel";
import { SeatTile } from "./SeatTile";

export type PlayerRosterEntry = {
  id: string;
  name: string;
  color: string;
  trainsLeft: number;
  stationsLeft: number;
  ticketCount: number;
  score?: number;
  routesCount?: number;
  avatarName?: string | null;
};

export type PlayerRosterTimer = {
  activePlayerIndex: number;
  secondsRemaining: number | null;
} | null;

function formatRosterTimer(secondsRemaining: number | null): string | null {
  if (secondsRemaining === null) return null;
  return String(Math.max(0, Math.min(99, Math.ceil(secondsRemaining)))).padStart(2, "0");
}

interface PlayerRosterProps {
  players: PlayerRosterEntry[];
  activePlayerIndex: number;
  playerPalette: Record<string, string>;
  timer?: PlayerRosterTimer;
  className?: string;
}

export function PlayerRoster({ players, activePlayerIndex, playerPalette, timer = null, className = "" }: PlayerRosterProps): JSX.Element {
  const rosterSlots = Array.from({ length: 4 }, (_, index) => players[index] ?? null);
  const timerLabel = timer?.activePlayerIndex === activePlayerIndex ? formatRosterTimer(timer.secondsRemaining) : null;

  return (
    <Panel variant="info" className={["player-roster", className].filter(Boolean).join(" ")}>
      <div className="scoreboard player-roster__list">
        {rosterSlots.map((player, index) => {
          const isActive = index === activePlayerIndex;
          const slotTimer = timer?.activePlayerIndex === index ? formatRosterTimer(timer.secondsRemaining) : null;
          return player ? (
            <SeatTile
              key={player.id}
              name={player.name}
              color={playerPalette[player.color]}
              ticketCount={player.ticketCount ?? 0}
              trainsLeft={player.trainsLeft}
              stationsLeft={player.stationsLeft}
              active={isActive}
              timerLabel={slotTimer}
              avatarName={player.avatarName}
            />
          ) : (
            <SeatTile key={`empty-seat-${index}`} placeholder seatLabel={`Seat ${index + 1}`} />
          );
        })}
      </div>
      <span className="player-roster__active-label">
        {players[activePlayerIndex]?.name ?? "Player"} active{timerLabel ? ` · ${timerLabel}` : ""}
      </span>
    </Panel>
  );
}

const CORNER_POSITIONS = ["top-left", "top-right", "bottom-right", "bottom-left"] as const;

interface FloatingPlayerPanelProps {
  player: PlayerRosterEntry;
  cornerIndex: number;
  isActive: boolean;
  color: string;
}

function FloatingPlayerPanel({ player, cornerIndex, isActive, color }: FloatingPlayerPanelProps): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <div
      className={`floating-player-panel floating-player-panel--${CORNER_POSITIONS[cornerIndex]} ${isActive ? "floating-player-panel--active" : ""}`}
      style={{ "--player-color": color } as React.CSSProperties}
    >
      {player.avatarName ? (
        <img className="floating-player-panel__avatar" src={`/avatars/avatar-${player.avatarName}.svg`} alt="" />
      ) : null}
      <div className="floating-player-panel__info">
        <span className="floating-player-panel__name">{player.name}</span>
        <button
          className="floating-player-panel__stats-toggle"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          type="button"
        >
          <span className="floating-player-panel__primary-stats">
            {player.score !== undefined ? `${player.score}pts · ` : ""}
            {player.ticketCount ?? 0} tickets · {player.trainsLeft} trains
          </span>
          <span className="floating-player-panel__toggle-caret" aria-hidden="true">
            {detailsOpen ? "▲" : "▼"}
          </span>
        </button>
        {detailsOpen && (
          <span className="floating-player-panel__secondary-stats">
            {player.routesCount ?? 0} routes · {player.stationsLeft} stations
          </span>
        )}
      </div>
    </div>
  );
}

interface FloatingPlayerRosterProps {
  players: PlayerRosterEntry[];
  activePlayerIndex: number;
  playerPalette: Record<string, string>;
  viewerPlayerId?: string | null;
}

export function FloatingPlayerRoster({ players, activePlayerIndex, playerPalette, viewerPlayerId }: FloatingPlayerRosterProps): JSX.Element {
  const viewerIndex = viewerPlayerId ? players.findIndex((p) => p.id === viewerPlayerId) : -1;
  const effectiveViewer = viewerIndex >= 0 ? viewerIndex : 0;

  const ordered: Array<{ player: PlayerRosterEntry; cornerIndex: number }> = [];
  const n = players.length;
  for (let i = 0; i < n; i++) {
    const playerIdx = (effectiveViewer + i) % n;
    ordered.push({ player: players[playerIdx], cornerIndex: i });
  }

  return (
    <div className="floating-player-roster" data-tour-target="roster">
      {ordered.map(({ player, cornerIndex }) => (
        <FloatingPlayerPanel
          key={player.id}
          player={player}
          cornerIndex={cornerIndex}
          isActive={players.indexOf(player) === activePlayerIndex}
          color={playerPalette[player.color]}
        />
      ))}
    </div>
  );
}
