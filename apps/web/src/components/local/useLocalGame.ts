import { useCallback, useEffect, useState } from "react";
import type { GameAction } from "@hudson-hustle/game-core";
import type { LocalStartSetup } from "./localGame.utils";
import {
  actInSession,
  clearSavedSession,
  isBotTurn,
  passLaptop,
  playBotTurns,
  readSavedSession,
  rematchSession,
  saveSession,
  showHand,
  startSession,
  type LocalSession
} from "./localSession";

const BOT_TURN_DELAY_MS = 350;

interface UseLocalGameOptions {
  /** Told when an action is refused or a bot cannot move, so the table can say so. */
  onProblem: (message: string) => void;
}

/**
 * The pass-and-play game as the screen sees it: the current session, and the things a table can do
 * to it. Saving, bot turns and the turn clock happen in here.
 */
export function useLocalGame({ onProblem }: UseLocalGameOptions) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [gameNumber, setGameNumber] = useState(0);
  const [hasSavedGame, setHasSavedGame] = useState(() => typeof window !== "undefined" && readSavedSession() !== null);
  const [turnStartedAt, setTurnStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const begin = useCallback((next: LocalSession) => {
    setSession(next);
    setGameNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    if (session) {
      saveSession(session);
      setHasSavedGame(true);
    }
  }, [session]);

  // The clock restarts whenever the turn passes to someone else.
  const activePlayerIndex = session?.game.activePlayerIndex;
  const phase = session?.game.phase;
  useEffect(() => {
    setTurnStartedAt(Date.now());
    setNow(Date.now());
  }, [activePlayerIndex, phase]);

  const timeLimit = session?.turnTimeLimitSeconds ?? 0;
  useEffect(() => {
    if (timeLimit <= 0) {
      return;
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timeLimit]);

  // Bots play after a short pause, so the table can follow what happened.
  useEffect(() => {
    if (!session || !isBotTurn(session)) {
      return;
    }
    const timeout = window.setTimeout(() => {
      try {
        setSession(playBotTurns(session));
          } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Local bot could not complete its turn.";
        onProblem(message);
        setSession(showHand(session));
      }
    }, BOT_TURN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [onProblem, session]);

  return {
    session,
    /** Changes with every new game, so per-game screen state can reset. */
    gameNumber,
    hasSavedGame,
    secondsRemaining: timeLimit > 0 ? Math.max(0, Math.ceil(timeLimit - (now - turnStartedAt) / 1000)) : null,
    start: (setup: LocalStartSetup) => begin(startSession(setup)),
    resume: () => {
      const saved = readSavedSession();
      if (saved) {
        begin(saved);
      } else {
        setHasSavedGame(false);
      }
    },
    rematch: () => {
      if (session) {
        begin(rematchSession(session));
      }
    },
    leave: () => {
      clearSavedSession();
      setHasSavedGame(false);
      setSession(null);
      },
    act: (action: GameAction) => {
      if (!session) {
        return;
      }
      try {
        setSession(actInSession(session, action));
          } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Something went wrong.";
        onProblem(message);
      }
    },
    pass: () => {
      if (session) {
        setSession(passLaptop(session));
      }
    },
    ready: () => {
      if (session) {
        setSession(showHand(session));
      }
    }
  };
}
