import { useEffect, useRef, useState } from "react";
import type { TrainCard, TrainCardFace } from "@hudson-hustle/game-core";

const HIGHLIGHT_MS = 1600;

function countByFace(hand: TrainCard[]): Map<TrainCardFace, number> {
  const counts = new Map<TrainCardFace, number>();
  for (const card of hand) {
    counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  }
  return counts;
}

/**
 * The face of the card the viewer just gained, for a moment after it arrives.
 * Replaces a blocking "you drew X" dialog: the hand itself shows where the card went.
 */
export function useDrawnCardHighlight(viewerId: string, hand: TrainCard[]): TrainCardFace | null {
  const [face, setFace] = useState<TrainCardFace | null>(null);
  const previousRef = useRef<{ viewerId: string; counts: Map<TrainCardFace, number>; size: number } | null>(null);

  useEffect(() => {
    const counts = countByFace(hand);
    const previous = previousRef.current;
    previousRef.current = { viewerId, counts, size: hand.length };

    // Only a single card arriving in the same player's hand is a draw; a new viewer or a payment is not.
    if (!previous || previous.viewerId !== viewerId || hand.length !== previous.size + 1) {
      if (previous && previous.viewerId !== viewerId) {
        setFace(null);
      }
      return;
    }
    const gained = [...counts.keys()].find((candidate) => (counts.get(candidate) ?? 0) > (previous.counts.get(candidate) ?? 0)) ?? null;
    setFace(gained);
    if (!gained) {
      return;
    }
    const timeout = window.setTimeout(() => setFace(null), HIGHLIGHT_MS);
    return () => window.clearTimeout(timeout);
  }, [hand, viewerId]);

  return face;
}
