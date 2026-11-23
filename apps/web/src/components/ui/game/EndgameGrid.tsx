import { EndgameBreakdown } from "./EndgameBreakdown";
import type { EndgameLedger } from "./endgameLedger";

interface EndgameGridProps {
  ledgers: EndgameLedger[];
  playerPalette: Record<string, string>;
  revealStepMs: number;
  totalBeat: number;
}

const ordinals = ["1st", "2nd", "3rd", "4th"];

/** Final scores in seating order, so nothing gives the result away while the lines are read out; ranks land with the totals. */
export function EndgameGrid({ ledgers, playerPalette, revealStepMs, totalBeat }: EndgameGridProps): JSX.Element {
  const finale = { animationDelay: `${totalBeat * revealStepMs}ms` };
  return (
    <ol className="endgame-grid">
      {[...ledgers].sort((left, right) => left.seat - right.seat).map((ledger) => (
        <li
          key={ledger.playerId}
          className={`endgame-card ${ledger.isWinner ? "endgame-card--winner" : ""}`}
          style={{ ["--seat-color" as string]: playerPalette[ledger.color], ...finale }}
        >
          <header className="endgame-card__header">
            <span className="endgame-card__rank" style={finale}>
              {ledger.isWinner ? "Winner" : ordinals[ledger.rank - 1] ?? `${ledger.rank}th`}
            </span>
            <h3 className="endgame-card__name">
              <span className="endgame-card__chip" aria-hidden="true" />
              {ledger.name}
            </h3>
            <p className="endgame-score" style={finale}>
              {ledger.total}
              <span className="endgame-score__label"> points</span>
            </p>
          </header>
          <EndgameBreakdown ledger={ledger} revealStepMs={revealStepMs} totalBeat={totalBeat} />
        </li>
      ))}
    </ol>
  );
}
