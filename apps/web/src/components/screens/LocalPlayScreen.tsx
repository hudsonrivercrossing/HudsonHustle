import { useEffect, useMemo, useState } from "react";
import {
  getCurrentPlayer,
  reduceGame,
  runBotTurns,
  startGame,
  type BotDifficulty,
  type GameAction,
  type GameState
} from "@hudson-hustle/game-core";
import {
  hudsonHustleCurrentConfigId,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId,
  getHudsonHustleVisualsByConfigId
} from "@hudson-hustle/game-data";
import { TurnPanel, type TurnPanelState } from "../ui/game";
import { GuidebookScreen } from "./GuidebookScreen";
import {
  HandoffModal,
  botPlayerIdsFromSavedGame,
  botPlayerIdsFromSeatIds,
  configIdForSavedMap,
  LOCAL_SAVE_KEY,
  readLocalSaveMeta,
  readSavedGame,
  saveLocalSaveMeta,
  type LocalStartSetup,
  type VisibilityMode
} from "../local";
import { SetupScreen } from "./SetupScreen";
import { GameplayScreen } from "./gameplay/GameplayScreen";
import { useGameNotifications } from "./gameplay/useGameNotifications";

const BOT_TURN_DELAY_MS = 350;

interface LocalPlayScreenProps {
  onReturnToGateway?: () => void;
}

