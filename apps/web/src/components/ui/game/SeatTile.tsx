export interface SeatTileProps {
  name?: string;
  color?: string;
  ticketCount?: number;
  trainsLeft?: number;
  stationsLeft?: number;
  /** Points on the board so far. Tickets stay secret until the end, so this is route points during play. */
  score?: number;
  active?: boolean;
  timerLabel?: string | null;
  placeholder?: boolean;
  seatLabel?: string;
  avatarName?: string | null;
}

export function SeatTile({
  name,
  color,
  ticketCount = 0,
  trainsLeft,
  stationsLeft,
  score,
  active = false,
  timerLabel = null,
  placeholder = false,
  seatLabel,
  avatarName
}: SeatTileProps): JSX.Element {
  if (placeholder) {
    return (
      <article className="player-strip player-roster__row player-roster__row--placeholder" aria-label="Empty player slot">
        <img className="seat-avatar seat-avatar--tiny" src="/avatars/avatar-Conductor.svg" alt="Empty seat" />
        <div className="row-object__main">
          <strong className="row-object__title">Open</strong>
          <span className="row-object__meta">{seatLabel ?? "Seat"}</span>
        </div>
        <span className="player-roster__timer" />
        <div className="row-object__stats" />
      </article>
    );
  }

  const pieces = [
    typeof trainsLeft === "number" ? `${trainsLeft} trains` : null,
    typeof stationsLeft === "number" ? `${stationsLeft} ${stationsLeft === 1 ? "station" : "stations"}` : null
  ].filter(Boolean);

  return (
    <article
      className={`player-strip player-roster__row ${active ? "player-strip--active" : ""}`}
      style={{ ["--seat-color" as string]: color }}
      aria-current={active ? "true" : undefined}
    >
      <span className="player-roster__token">
        {avatarName ? <img className="seat-avatar seat-avatar--tiny" src={`/avatars/avatar-${avatarName}.svg`} alt="" /> : null}
      </span>
      <div className="row-object__main">
        <strong className="row-object__title">{name}</strong>
        <span className="row-object__meta">{pieces.join(" · ")}</span>
        <span className="row-object__meta">
          {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
        </span>
      </div>
      <span className="player-roster__timer">{timerLabel}</span>
      {typeof score === "number" ? (
        <span className="player-roster__score" aria-label={`${score} points`}>
          {score}
        </span>
      ) : null}
    </article>
  );
}
