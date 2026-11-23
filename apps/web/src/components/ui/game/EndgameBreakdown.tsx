import { signed, type EndgameLedger } from "./endgameLedger";

interface EndgameBreakdownProps {
  ledger: EndgameLedger;
}

/** The lines that make up one player's final score, ending in the total they add up to. */
export function EndgameBreakdown({ ledger }: EndgameBreakdownProps): JSX.Element {
  return (
    <dl className="endgame-breakdown">
      <div className="endgame-breakdown__row">
        <dt>Routes claimed</dt>
        <dd>{signed(ledger.routePoints)}</dd>
      </div>
      {ledger.completed.map((ticket) => (
        <div key={ticket.id} className="endgame-breakdown__row endgame-breakdown__row--ticket">
          <dt>
            <span className="endgame-breakdown__mark" aria-hidden="true">✓</span>
            {ticket.label}
          </dt>
          <dd>{signed(ticket.points)}</dd>
        </div>
      ))}
      {ledger.failed.map((ticket) => (
        <div key={ticket.id} className="endgame-breakdown__row endgame-breakdown__row--ticket endgame-breakdown__row--failed">
          <dt>
            <span className="endgame-breakdown__mark" aria-hidden="true">✕</span>
            {ticket.label}
            <span className="endgame-breakdown__note"> (not connected)</span>
          </dt>
          <dd>{signed(-ticket.points)}</dd>
        </div>
      ))}
      <div className="endgame-breakdown__row">
        <dt>
          {ledger.stationsLeft} unused {ledger.stationsLeft === 1 ? "station" : "stations"}
        </dt>
        <dd>{signed(ledger.stationBonus)}</dd>
      </div>
      <div className="endgame-breakdown__row">
        <dt>
          Longest line
          <span className="endgame-breakdown__note"> ({ledger.longestLength} trains)</span>
        </dt>
        <dd>{signed(ledger.longestBonus)}</dd>
      </div>
      <div className="endgame-breakdown__row endgame-breakdown__row--total">
        <dt>Total</dt>
        <dd>{ledger.total}</dd>
      </div>
    </dl>
  );
}
