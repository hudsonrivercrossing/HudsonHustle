import { useCallback, useEffect, useRef, useState } from "react";
import { getEventsSince, type GameState, type MapConfig } from "@hudson-hustle/game-core";
import type { GameplayNotification } from "../../ui/game";
import { notificationsFromEvents, type PendingDraws } from "./gameNotifications";

const NOTIFICATION_LIFETIME_MS = 4000;

/**
 * Shows a notification for each new game event and exposes `notify` for one-off messages.
 * Events already present when a game is first seen (a resumed save, a reconnect) are not replayed.
 */
export function useGameNotifications(game: GameState | null, config: MapConfig | null) {
  const [notifications, setNotifications] = useState<GameplayNotification[]>([]);
  const nextIdRef = useRef(0);
  const lastSeenSeqRef = useRef<number | null>(null);
  const pendingDrawsRef = useRef<PendingDraws | null>(null);
  const timeoutsRef = useRef(new Set<number>());

  const notify = useCallback((message: string, tone: GameplayNotification["tone"] = "neutral") => {
    nextIdRef.current += 1;
    const id = `notification-${nextIdRef.current}`;
    setNotifications((current) => [...current, { id, message, tone }]);
    const timeout = window.setTimeout(() => {
      timeoutsRef.current.delete(timeout);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, NOTIFICATION_LIFETIME_MS);
    timeoutsRef.current.add(timeout);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const latestSeq = game ? game.events?.at(-1)?.seq ?? 0 : null;

  useEffect(() => {
    if (!game || !config || latestSeq === null) {
      lastSeenSeqRef.current = null;
      pendingDrawsRef.current = null;
      return;
    }
    const lastSeen = lastSeenSeqRef.current;
    // First sight of a game, or a new game whose numbering started over.
    if (lastSeen === null || latestSeq < lastSeen) {
      lastSeenSeqRef.current = latestSeq;
      pendingDrawsRef.current = null;
      return;
    }
    if (latestSeq === lastSeen) {
      return;
    }
    const result = notificationsFromEvents(getEventsSince(game, lastSeen), { players: game.players, config }, pendingDrawsRef.current);
    pendingDrawsRef.current = result.pendingDraws;
    lastSeenSeqRef.current = latestSeq;
    result.messages.forEach((entry) => notify(entry.message, entry.tone));
  }, [config, game, latestSeq, notify]);

  return { notifications, notify };
}
