import { useEffect, useMemo, useRef, useState } from "react";
import { fromPlayerView, type RoomSnapshot } from "@hudson-hustle/game-core";
import { getHudsonHustleMapByConfigId, getHudsonHustleVisualsByConfigId } from "@hudson-hustle/game-data";
import { ChatPanel, type GameplayNotification } from "../ui/game";
import type { OnlineRoom } from "../online/useOnlineRoom";
import { GameplayScreen } from "./gameplay/GameplayScreen";
import { useGameNotifications } from "./gameplay/useGameNotifications";

const TIMER_WARNING_SECONDS = 10;

interface OnlineGameScreenProps {
  room: OnlineRoom;
  snapshot: RoomSnapshot & { game: NonNullable<RoomSnapshot["game"]> };
  playerId: string;
  /** One-off messages raised by the room connection (refused moves, restarts). */
  notices: GameplayNotification[];
  onLeave: () => void;
}

/** An online seat: shows this player's view of the room's game and sends their moves to the server. */
export function OnlineGameScreen({ room, snapshot, playerId, notices, onLeave }: OnlineGameScreenProps): JSX.Element {
  const { configId, roomCode, turnTimeLimitSeconds } = snapshot.room;
  const config = useMemo(() => getHudsonHustleMapByConfigId(configId), [configId]);
  const visuals = useMemo(() => getHudsonHustleVisualsByConfigId(configId), [configId]);
  const game = useMemo(() => fromPlayerView(snapshot.game, snapshot.privateState), [snapshot.game, snapshot.privateState]);
  const { notifications, notify } = useGameNotifications(game, config);

  const { timer } = room;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer?.deadlineAt) {
      return;
    }
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer?.deadlineAt]);

  const secondsRemaining = timer?.deadlineAt ? Math.max(0, Math.ceil((timer.deadlineAt - now) / 1000)) : timer?.secondsRemaining ?? null;

  // Warn once per deadline when the viewer's own clock is nearly out.
  const warnedDeadlineRef = useRef<number | null>(null);
  const ownTimer = timer?.activeSeatId === room.credentials?.seatId;
  useEffect(() => {
    const deadline = timer?.deadlineAt ?? null;
    if (!ownTimer || deadline === null || secondsRemaining === null || secondsRemaining > TIMER_WARNING_SECONDS) {
      return;
    }
    if (warnedDeadlineRef.current !== deadline) {
      warnedDeadlineRef.current = deadline;
      notify(`${TIMER_WARNING_SECONDS} seconds left.`, "warning");
    }
  }, [notify, ownTimer, secondsRemaining, timer?.deadlineAt]);

  const activePlayer = snapshot.game.players[snapshot.game.activePlayerIndex];
  // A dropped connection is said out loud and moves are held back, instead of being sent into nothing.
  const offline = room.realtimeStatus !== "subscribed";
  const canAct = !offline && activePlayer?.id === playerId;
  const activePlayerName = activePlayer?.name ?? "the next player";

  return (
    <GameplayScreen
      key={room.gameNumber}
      config={config}
      visuals={visuals}
      game={game}
      viewerPlayerId={playerId}
      canAct={canAct}
      avatarSeed={roomCode}
      turnLabel={activePlayer?.id === playerId ? "Your turn" : `Waiting for ${activePlayerName}`}
      timerLabel={secondsRemaining !== null ? `${secondsRemaining}s left` : turnTimeLimitSeconds > 0 ? `Timer ${turnTimeLimitSeconds}s` : null}
      sidePanel={<ChatPanel messages={room.chatMessages} onSendMessage={room.sendChatMessage} />}
      notifications={[...notifications, ...notices]}
      connectionNotice={offline ? "Connection lost. Reconnecting…" : null}
      onAction={room.sendGameAction}
      copy={{
        initialTicketsTitle: "Choose starting tickets",
        drawnTicketsTitle: "Keep new tickets",
        leaveLabel: "Leave room",
        leaveBody: "You will return to setup and clear this room from the current browser."
      }}
      onPlayAgain={() => void room.restartRoom()}
      onLeave={onLeave}
      leaveOfferedAtGameOver
    />
  );
}
