import { useEffect } from "react";
import type { TrainCardFace as Face } from "@hudson-hustle/game-core";
import { LOCOMOTIVE_COLOR, TrainCardFace } from "./TrainCardFace";

export interface TunnelRevealView {
  /** Changes for every attempt, so the same cards twice in a row still play. */
  key: string;
  playerName: string;
  routeLabel: string;
  cards: Face[];
  extraCost: number;
  claimed: boolean;
}

interface TunnelRevealMomentProps {
  reveal: TunnelRevealView;
  cardPalette: Record<string, string>;
  onDone: () => void;
}

/** Time between one card turning over and the next. Long enough to read a card, short enough to stay a beat. */
export const TUNNEL_CARD_STEP_MS = 520;
const VERDICT_HOLD_MS = 2200;

/**
 * The one gamble in the game, played out: the cards turn over one at a time, then the price is read out.
 * It closes by itself, and on any key or click, and never blocks the table for longer than that.
 */
export function TunnelRevealMoment({ reveal, cardPalette, onDone }: TunnelRevealMomentProps): JSX.Element {
  const verdictDelay = reveal.cards.length * TUNNEL_CARD_STEP_MS + 200;

  useEffect(() => {
    const timeout = window.setTimeout(onDone, verdictDelay + VERDICT_HOLD_MS);
    const close = () => onDone();
    window.addEventListener("keydown", close);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", close);
    };
  }, [reveal.key]);

  const verdict = reveal.claimed
    ? reveal.extraCost === 0
      ? "Clear. No extra cost."
      : `${reveal.extraCost} extra ${reveal.extraCost === 1 ? "card" : "cards"}, paid.`
    : `${reveal.extraCost} extra ${reveal.extraCost === 1 ? "card" : "cards"} needed. The claim fails.`;

  return (
    <div className="tunnel-moment" role="status" onClick={onDone}>
      <div className="tunnel-moment__card">
        <p className="tunnel-moment__eyebrow">Tunnel · {reveal.routeLabel}</p>
        <p className="tunnel-moment__title">{reveal.playerName} digs</p>
        {reveal.cards.length > 0 ? (
          <ul className="tunnel-moment__cards">
            {reveal.cards.map((face, index) => (
              <li key={index} className="tunnel-moment__slot" style={{ animationDelay: `${index * TUNNEL_CARD_STEP_MS}ms` }}>
                <TrainCardFace face={face} color={face === "locomotive" ? LOCOMOTIVE_COLOR : cardPalette[face]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="tunnel-moment__note">No cards left to turn over.</p>
        )}
        <p
          className={`tunnel-moment__verdict ${reveal.claimed ? "" : "tunnel-moment__verdict--failed"}`}
          style={{ animationDelay: `${verdictDelay}ms` }}
        >
          {verdict}
        </p>
      </div>
    </div>
  );
}
