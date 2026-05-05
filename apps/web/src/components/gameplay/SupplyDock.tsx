import { type TrainCard } from "@hudson-hustle/game-core";
import { Button } from "../system/Button";
import { SectionHeader } from "../system/SectionHeader";
import { CardSlot } from "../system/game";

interface SupplyDockProps {
  market: TrainCard[];
  deckCount: number;
  cardPalette: Record<string, string>;
  disabled: boolean;
  isMarketCardDisabled?: (card: TrainCard, marketIndex: number) => boolean;
  onDrawFromMarket: (marketIndex: number) => void;
  onDrawFromDeck: () => void;
  onDrawTickets?: () => void;
  drawTicketsDisabled?: boolean;
  className?: string;
}

export function SupplyDock({
  market,
  deckCount,
  cardPalette,
  disabled,
  isMarketCardDisabled,
  onDrawFromMarket,
  onDrawFromDeck,
  onDrawTickets,
  drawTicketsDisabled = false,
  className = ""
}: SupplyDockProps): JSX.Element {
  return (
    <div className={["supply-dock", className].filter(Boolean).join(" ")}>
      <SectionHeader title="Market" meta={`${deckCount} deck`} variant="compact" />
      <div className="market-grid supply-dock__market">
        {market.map((card, index) => (
          <CardSlot
            key={card.id}
            mode="market"
            face={card.color}
            accentColor={card.color === "locomotive" ? "#91a8bd" : cardPalette[card.color]}
            disabled={disabled || Boolean(isMarketCardDisabled?.(card, index))}
            onClick={() => onDrawFromMarket(index)}
          />
        ))}
      </div>
      <Button className="supply-dock__draw-deck" disabled={disabled} onClick={onDrawFromDeck}>
        Draw from deck
      </Button>
      {onDrawTickets && <div className="supply-dock__divider" />}
      {onDrawTickets ? (
        <Button className="supply-dock__draw-tickets" disabled={drawTicketsDisabled} onClick={onDrawTickets}>
          Draw tickets
        </Button>
      ) : null}
    </div>
  );
}
