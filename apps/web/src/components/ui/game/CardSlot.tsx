import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { type TrainCardFace } from "@hudson-hustle/game-core";

export function formatCardLabel(color: TrainCardFace): string {
  if (color === "locomotive") {
    return "Locomotive";
  }
  return color
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface BaseCardSlotProps {
  face: TrainCardFace;
  accentColor: string;
}

interface HandCardSlotProps extends HTMLAttributes<HTMLDivElement>, BaseCardSlotProps {
  mode: "hand";
  count: number;
  spendDelta?: number;
}

interface MarketCardSlotProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseCardSlotProps {
  mode: "market";
}

export type CardSlotProps = HandCardSlotProps | MarketCardSlotProps;

export function CardSlot(props: CardSlotProps): JSX.Element {
  if (props.mode === "market") {
    const { face, accentColor, className, ...rest } = props;
    const classes = ["market-color-slot", `market-color-slot--${face}`, className].filter(Boolean).join(" ");
    return (
      <button
        type="button"
        className={classes}
        style={{ ["--hand-slot-color" as string]: accentColor }}
        {...rest}
      >
        <span className="market-color-slot__count">{face === "locomotive" ? "L" : "1"}</span>
        <span className="market-color-slot__label">{formatCardLabel(face)}</span>
      </button>
    );
  }

  const { face, accentColor, count, spendDelta = 0, className, ...rest } = props;
  const classes = [
    "hand-color-slot",
    `hand-color-slot--${face}`,
    count === 0 ? "hand-color-slot--empty" : "",
    spendDelta > 0 ? "hand-color-slot--spending" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} style={{ ["--hand-slot-color" as string]: accentColor }} {...rest}>
      <span className="hand-color-slot__count">{spendDelta > 0 ? count - spendDelta : count}</span>
      <span className="hand-color-slot__label">{formatCardLabel(face)}</span>
      <span className={`hand-color-slot__spend ${spendDelta > 0 ? "" : "hand-color-slot__spend--empty"}`}>
        {spendDelta > 0 ? `-${spendDelta}` : "0"}
      </span>
    </div>
  );
}
