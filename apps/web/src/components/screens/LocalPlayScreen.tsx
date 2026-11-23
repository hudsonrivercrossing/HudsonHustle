import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentPlayer } from "@hudson-hustle/game-core";
import { hudsonHustleCurrentConfigId, hudsonHustleReleasedConfigs, getHudsonHustleMapByConfigId, getHudsonHustleVisualsByConfigId } from "@hudson-hustle/game-data";
import { TurnPanel, type TurnPanelState } from "../ui/game";
import { GuidebookScreen } from "./GuidebookScreen";
import { HandoffModal, isBotTurn, useLocalGame } from "../local";
import { SetupScreen } from "./SetupScreen";
import { GameplayScreen } from "./gameplay/GameplayScreen";
import { useGameNotifications } from "./gameplay/useGameNotifications";

interface LocalPlayScreenProps {
  onReturnToGateway?: () => void;
}

/** Pass-and-play: chooses between setup and the table, and hands the table what the local session holds. */
export function LocalPlayScreen({ onReturnToGateway }: LocalPlayScreenProps): JSX.Element {
  const [guideOpen, setGuideOpen] = useState(false);
  // The notifier needs the game and the game reports its problems through the notifier,
  // so a problem is held here for one render and announced by the effect below.
  const [problem, setProblem] = useState<{ message: string; id: number } | null>(null);
  const reportProblem = useCallback((message: string) => setProblem((current) => ({ message, id: (current?.id ?? 0) + 1 })), []);
  const local = useLocalGame({ onProblem: reportProblem });
  const { session } = local;
  const configId = session?.configId ?? hudsonHustleCurrentConfigId;
  const localMap = useMemo(() => getHudsonHustleMapByConfigId(configId), [configId]);
  const localVisuals = useMemo(() => getHudsonHustleVisualsByConfigId(configId), [configId]);
  const { notifications, notify } = useGameNotifications(session?.game ?? null, localMap);
  useEffect(() => {
    if (problem) {
      notify(problem.message, "warning");
    }
  }, [notify, problem]);

  if (guideOpen) {
    return <GuidebookScreen onBack={() => setGuideOpen(false)} />;
  }

  if (!session) {
    return (
      <SetupScreen
        onStart={local.start}
        canResume={local.hasSavedGame}
        onResume={local.resume}
        onOpenGuide={() => setGuideOpen(true)}
        onBack={onReturnToGateway}
        releasedConfigs={hudsonHustleReleasedConfigs}
        initialConfigId={configId}
      />
    );
  }

  const { game, visibility } = session;
  const isCurrentPlayerLocalBot = isBotTurn(session);
  const activePlayer = getCurrentPlayer(game);
  const turnFinished = game.turn.stage === "awaitingHandoff";
  const nextPlayer = game.players[(game.activePlayerIndex + 1) % game.players.length];
  const turnPanelState: TurnPanelState = isCurrentPlayerLocalBot
    ? { kind: "waiting", activePlayerName: activePlayer.name }
    : activePlayer.pendingTickets.length > 0
      ? { kind: "tickets", minimumKeep: game.phase === "initialTickets" ? 2 : 1 }
      : turnFinished
        ? { kind: "finished", summary: game.turn.summary, nextPlayerName: nextPlayer.name, onPass: local.pass }
        : game.turn.stage === "drawing"
          ? { kind: "drawing" }
          : { kind: "idle" };

  return (
    <GameplayScreen
      key={local.gameNumber}
      config={localMap}
      visuals={localVisuals}
      game={game}
      viewerPlayerId={activePlayer.id}
      canAct={visibility === "visible" && !isCurrentPlayerLocalBot && !turnFinished}
      privateInfoHidden={visibility !== "visible"}
      ticketChoiceSuppressed={isCurrentPlayerLocalBot}
      avatarSeed={game.players.map((player) => player.id).join("|")}
      turnLabel={`${activePlayer.name}'s turn`}
      timerLabel={local.secondsRemaining === null ? null : `${local.secondsRemaining}s left`}
      announceTurn={game.players.length - session.botPlayerIds.length === 1}
      sidePanel={visibility === "visible" && game.phase !== "gameOver" ? <TurnPanel state={turnPanelState} /> : <div />}
      notifications={notifications}
      error={local.error}
      onAction={local.act}
      copy={{
        initialTicketsTitle: `${activePlayer.name}, choose starting tickets`,
        drawnTicketsTitle: `${activePlayer.name}, keep new tickets`,
        leaveLabel: "Leave game",
        leaveBody: "You will return to setup and the saved game will be deleted."
      }}
      onPlayAgain={local.rematch}
      onLeave={local.leave}
      leaveOfferedAtGameOver
    >
      {visibility === "handoff" && game.phase !== "gameOver" ? (
        <HandoffModal playerName={activePlayer.name} previousTurnSummary={session.previousTurnSummary} onReady={local.ready} />
      ) : null}
    </GameplayScreen>
  );
}