/** Pass-and-play: owns the full game state, the handoff between players, local bots and the save. */
export function LocalPlayScreen({ onReturnToGateway }: LocalPlayScreenProps): JSX.Element {
  const [game, setGame] = useState<GameState | null>(null);
  const [gameNumber, setGameNumber] = useState(0);
  const [visibility, setVisibility] = useState<VisibilityMode>("visible");
  const [previousTurnSummary, setPreviousTurnSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => typeof window !== "undefined" && Boolean(readSavedGame()));
  const [localConfigId, setLocalConfigId] = useState(hudsonHustleCurrentConfigId);
  const [localTurnTimeLimitSeconds, setLocalTurnTimeLimitSeconds] = useState(0);
  const [localBotPlayerIds, setLocalBotPlayerIds] = useState<string[]>([]);
  const [localBotDifficulty, setLocalBotDifficulty] = useState<BotDifficulty>("standard");
  const [turnStartedAt, setTurnStartedAt] = useState<number>(() => Date.now());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const localMap = useMemo(() => getHudsonHustleMapByConfigId(localConfigId), [localConfigId]);
  const localVisuals = useMemo(() => getHudsonHustleVisualsByConfigId(localConfigId), [localConfigId]);
  const { notifications, notify } = useGameNotifications(game, localMap);

  useEffect(() => {
    if (!game) return;
    window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(game));
    setHasSavedGame(true);
  }, [game]);

  // Reset turn timer when active player changes
  useEffect(() => {
    setTurnStartedAt(Date.now());
  }, [game?.activePlayerIndex, game?.phase]);

  // Tick once per second to drive timer display
  useEffect(() => {
    if (!game || localTurnTimeLimitSeconds <= 0) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [game, localTurnTimeLimitSeconds]);

  const liveTimerSecondsRemaining = localTurnTimeLimitSeconds > 0
    ? Math.max(0, Math.ceil(localTurnTimeLimitSeconds - (nowMs - turnStartedAt) / 1000))
    : null;

  const currentPlayer = game ? getCurrentPlayer(game) : null;
  const isCurrentPlayerLocalBot = currentPlayer ? localBotPlayerIds.includes(currentPlayer.id) : false;

  // Let bots play, after a short pause so the table can follow what happened.
  useEffect(() => {
    if (!game || game.phase === "gameOver" || !isCurrentPlayerLocalBot) return;

    const timeout = window.setTimeout(() => {
      try {
        const { state: nextGame } = runBotTurns(
          game,
          localMap,
          (playerId) => localBotPlayerIds.includes(playerId),
          undefined,
          () => localBotDifficulty
        );
        setGame(nextGame);
        setPreviousTurnSummary(`${getCurrentPlayer(game).name} (bot) played.`);
        setError(null);
        setVisibility(nextGame.phase === "gameOver" ? "visible" : "handoff");
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Local bot could not complete its turn.";
        setError(message);
        notify(message, "warning");
        setVisibility("visible");
      }
    }, BOT_TURN_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [game, isCurrentPlayerLocalBot, localBotDifficulty, localBotPlayerIds, localMap, notify]);

  function beginGame(nextGame: GameState, nextVisibility: VisibilityMode) {
    setGame(nextGame);
    setGameNumber((current) => current + 1);
    setVisibility(nextVisibility);
    setPreviousTurnSummary(null);
    setError(null);
  }

  function startNewGame(setup: LocalStartSetup) {
    setLocalConfigId(setup.configId);
    setLocalTurnTimeLimitSeconds(setup.turnTimeLimitSeconds);
    const botPlayerIds = botPlayerIdsFromSeatIds(setup.botSeatIds);
    setLocalBotPlayerIds(botPlayerIds);
    setLocalBotDifficulty(setup.botDifficulty);
    saveLocalSaveMeta({
      configId: setup.configId,
      botPlayerIds,
      botDifficulty: setup.botDifficulty,
      turnTimeLimitSeconds: setup.turnTimeLimitSeconds
    });
    beginGame(startGame(getHudsonHustleMapByConfigId(setup.configId), { playerNames: setup.playerNames }), "visible");
  }

  function resumeGame() {
    const saved = readSavedGame();
    if (!saved) return;
    // Saves made before the meta record existed fall back to guessing from the map and the names.
    const meta = readLocalSaveMeta();
    setLocalConfigId(meta?.configId ?? configIdForSavedMap(saved.mapId));
    setLocalBotPlayerIds(meta?.botPlayerIds ?? botPlayerIdsFromSavedGame(saved));
    setLocalBotDifficulty(meta?.botDifficulty ?? "standard");
    setLocalTurnTimeLimitSeconds(meta?.turnTimeLimitSeconds ?? 0);
    // Whoever reopens the laptop may not be the player whose hand was last on screen.
    beginGame(saved, saved.phase === "gameOver" ? "visible" : "handoff");
  }

  /** A new game for the same table: same players, bots, map and timer, with no trip through setup. */
  function rematch() {
    if (!game) return;
    saveLocalSaveMeta({
      configId: localConfigId,
      botPlayerIds: localBotPlayerIds,
      botDifficulty: localBotDifficulty,
      turnTimeLimitSeconds: localTurnTimeLimitSeconds
    });
    beginGame(startGame(localMap, { playerNames: game.players.map((player) => player.name) }), "visible");
  }

  function resetGame() {
    window.localStorage.removeItem(LOCAL_SAVE_KEY);
    saveLocalSaveMeta(null);
    setHasSavedGame(false);
    setGame(null);
    setLocalBotPlayerIds([]);
    setVisibility("visible");
    setError(null);
  }

  function applyAction(action: GameAction) {
    if (!game) return;
    try {
      const nextGame = reduceGame(game, action, localMap);
      setGame(nextGame);
      setError(null);

      if (nextGame.phase === "gameOver") {
        setVisibility("visible");
      } else if (action.type === "select_initial_tickets") {
        // The next player's starting tickets are now on screen.
        setPreviousTurnSummary(null);
        setVisibility("handoff");
      }
      // After any other action the same player stays in front of the screen: they see
      // what they drew or built, then end the turn themselves.
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      notify(message, "warning");
    }
  }

  /** Ends the finished turn and covers private info for the handover. */
  function passLaptop() {
    if (!game) return;
    const summary = game.turn.summary;
    const nextGame = reduceGame(game, { type: "advance_turn" }, localMap);
    setGame(nextGame);
    setPreviousTurnSummary(summary);
    setVisibility(nextGame.phase === "gameOver" ? "visible" : "handoff");
  }

  if (guideOpen) {
    return <GuidebookScreen onBack={() => setGuideOpen(false)} />;
  }

  if (!game) {
    return (
      <SetupScreen
        onStart={startNewGame}
        canResume={hasSavedGame}
        onResume={resumeGame}
        onOpenGuide={() => setGuideOpen(true)}
        onBack={onReturnToGateway}
        releasedConfigs={hudsonHustleReleasedConfigs}
        initialConfigId={localConfigId}
      />
    );
  }

  const activePlayer = getCurrentPlayer(game);
  const turnFinished = game.turn.stage === "awaitingHandoff";
  const nextPlayer = game.players[(game.activePlayerIndex + 1) % game.players.length];
  const turnPanelState: TurnPanelState = isCurrentPlayerLocalBot
    ? { kind: "waiting", activePlayerName: activePlayer.name }
    : activePlayer.pendingTickets.length > 0
      ? { kind: "tickets", minimumKeep: game.phase === "initialTickets" ? 2 : 1 }
      : turnFinished
        ? { kind: "finished", summary: game.turn.summary, nextPlayerName: nextPlayer.name, onPass: passLaptop }
        : game.turn.stage === "drawing"
          ? { kind: "drawing" }
          : { kind: "idle" };

  return (
    <GameplayScreen
      key={gameNumber}
      config={localMap}
      visuals={localVisuals}
      game={game}
      viewerPlayerId={activePlayer.id}
      canAct={visibility === "visible" && !isCurrentPlayerLocalBot && !turnFinished}
      privateInfoHidden={visibility !== "visible"}
      ticketChoiceSuppressed={isCurrentPlayerLocalBot}
      avatarSeed={game.players.map((player) => player.id).join("|")}
      turnLabel={`${activePlayer.name}'s turn`}
      timerLabel={liveTimerSecondsRemaining === null ? null : `${liveTimerSecondsRemaining}s left`}
      announceTurn={game.players.length - localBotPlayerIds.length === 1}
      sidePanel={visibility === "visible" && game.phase !== "gameOver" ? <TurnPanel playerName={activePlayer.name} state={turnPanelState} /> : <div />}
      notifications={notifications}
      error={error}
      onAction={applyAction}
      copy={{
        initialTicketsTitle: `${activePlayer.name}, choose starting tickets`,
        drawnTicketsTitle: `${activePlayer.name}, keep new tickets`,
        leaveLabel: "Leave game",
        leaveBody: "Your local match will return to setup."
      }}
      onPlayAgain={rematch}
      onLeave={resetGame}
      leaveOfferedAtGameOver
    >
      {visibility === "handoff" && game.phase !== "gameOver" ? (
        <HandoffModal playerName={activePlayer.name} previousTurnSummary={previousTurnSummary} onReady={() => setVisibility("visible")} />
      ) : null}
    </GameplayScreen>
  );
}
