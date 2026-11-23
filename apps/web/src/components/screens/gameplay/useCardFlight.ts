import { useEffect, useRef } from "react";
import type { TrainCardFace } from "@hudson-hustle/game-core";

/** Short on purpose: a player draws two cards a turn, every turn. */
const FLIGHT_MS = 240;

/**
 * Shows a drawn card travelling from where it was taken to its stack in the hand.
 * `markSource` is called when the player clicks a card or the deck; when the card then appears
 * in the hand (`arrivedFace`), a copy flies between the two places. Nothing happens for reduced motion,
 * or when the source is unknown, such as a card drawn by someone else's action.
 */
export function useCardFlight(arrivedFace: TrainCardFace | null, colorOf: (face: TrainCardFace) => string): { markSource: (element: Element | null) => void } {
  const source = useRef<{ rect: DOMRect; at: number } | null>(null);

  useEffect(() => {
    const from = source.current;
    source.current = null;
    if (!arrivedFace || !from || performance.now() - from.at > 3000) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const target = document.querySelector(`.table-hand__stack[data-face="${arrivedFace}"] .train-card:last-of-type`);
    if (!target || typeof target.animate !== "function") {
      return;
    }
    const to = target.getBoundingClientRect();
    const card = document.createElement("span");
    card.className = "train-card train-card--flying";
    card.style.setProperty("--card-color", colorOf(arrivedFace));
    card.style.left = `${to.left}px`;
    card.style.top = `${to.top}px`;
    card.style.width = `${to.width}px`;
    card.style.height = `${to.height}px`;
    document.body.appendChild(card);
    const dx = from.rect.left + from.rect.width / 2 - (to.left + to.width / 2);
    const dy = from.rect.top + from.rect.height / 2 - (to.top + to.height / 2);
    const animation = card.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${from.rect.width / to.width})`, opacity: 0.9 },
        { transform: "translate(0, 0) scale(1)", opacity: 1 }
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.32, 0.72, 0, 1)" }
    );
    const remove = () => card.remove();
    animation.addEventListener("finish", remove);
    animation.addEventListener("cancel", remove);
    return remove;
  }, [arrivedFace]);

  return {
    markSource(element) {
      source.current = element ? { rect: element.getBoundingClientRect(), at: performance.now() } : null;
    }
  };
}
