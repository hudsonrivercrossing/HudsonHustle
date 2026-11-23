import { useEffect, useRef, useState } from "react";
import { getCityName, type GameState, type MapConfig } from "@hudson-hustle/game-core";
import type { TunnelRevealView } from "../../ui/game";

/**
 * The tunnel attempt that has just happened, until it is dismissed.
 * Attempts already in the log when the screen appears are not replayed.
 */
export function useTunnelReveal(game: GameState, config: MapConfig): { reveal: TunnelRevealView | null; dismiss: () => void } {
  const [reveal, setReveal] = useState<TunnelRevealView | null>(null);
  const lastSeq = useRef<number | null>(null);
  const latestSeq = game.events.at(-1)?.seq ?? 0;

  useEffect(() => {
    const seenUpTo = lastSeq.current;
    lastSeq.current = latestSeq;
    if (seenUpTo === null) {
      return;
    }
    const attempt = game.events
      .filter((event) => event.seq > seenUpTo)
      .reverse()
      .find((event) => (event.type === "route_claimed" || event.type === "tunnel_failed") && event.tunnel);
    if (!attempt || (attempt.type !== "route_claimed" && attempt.type !== "tunnel_failed") || !attempt.tunnel) {
      return;
    }
    const route = config.routes.find((candidate) => candidate.id === attempt.routeId);
    setReveal({
      key: String(attempt.seq),
      playerName: game.players.find((player) => player.id === attempt.playerId)?.name ?? "A player",
      routeLabel: route ? `${getCityName(config, route.from)} → ${getCityName(config, route.to)}` : "",
      cards: attempt.tunnel.cards,
      extraCost: attempt.tunnel.extraCost,
      claimed: attempt.type === "route_claimed"
    });
  }, [latestSeq]);

  return { reveal, dismiss: () => setReveal(null) };
}
