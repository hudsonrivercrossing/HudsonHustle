export interface SeatTileProps {
  name?: string;
  color?: string;
  ticketCount?: number;
  trainsLeft?: number;
  stationsLeft?: number;
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
        <span className="player-roster__timer" />
        <div className="row-object__main">
          <strong className="row-object__title">Open</strong>
          <span className="row-object__meta">{seatLabel ?? "Seat"}</span>
        </div>
        <div className="row-object__stats" />
      </article>
    );
  }

  return (
    <article className={`player-strip player-roster__row ${active ? "player-strip--active" : ""}`}>
      {avatarName ? (
        <img className="seat-avatar seat-avatar--tiny" src={`/avatars/avatar-${avatarName}.svg`} alt={`${name} avatar`} />
      ) : (
        <span className="player-swatch row-object__lead" style={{ background: color }} />
      )}
      <span className="player-roster__timer">{timerLabel}</span>
      <div className="row-object__main">
        <strong className="row-object__title">{name}</strong>
        <span className="row-object__meta">{active ? "Active" : `${ticketCount} tickets`}</span>
      </div>
      <div className="row-object__stats">
        {typeof trainsLeft === "number" ? <span className="row-object__stat">{trainsLeft} trains</span> : null}
        {typeof stationsLeft === "number" ? <span className="row-object__stat">{stationsLeft} stations</span> : null}
      </div>
    </article>
  );
}
