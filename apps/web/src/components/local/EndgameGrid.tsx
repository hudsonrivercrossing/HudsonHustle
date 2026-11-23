import { EndgameBreakdown, type EndgameLedger } from "../ui/game";

interface EndgameGridProps {
  ledgers: EndgameLedger[];
  playerPalette: Record<string, string>;
}

const ordinals = ["1st", "2nd", "3rd", "4th"];

/** Final standings, best score first. */
export function EndgameGrid({ ledgers, playerPalette }: EndgameGridProps): JSX.Element {
  return (
    <ol className="endgame-grid">
      {ledgers.map((ledger) => (
        <li
          key={ledger.playerId}
          className={`endgame-card ${ledger.isWinner ? "endgame-card--winner" : ""}`}
          style={{ ["--seat-color" as string]: playerPalette[ledger.color] }}
        >
          <header className="endgame-card__header">
            <span className="endgame-card__rank">{ledger.isWinner ? "Winner" : ordinals[ledger.rank - 1] ?? `${ledger.rank}th`}</span>
            <h3 className="endgame-card__name">
              <span className="endgame-card__chip" aria-hidden="true" />
              {ledger.name}
            </h3>
            <p className="endgame-score">
              {ledger.total}
              <span className="endgame-score__label"> points</span>
            </p>
          </header>
          <EndgameBreakdown ledger={ledger} />
        </li>
      ))}
    </ol>
  );
}
