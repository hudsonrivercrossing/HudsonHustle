import type { TrainCardFace as Face } from "@hudson-hustle/game-core";
import { formatCardLabel } from "./CardSlot";
import { ColorMark, colorMarkInk } from "./ColorMark";

interface TrainCardFaceProps {
  face: Face;
  color: string;
  /** Face down: the back of the deck. */
  back?: boolean;
  className?: string;
}

export const LOCOMOTIVE_COLOR = "#91a8bd";

/** One transit card. The colour name is printed on it, so the card never relies on colour alone. */
export function TrainCardFace({ face, color, back = false, className = "" }: TrainCardFaceProps): JSX.Element {
  if (back) {
    return <span className={["train-card", "train-card--back", className].filter(Boolean).join(" ")} aria-hidden="true" />;
  }
  return (
    <span
      className={["train-card", face === "locomotive" ? "train-card--locomotive" : "", className].filter(Boolean).join(" ")}
      style={{ ["--card-color" as string]: color }}
      data-face={face}
    >
      <span className="train-card__pip" aria-hidden="true">
        {face === "locomotive" ? (
          "★"
        ) : (
          <svg viewBox="-6 -6 12 12" className={`train-card__mark train-card__mark--${colorMarkInk(face)}`}>
            <ColorMark color={face} />
          </svg>
        )}
      </span>
      <span className="train-card__name">{face === "locomotive" ? "Wild" : formatCardLabel(face)}</span>
    </span>
  );
}
