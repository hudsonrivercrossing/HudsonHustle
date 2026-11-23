import { type TrainCardFace } from "@hudson-hustle/game-core";

/** "Locomotive", "Crimson": a card face as a word. */
export function formatCardLabel(color: TrainCardFace): string {
  if (color === "locomotive") {
    return "Locomotive";
  }
  return color
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
