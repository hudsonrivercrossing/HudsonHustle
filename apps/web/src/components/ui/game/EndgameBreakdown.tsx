import { signed, type EndgameLedger } from "./endgameLedger";

interface EndgameBreakdownProps {
  ledger: EndgameLedger;
  /** Milliseconds between one line appearing and the next. */
  revealStepMs: number;
  /** The beat on which totals appear, the same for every player so they land together. */
  totalBeat: number;
}

/** The lines that make up one player's final score, ending in the total they add up to. */
export function EndgameBreakdown({ ledger, revealStepMs, totalBeat }: EndgameBreakdownProps): JSX.Element {
  let beat = 0;
  const at = () => ({ animationDelay: `${(beat++) * revealStepMs}ms` });

  return (
    <dl className="endgame-breakdown">
      <div className="endgame-breakdown__row" style={at()}>
        <dt>Routes claimed</dt>
        <dd>{signed(ledger.routePoints)}</dd>
      </div>
      {ledger.completed.map((ticket) => (
        <div key={ticket.id} className="endgame-breakdown__row endgame-breakdown__row--ticket" style={at()}>
          <dt>
            <span className="endgame-breakdown__mark" aria-hidden="true">✓</span>
            {ticket.label}
          </dt>
          <dd>{signed(ticket.points)}</dd>
        </div>
      ))}
      {ledger.failed.map((ticket) => (
        <div key={ticket.id} className="endgame-breakdown__row endgame-breakdown__row--ticket endgame-breakdown__row--failed" style={at()}>
          <dt>
            <span className="endgame-breakdown__mark" aria-hidden="true">✕</span>
            {ticket.label}
            <span className="endgame-breakdown__note"> (not connected)</span>
          </dt>
          <dd>{signed(-ticket.points)}</dd>
        </div>
      ))}
      <div className="endgame-breakdown__row" style={at()}>
        <dt>
          {ledger.stationsLeft} unused {ledger.stationsLeft === 1 ? "station" : "stations"}
        </dt>
        <dd>{signed(ledger.stationBonus)}</dd>
      </div>
      <div className="endgame-breakdown__row" style={at()}>
        <dt>
          Longest line
          <span className="endgame-breakdown__note"> ({ledger.longestLength} trains)</span>
        </dt>
        <dd>{signed(ledger.longestBonus)}</dd>
      </div>
      <div className="endgame-breakdown__row endgame-breakdown__row--total" style={{ animationDelay: `${totalBeat * revealStepMs}ms` }}>
        <dt>Total</dt>
        <dd>{ledger.total}</dd>
      </div>
    </dl>
  );
}
