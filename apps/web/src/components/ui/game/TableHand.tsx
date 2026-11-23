import { trainCardColors, type TrainCard, type TrainCardColor, type TrainCardFace as Face } from "@hudson-hustle/game-core";
import { formatCardLabel } from "./CardSlot";
import { LOCOMOTIVE_COLOR, TrainCardFace } from "./TrainCardFace";

interface TableHandProps {
  hand: TrainCard[];
  cardPalette: Record<string, string>;
  /** The payment the player is looking at: these cards lift out of the hand. */
  paymentPreview?: { color: TrainCardColor; totalCost: number; minimumLocomotives?: number } | null;
  /** The face just drawn, so its stack can be pointed out. */
  highlightedFace?: Face | null;
}

const MAX_FANNED = 5;

export function countByFace(hand: TrainCard[]): Record<Face, number> {
  const counts = Object.fromEntries([...trainCardColors, "locomotive"].map((face) => [face, 0])) as Record<Face, number>;
  for (const card of hand) {
    counts[card.color] += 1;
  }
  return counts;
}

/** Which cards a payment takes: the colour first, locomotives for the required ones and for any shortfall. */
export function paymentSpend(
  counts: Record<Face, number>,
  preview: NonNullable<TableHandProps["paymentPreview"]>
): Partial<Record<Face, number>> {
  const minimumLocomotives = preview.minimumLocomotives ?? 0;
  const baseNeed = Math.max(0, preview.totalCost - minimumLocomotives);
  const coloured = Math.min(counts[preview.color], baseNeed);
  const locomotives = minimumLocomotives + Math.max(0, baseNeed - coloured);
  const spend: Partial<Record<Face, number>> = {};
  if (coloured > 0) spend[preview.color] = coloured;
  if (locomotives > 0) spend.locomotive = locomotives;
  return spend;
}

/** The player's hand, laid out as stacks of cards by colour. */
export function TableHand({ hand, cardPalette, paymentPreview = null, highlightedFace = null }: TableHandProps): JSX.Element {
  const counts = countByFace(hand);
  const faces: Face[] = [...trainCardColors, "locomotive"];
  const spend = paymentPreview ? paymentSpend(counts, paymentPreview) : {};
  const held = faces.filter((face) => counts[face] > 0);

  return (
    <section className="table-hand" aria-label={`Your hand: ${hand.length} cards`}>
      {held.length === 0 ? <p className="table-hand__empty">No cards yet. Draw from the deck or the face-up cards.</p> : null}
      <ul className="table-hand__stacks">
        {held.map((face) => {
          const count = counts[face];
          const leaving = spend[face] ?? 0;
          const shown = Math.min(count, MAX_FANNED);
          const color = face === "locomotive" ? LOCOMOTIVE_COLOR : cardPalette[face];
          return (
            <li
              key={face}
              className={["table-hand__stack", face === highlightedFace ? "table-hand__stack--drawn" : "", leaving > 0 ? "table-hand__stack--paying" : ""].filter(Boolean).join(" ")}
              data-face={face}
              style={{ ["--stack-size" as string]: shown }}
              aria-label={`${count} ${formatCardLabel(face)}${leaving > 0 ? `, ${leaving} would be spent` : ""}`}
            >
              {Array.from({ length: shown }, (_, index) => (
                <TrainCardFace
                  key={index}
                  face={face}
                  color={color}
                  className={index >= shown - Math.min(leaving, shown) ? "train-card--leaving" : ""}
                />
              ))}
              <small className="table-hand__count" aria-hidden="true">
                {leaving > 0 ? `${count} − ${leaving}` : `×${count}`}
              </small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
