export interface TableSeat {
  id: string;
  name: string;
  color: string;
  trainsLeft: number;
  stationsLeft: number;
  ticketCount: number;
  score: number;
  avatarName?: string | null;
}

interface TableSeatsProps {
  seats: TableSeat[];
  activePlayerId: string | null;
  viewerPlayerId: string;
  playerPalette: Record<string, string>;
  /** Turns left for each player once the final round has begun; null before that. */
  finalRound?: boolean;
}

/** Everyone at the table: who they are on the map, what they have left, and their score. */
export function TableSeats({ seats, activePlayerId, viewerPlayerId, playerPalette, finalRound = false }: TableSeatsProps): JSX.Element {
  return (
    <ul className="table-seats" aria-label="Players">
      {seats.map((seat) => {
        const active = seat.id === activePlayerId;
        return (
          <li
            key={seat.id}
            className={["table-seat", active ? "table-seat--active" : ""].filter(Boolean).join(" ")}
            style={{ ["--seat-color" as string]: playerPalette[seat.color] }}
            aria-current={active ? "true" : undefined}
          >
            <span className="table-seat__token">
              {seat.avatarName ? <img src={`/avatars/avatar-${seat.avatarName}.svg`} alt="" /> : null}
            </span>
            <span className="table-seat__who">
              <strong className="table-seat__name">
                {seat.name}
                {seat.id === viewerPlayerId ? <span className="table-seat__you"> (you)</span> : null}
              </strong>
              <span className="table-seat__counts">
                {seat.trainsLeft} trains · {seat.stationsLeft} {seat.stationsLeft === 1 ? "station" : "stations"} · {seat.ticketCount} {seat.ticketCount === 1 ? "ticket" : "tickets"}
              </span>
            </span>
            <span className="table-seat__score" aria-label={`${seat.score} points`}>
              {seat.score}
            </span>
          </li>
        );
      })}
      {finalRound ? <li className="table-seats__final">Final round</li> : null}
    </ul>
  );
}
