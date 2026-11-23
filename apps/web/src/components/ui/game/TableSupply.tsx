import type { TrainCard } from "@hudson-hustle/game-core";
import { formatCardLabel } from "./CardSlot";
import { LOCOMOTIVE_COLOR, TrainCardFace } from "./TrainCardFace";

interface TableSupplyProps {
  market: TrainCard[];
  deckCount: number;
  cardPalette: Record<string, string>;
  disabled: boolean;
  isMarketCardDisabled?: (card: TrainCard) => boolean;
  onDrawFromMarket: (marketIndex: number) => void;
  onDrawFromDeck: () => void;
}

/** The draw pile and the five face-up cards. */
export function TableSupply({ market, deckCount, cardPalette, disabled, isMarketCardDisabled, onDrawFromMarket, onDrawFromDeck }: TableSupplyProps): JSX.Element {
  return (
    <section className="table-supply" aria-label="Cards to draw">
      <button type="button" className="table-supply__deck" disabled={disabled || deckCount === 0} onClick={onDrawFromDeck} data-draw-source="deck">
        <TrainCardFace face="locomotive" color={LOCOMOTIVE_COLOR} back />
        <span className="table-supply__deck-label">
          Draw from deck
          <span className="table-supply__deck-count"> ({deckCount} left)</span>
        </span>
      </button>
      <ul className="table-supply__market">
        {market.map((card, index) => (
          <li key={card.id}>
            <button
              type="button"
              className="table-supply__card"
              disabled={disabled || Boolean(isMarketCardDisabled?.(card))}
              onClick={() => onDrawFromMarket(index)}
              aria-label={`Take ${formatCardLabel(card.color)}`}
              data-draw-source="market"
            >
              <TrainCardFace face={card.color} color={card.color === "locomotive" ? LOCOMOTIVE_COLOR : cardPalette[card.color]} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
