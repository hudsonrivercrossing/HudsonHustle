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
  /** Show placeholders up to four seats. Off once a game is under way, when nobody else can sit down. */
  showOpenSeats?: boolean;
  className?: string;
}

export function PlayerRoster({ players, activePlayerIndex, playerPalette, timer = null, showOpenSeats = true, className = "" }: PlayerRosterProps): JSX.Element {
  const rosterSlots = showOpenSeats ? Array.from({ length: 4 }, (_, index) => players[index] ?? null) : players;
  const timerLabel = timer?.activePlayerIndex === activePlayerIndex ? formatRosterTimer(timer.secondsRemaining) : null;

  return (
    <Panel variant="private" className={["player-roster", className].filter(Boolean).join(" ")}>
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
