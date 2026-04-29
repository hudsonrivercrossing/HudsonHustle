import { useEffect, useMemo, useRef, useState } from "react";
import {
  chooseBotAction,
  getAffordableRouteColors,
  getAffordableStationColors,
  getCityName,
  getCurrentPlayer,
  getTicketProgress,
  reduceGame,
  startGame,
  type GameAction,
  type GameState,
  type PublicGameState,
  type SeatPrivateState,
  type TicketDef,
  type TrainCardColor
} from "@hudson-hustle/game-core";
import {
  cardColorPalette,
  hudsonHustleCurrentConfigId,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId,
  getHudsonHustleVisualsByConfigId,
  playerColorPalette
} from "@hudson-hustle/game-data";
import { BoardMap } from "./BoardMap";
import { EndgameBreakdown } from "./EndgameBreakdown";
import {
  BoardStage,
  GameOverLayer,
  InspectorDock,
  NotificationPipe,
  PlayerRoster,
  PrivateHandRail,
  SupplyDock,
  TicketChoiceSheet,
  TicketDock,
  formatCardLabel,
  type GameplayNotification
} from "./GameplayHud";
import { OnboardingTutorial, type TutorialStep } from "./OnboardingTutorial";
import { ScoreGuide } from "./ScoreGuide";
import { SetupScreen } from "./SetupScreen";
import { TransitCard } from "./TransitCard";
import { Button } from "./system/Button";
import { ChoiceChipButton } from "./system/ChoiceChipButton";
import { ModalShell } from "./system/ModalShell";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { SurfaceCard } from "./system/SurfaceCard";

const saveKey = "hudson-hustle-save-v1";
const tutorialSeenKey = "hudson-hustle-onboarding-v1-1";

type VisibilityMode = "visible" | "postTurn" | "handoff";
type LocalStartSetup = { playerNames: string[]; botSeatIds: string[]; configId: string; turnTimeLimitSeconds: number };

interface LocalPlayScreenProps {
  onReturnToGateway?: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "setup",
    title: "Set up your first table",
    summary:
      "Start with two to four players, enter names, and begin a local pass-and-play match. Before the first real turn, each player privately reviews starting tickets and keeps at least two.",
    keyPoints: [
      "The game is built for one shared laptop in v1.",
      "Each player starts with transit cards plus a private ticket choice.",
      "Short player names make the handoff screens easier to read."
    ],
    tip: "Use short names for your first game so the handoff screen is easy to scan.",
    target: "setup"
  },
  {
    id: "board",
    title: "Read the public board first",
    summary:
      "The board is the shared public surface. Everyone can always see claimed routes, stations, choke points, and the overall shape of the map.",
    keyPoints: [
      "The board tells you where the scarce crossings are.",
      "Clicking a route or city opens the related action details.",
      "You should usually read the board before looking at your hand."
    ],
    tip: "Try clicking a short route first so you can see how the action rail responds.",
    target: "board"
  },
  {
    id: "hand",
    title: "Your hand and tickets stay private",
    summary:
      "Your transit cards are the resources you spend. Your tickets are your hidden goals. Only the active player should see these panels during local play.",
    keyPoints: [
      "Cards let you claim routes on the board.",
      "Tickets tell you which places you are trying to connect.",
      "The ticket panel doubles as a live checklist, showing Pending versus Connected."
    ],
    tip: "Think of the hand as your resources and the ticket panel as your secret map plan.",
    target: "hand"
  },
  {
    id: "market",
    title: "Build resources from the market",
    summary:
      "Most turns let you draw two transit cards. You can take face-up cards from the market or draw blind from the deck.",
    keyPoints: [
      "Face-up locomotives are powerful, so taking one ends that draw action immediately.",
      "The deck is better when you want flexibility.",
      "The market is better when you need a specific color soon."
    ],
    tip: "Use the market when you need a specific color and the deck when you need flexibility.",
    target: "market"
  },
  {
    id: "route-types",
    title: "Route types change how you pay",
    summary:
      "Not every route is just a normal color match. Some routes add risk or reserve locomotives before you can claim them.",
    keyPoints: [
      "Normal routes only care about length and color.",
      "Tunnels can cost extra after the reveal, so claiming them with the exact minimum is risky.",
      "Ferries require locomotives as part of the payment, not as an optional bonus."
    ],
    tip: "Before committing to a tunnel or ferry, check whether your hand can survive the special rule, not just the printed length.",
    target: "action"
  },
  {
    id: "stations",
    title: "Stations are endgame rescue tools",
    summary:
      "A station does not help you claim routes right now. It matters later, when the game checks whether your tickets connect at the end.",
    keyPoints: [
      "Your first station is cheap and your third is expensive.",
      "Each station can borrow only one adjacent rival route for ticket scoring.",
      "Unused stations are worth points, so building one is a tradeoff, not an automatic upgrade."
    ],
    tip: "Use a station when it saves a big ticket or bypasses a critical blockage, not just because you can afford it.",
    target: "action"
  },
  {
    id: "action",
    title: "Commit through the action rail",
    summary:
      "The action rail is where your choice becomes a committed move. It explains what the selected route or city means and shows legal payments.",
    keyPoints: [
      "On your turn, choose one major action: draw cards, claim a route, draw tickets, or build a station.",
      "Gray routes still require cards of one color set.",
      "This is where tunnel risk, ferry locomotive requirements, and station payment colors become concrete."
    ],
    tip: "If a route or city is selected and you can afford it, the action rail will show the payment choices.",
    target: "action"
  },
  {
    id: "scoreboard",
    title: "Track endgame pressure",
    summary:
      "The player roster shows trains left, stations left, ticket counts, and whose turn is active. This is where you feel late-game pressure without exposing private hands.",
    keyPoints: [
      "The final round starts when a player ends a turn with two or fewer trains left, or when no route remains open.",
      "Unused stations are worth points, so building one is a tradeoff.",
      "Ticket counts can hint at who is still chasing risky plans."
    ],
    tip: "Before drawing more tickets, glance at train counts and open routes so you do not overcommit late.",
    target: "scoreboard"
  },
  {
    id: "handoff",
    title: "Pass-and-play stays lightweight",
    summary:
      "When a turn ends, the app hides private information before the next player takes over. This keeps same-laptop play clean and social without extra friction.",
    keyPoints: [
      "Click `I'm done` when your turn is fully complete.",
      "The screen switches to a neutral takeover state with no private cards or tickets visible.",
      "The next player clicks `I'm ready` to reveal only their own information."
    ],
    tip: "Treat the handoff overlay as part of the social rhythm of the game, not an interruption.",
    target: "handoff"
  }
];

function formatFaceLabel(face: string): string {
  return face
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readSavedGame(): GameState | null {
  const raw = window.localStorage.getItem(saveKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function configIdForSavedMap(mapId: string): string {
  return hudsonHustleReleasedConfigs.find((config) => getHudsonHustleMapByConfigId(config.configId).id === mapId)?.configId ?? hudsonHustleCurrentConfigId;
}

function buildLocalPublicGameState(game: GameState): PublicGameState {
  return {
    version: game.version,
    mapId: game.mapId,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      trainsLeft: player.trainsLeft,
      stationsLeft: player.stationsLeft,
      handCount: player.hand.length,
      ticketCount: player.tickets.length,
      pendingTicketCount: player.pendingTickets.length,
      endgame: player.endgame
    })),
    activePlayerIndex: game.activePlayerIndex,
    phase: game.phase,
    routeClaims: game.routeClaims,
    stations: game.stations,
    market: game.market,
    discardCount: game.discardPile.length,
    trainDeckCount: game.trainDeck.length,
    regularTicketsCount: game.regularTickets.length,
    longTicketsCount: game.longTickets.length,
    discardedTicketsCount: game.discardedTickets.length,
    turn: game.turn,
    finalRoundRemaining: game.finalRoundRemaining,
    finalRoundTriggeredBy: game.finalRoundTriggeredBy,
    log: game.log
  };
}

function buildLocalPrivateState(game: GameState): SeatPrivateState {
  const player = getCurrentPlayer(game);
  return {
    seatId: `seat-${game.activePlayerIndex + 1}`,
    playerId: player.id,
    hand: player.hand,
    tickets: player.tickets,
    pendingTickets: player.pendingTickets
  };
}

function botPlayerIdsFromSeatIds(botSeatIds: string[]): string[] {
  return botSeatIds.map((seatId) => `player-${seatId.replace("seat-", "")}`);
}

function botPlayerIdsFromSavedGame(game: GameState): string[] {
  return game.players.filter((player) => /^Bot\s+\d+/i.test(player.name)).map((player) => player.id);
}

export function LocalPlayScreen({ onReturnToGateway }: LocalPlayScreenProps): JSX.Element {
  const [game, setGame] = useState<GameState | null>(null);
  const [visibility, setVisibility] = useState<VisibilityMode>("visible");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [focusedTicket, setFocusedTicket] = useState<TicketDef | null>(null);
  const [pinnedTicket, setPinnedTicket] = useState<TicketDef | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<{ color: TrainCardColor; totalCost: number; minimumLocomotives?: number } | null>(null);
  const [revealedDeckCard, setRevealedDeckCard] = useState<keyof typeof cardColorPalette | null>(null);
  const [, setError] = useState<string | null>(null);
  const [tutorialStepIndex, setTutorialStepIndex] = useState<number | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => typeof window !== "undefined" && Boolean(readSavedGame()));
  const [localConfigId, setLocalConfigId] = useState(hudsonHustleCurrentConfigId);
  const [localTurnTimeLimitSeconds, setLocalTurnTimeLimitSeconds] = useState(0);
  const [localBotPlayerIds, setLocalBotPlayerIds] = useState<string[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notifications, setNotifications] = useState<GameplayNotification[]>([]);
  const notificationIdRef = useRef(0);
  const localMap = useMemo(() => getHudsonHustleMapByConfigId(localConfigId), [localConfigId]);
  const localVisuals = useMemo(() => getHudsonHustleVisualsByConfigId(localConfigId), [localConfigId]);

  useEffect(() => {
    const seenTutorial = window.localStorage.getItem(tutorialSeenKey);
    if (!seenTutorial) {
      setTutorialStepIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!game) {
      return;
    }
    window.localStorage.setItem(saveKey, JSON.stringify(game));
    setHasSavedGame(true);
  }, [game]);

  function pushNotification(message: string, tone: GameplayNotification["tone"] = "neutral") {
    notificationIdRef.current += 1;
    const id = `local-${Date.now()}-${notificationIdRef.current}`;
    setNotifications((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, 4200);
  }

  function announceGameChange(previous: GameState, nextGame: GameState) {
    const nextLog = nextGame.log.at(-1);

    if (nextGame.phase === "gameOver" && previous.phase !== "gameOver") {
      pushNotification("Final scores are in.", "success");
      return;
    }

    if (nextGame.finalRoundTriggeredBy && previous.finalRoundTriggeredBy !== nextGame.finalRoundTriggeredBy) {
      const triggerPlayer = nextGame.players.find((player) => player.id === nextGame.finalRoundTriggeredBy);
      pushNotification(`${triggerPlayer?.name ?? "A player"} triggered the final round.`, "warning");
      return;
    }

    if (nextLog && nextGame.log.length > previous.log.length && nextLog !== "Game setup complete.") {
      pushNotification(nextLog);
    }
  }

  const currentPlayer = game ? getCurrentPlayer(game) : null;
  const isCurrentPlayerLocalBot = currentPlayer ? localBotPlayerIds.includes(currentPlayer.id) : false;
  const pendingTickets = currentPlayer?.pendingTickets ?? [];
  const pendingTicketIds = useMemo(() => pendingTickets.map((ticket) => ticket.id).join("|"), [pendingTickets]);

  useEffect(() => {
    if (!game || pendingTickets.length === 0) {
      setSelectedTicketIds([]);
      return;
    }

    const minimumKeep = game.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pendingTickets.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [game?.phase, pendingTicketIds]);

  useEffect(() => {
    if (!game || game.phase === "gameOver" || localBotPlayerIds.length === 0) {
      return;
    }

    const activePlayer = getCurrentPlayer(game);
    if (!localBotPlayerIds.includes(activePlayer.id)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        if (!current || current.phase === "gameOver") {
          return current;
        }

        try {
          let nextGame = current;
          for (let steps = 0; steps < 8; steps += 1) {
            const nextActivePlayer = getCurrentPlayer(nextGame);
            if (!localBotPlayerIds.includes(nextActivePlayer.id) || nextGame.phase === "gameOver") {
              break;
            }

            const action = chooseBotAction({
              config: localMap,
              game: buildLocalPublicGameState(nextGame),
              privateState: buildLocalPrivateState(nextGame)
            });
            nextGame = reduceGame(nextGame, action, localMap);
            if (nextGame.turn.stage === "awaitingHandoff") {
              nextGame = reduceGame(nextGame, { type: "advance_turn" }, localMap);
            }
          }

          announceGameChange(current, nextGame);
          setSelectedRouteId(null);
          setSelectedCityId(null);
          setFocusedTicket(null);
          setPinnedTicket(null);
          setPaymentPreview(null);
          setRevealedDeckCard(null);
          setError(null);
          setVisibility(nextGame.phase === "gameOver" ? "visible" : "handoff");
          return nextGame;
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Local bot could not complete its turn.";
          setError(message);
          pushNotification(message, "warning");
          setVisibility("visible");
          return current;
        }
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [game, localBotPlayerIds, localMap]);

  const routeOptions = useMemo(() => {
    if (!game || !selectedRouteId) {
      return [];
    }
    return getAffordableRouteColors(game, localMap, selectedRouteId);
  }, [game, localMap, selectedRouteId]);

  const stationOptions = useMemo(() => {
    if (!game || !selectedCityId) {
      return [];
    }
    return getAffordableStationColors(game, localMap);
  }, [game, localMap, selectedCityId]);

  const ticketProgress = useMemo(() => {
    if (!game || !currentPlayer) {
      return [];
    }

    return getTicketProgress(game, localMap, currentPlayer.id).sort(
      (left, right) => Number(left.completed) - Number(right.completed)
    );
  }, [currentPlayer, game, localMap]);

  const currentRouteUnavailableReason = useMemo(() => {
    if (!game || !selectedRouteId) {
      return null;
    }

    const currentRoute = localMap.routes.find((route) => route.id === selectedRouteId);
    if (!currentRoute) {
      return null;
    }

    const currentRouteClaim = game.routeClaims.find((claim) => claim.routeId === currentRoute.id);
    const currentRouteOwner = currentRouteClaim ? game.players.find((player) => player.id === currentRouteClaim.playerId) : null;

    if (game.turn.stage !== "idle") {
      return "Finish the current draw before claiming a route.";
    }

    if (currentRouteClaim && currentRouteOwner) {
      return `This route is already claimed by ${currentRouteOwner.name}.`;
    }

    if (currentRoute.twinGroup && game.players.length <= 3) {
      const twinIds = localMap.routes
        .filter((route) => route.twinGroup === currentRoute.twinGroup && route.id !== currentRoute.id)
        .map((route) => route.id);
      const twinClaim = game.routeClaims.find((claim) => twinIds.includes(claim.routeId));
      if (twinClaim) {
        const twinOwner = game.players.find((player) => player.id === twinClaim.playerId);
        return `This parallel route is unavailable in a ${game.players.length}-player game because its twin is already claimed${twinOwner ? ` by ${twinOwner.name}` : ""}.`;
      }
    }

    return "No affordable claim options right now.";
  }, [game, localMap, selectedRouteId]);

  function startNewGame(setup: LocalStartSetup) {
    const nextMap = getHudsonHustleMapByConfigId(setup.configId);
    const nextGame = startGame(nextMap, { playerNames: setup.playerNames });
    setLocalConfigId(setup.configId);
    setLocalTurnTimeLimitSeconds(setup.turnTimeLimitSeconds);
    setLocalBotPlayerIds(botPlayerIdsFromSeatIds(setup.botSeatIds));
    setGame(nextGame);
    setVisibility("visible");
    setSelectedRouteId(null);
    setSelectedCityId(null);
    setFocusedTicket(null);
    setPinnedTicket(null);
    setPaymentPreview(null);
    setNotifications([]);
    setError(null);
  }

  function resumeGame() {
    const saved = readSavedGame();
    if (!saved) {
      return;
    }
    setLocalConfigId(configIdForSavedMap(saved.mapId));
    setLocalBotPlayerIds(botPlayerIdsFromSavedGame(saved));
    setGame(saved);
    setVisibility("visible");
    setSelectedRouteId(null);
    setSelectedCityId(null);
    setFocusedTicket(null);
    setPinnedTicket(null);
    setPaymentPreview(null);
    setNotifications([]);
    setError(null);
  }

  function resetGame() {
    window.localStorage.removeItem(saveKey);
    setHasSavedGame(false);
    setGame(null);
    setLocalBotPlayerIds([]);
    setVisibility("visible");
    setSelectedRouteId(null);
    setSelectedCityId(null);
    setSelectedTicketIds([]);
    setFocusedTicket(null);
    setPinnedTicket(null);
    setPaymentPreview(null);
    setRevealedDeckCard(null);
    setNotifications([]);
    setError(null);
    setShowLeaveConfirm(false);
  }

  function openTutorial() {
    setTutorialStepIndex(0);
  }

  function closeTutorial() {
    window.localStorage.setItem(tutorialSeenKey, "seen");
    setTutorialStepIndex(null);
  }

  function nextTutorialStep() {
    setTutorialStepIndex((current) => {
      if (current === null) {
        return 0;
      }
      return Math.min(current + 1, tutorialSteps.length - 1);
    });
  }

  function previousTutorialStep() {
    setTutorialStepIndex((current) => {
      if (current === null) {
        return 0;
      }
      return Math.max(current - 1, 0);
    });
  }

  function jumpToTutorialStep(index: number) {
    setTutorialStepIndex(index);
  }

  function applyAction(action: GameAction) {
    if (!game) {
      return;
    }

    try {
      const activeBefore = getCurrentPlayer(game);
      const nextGame = reduceGame(game, action, localMap);
      setGame(nextGame);
      setError(null);
      announceGameChange(game, nextGame);

      if (action.type === "draw_card" && action.source === "deck") {
        const activeAfter = nextGame.players[nextGame.activePlayerIndex];
        const knownIds = new Set(activeBefore.hand.map((card) => card.id));
        const drawnCard = activeAfter.hand.find((card) => !knownIds.has(card.id));
        if (drawnCard) {
          setRevealedDeckCard(drawnCard.color);
        }
      }

      if (nextGame.phase === "gameOver") {
        setVisibility("visible");
        return;
      }

      if (action.type === "select_initial_tickets") {
        setVisibility("handoff");
        return;
      }

      if (action.type === "advance_turn") {
        setSelectedRouteId(null);
        setSelectedCityId(null);
        setVisibility("handoff");
        return;
      }

      if (nextGame.turn.stage === "awaitingHandoff") {
        setVisibility("postTurn");
      } else {
        setVisibility("visible");
        setPaymentPreview(null);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      pushNotification(message, "warning");
    }
  }

  const tutorial = tutorialStepIndex !== null ? (
    <OnboardingTutorial
      steps={tutorialSteps}
      stepIndex={tutorialStepIndex}
      onClose={closeTutorial}
      onNext={nextTutorialStep}
      onPrevious={previousTutorialStep}
      onJumpTo={jumpToTutorialStep}
    />
  ) : null;

  if (!game) {
    return (
      <>
        <SetupScreen
          onStart={startNewGame}
          canResume={hasSavedGame}
          onResume={resumeGame}
          onOpenTutorial={openTutorial}
          onBack={onReturnToGateway}
          releasedConfigs={hudsonHustleReleasedConfigs}
          initialConfigId={localConfigId}
        />
        {tutorial}
      </>
    );
  }

  const activePlayer = getCurrentPlayer(game);
  const tutorialTarget = tutorialStepIndex !== null ? tutorialSteps[tutorialStepIndex].target : null;
  const canTakeTurnAction = visibility === "visible" && game.phase === "main" && game.turn.stage === "idle";
  const marketDisabled = visibility !== "visible" || game.phase !== "main" || game.turn.stage === "awaitingHandoff";
  const currentCity = selectedCityId ? localMap.cities.find((city) => city.id === selectedCityId) : null;
  const currentCityOccupied = currentCity ? game.stations.some((station) => station.cityId === currentCity.id) : false;
  const currentRoute = selectedRouteId ? localMap.routes.find((route) => route.id === selectedRouteId) : null;
  const currentRouteClaim = currentRoute ? game.routeClaims.find((claim) => claim.routeId === currentRoute.id) : null;
  const currentRouteOwner = currentRouteClaim ? game.players.find((player) => player.id === currentRouteClaim.playerId) : null;
  const currentStationCost = localMap.settings.stationsPerPlayer - activePlayer.stationsLeft + 1;
  const highlightedTicket = focusedTicket ?? pinnedTicket;
  const highlightedCityIds = highlightedTicket ? [highlightedTicket.from, highlightedTicket.to] : [];

  return (
    <div className="app-shell app-shell--gameplay-hud" data-config-theme={localVisuals.theme}>
      <header className="topbar topbar--gameplay-actions">
        <div className="topbar-private-spacer" aria-hidden="true" />
        <PlayerRoster
          players={game.players}
          activePlayerIndex={game.activePlayerIndex}
          playerPalette={playerColorPalette}
          className={`player-roster--top ${tutorialTarget === "scoreboard" ? "panel--tutorial-focus" : ""}`}
        />
        <div className="topbar-actions">
          <Button onClick={openTutorial}>
            Guide
          </Button>
          <ScoreGuide className="score-guide--subtle" label="Score" />
          <Button onClick={() => setShowLeaveConfirm(true)}>
            Leave room
          </Button>
        </div>
      </header>

      <div className={`game-layout ${visibility !== "visible" ? "game-layout--obscured" : ""} ${tutorialTarget ? "game-layout--tutorial" : ""}`}>
        <aside className="side-panel">
          {visibility === "visible" ? (
            <div className="side-panel__private-stack">
              <PrivateHandRail
                hand={activePlayer.hand}
                cardPalette={cardColorPalette}
                paymentPreview={paymentPreview}
                className={tutorialTarget === "hand" ? "panel--tutorial-focus" : ""}
              />
              <TicketDock
                ticketProgress={ticketProgress}
                config={localMap}
                focusedTicketId={focusedTicket?.id ?? null}
                pinnedTicketId={pinnedTicket?.id ?? null}
                onFocusTicket={setFocusedTicket}
                onTogglePinnedTicket={(ticket) => setPinnedTicket((current) => current?.id === ticket.id ? null : ticket)}
                className={tutorialTarget === "hand" ? "panel--tutorial-focus" : ""}
              />
            </div>
          ) : (
            <Panel variant="alert" className="hidden-panel">
              <SectionHeader eyebrow="Privacy shield" title="Private info hidden" density="standard" />
              <p>The next player should only see the public board until they click `I'm ready`.</p>
            </Panel>
          )}

        </aside>

        <main className="board-column">
          <BoardStage className={`board-panel ${tutorialTarget === "board" ? "panel--tutorial-focus" : ""}`}>
            <BoardMap
              config={localMap}
              backdrop={localVisuals.backdrop}
              backdropMode={localVisuals.backdropMode}
              boardLabelMode={localVisuals.boardLabelMode}
              cardPalette={cardColorPalette}
              playerPalette={playerColorPalette}
              viewerPlayerId={game.players[game.activePlayerIndex]?.id}
              game={{
                players: game.players.map((player) => ({
                  id: player.id,
                  name: player.name,
                  color: player.color
                })),
                activePlayerIndex: game.activePlayerIndex,
                routeClaims: game.routeClaims,
                stations: game.stations
              }}
              selectedRouteId={selectedRouteId}
              selectedCityId={selectedCityId}
              highlightedCityIds={highlightedCityIds}
              onSelectRoute={(routeId) => {
                setSelectedRouteId(routeId);
                setSelectedCityId(null);
                setPaymentPreview(null);
              }}
              onSelectCity={(cityId) => {
                setSelectedCityId(cityId);
                setSelectedRouteId(null);
                setPaymentPreview(null);
              }}
            />
          </BoardStage>

          <InspectorDock
            summary={game.turn.summary}
            className={`action-panel ${tutorialTarget === "action" ? "panel--tutorial-focus" : ""}`}
            activeBuildKey={selectedRouteId ?? selectedCityId}
            marketContent={
              <SupplyDock
                market={game.market}
                deckCount={game.trainDeck.length}
                cardPalette={cardColorPalette}
                disabled={marketDisabled}
                onDrawFromMarket={(marketIndex) => applyAction({ type: "draw_card", source: "market", marketIndex })}
                onDrawFromDeck={() => applyAction({ type: "draw_card", source: "deck" })}
                onDrawTickets={() => applyAction({ type: "draw_tickets" })}
                drawTicketsDisabled={!canTakeTurnAction}
                className={`supply-dock--board ${tutorialTarget === "market" ? "panel--tutorial-focus" : ""}`}
              />
            }
            buildContent={
              <>
                {game.phase === "main" && visibility === "visible" && !currentRoute && !currentCity ? (
                  <div className="action-empty-prompt" data-testid="action-empty-state">
                    <span className="action-empty-prompt__title">Select a route or station.</span>
                    <span className="action-empty-prompt__copy">Build options appear here.</span>
                  </div>
                ) : null}

                {currentRoute && game.phase === "main" && visibility === "visible" ? (
              <SurfaceCard
                variant="detail"
                className="detail-card"
                data-detail-kind="route"
                title={`${getCityName(localMap, currentRoute.from)} → ${getCityName(localMap, currentRoute.to)}`}
              >
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">{currentRoute.length} train{currentRoute.length === 1 ? "" : "s"}</span>
                    <span className="detail-card__fact">{localMap.typeLabelOverrides?.[currentRoute.type] ?? currentRoute.type}</span>
                    <span className="detail-card__fact">{currentRoute.color === "gray" ? "gray route" : currentRoute.color}</span>
                    {currentRoute.locomotiveCost ? (
                      <span className="detail-card__fact">{currentRoute.locomotiveCost} locomotive{currentRoute.locomotiveCost === 1 ? "" : "s"}</span>
                    ) : null}
                  </div>
                  <p className="detail-card__prompt">
                    {currentRouteOwner ? `Claimed by ${currentRouteOwner.name}.` : "Choose payment color."}
                  </p>
                </div>
                <div className="detail-card__decision-shelf chip-row">
                  {routeOptions.length > 0 ? (
                    routeOptions.map((color) => (
                      <ChoiceChipButton
                        key={color}
                        style={{ ["--choice-chip-accent" as string]: cardColorPalette[color] }}
                        disabled={!canTakeTurnAction}
                        onMouseEnter={() =>
                          setPaymentPreview({ color, totalCost: currentRoute.length, minimumLocomotives: currentRoute.locomotiveCost ?? 0 })
                        }
                        onMouseLeave={() => setPaymentPreview(null)}
                        onFocus={() =>
                          setPaymentPreview({ color, totalCost: currentRoute.length, minimumLocomotives: currentRoute.locomotiveCost ?? 0 })
                        }
                        onBlur={() => setPaymentPreview(null)}
                        onClick={() => applyAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      >
                        Claim {formatCardLabel(color)}
                      </ChoiceChipButton>
                    ))
                  ) : (
                    <span className="muted-copy">{currentRouteUnavailableReason}</span>
                  )}
                </div>
              </SurfaceCard>
                ) : null}

                {currentCity && game.phase === "main" && visibility === "visible" ? (
              <SurfaceCard variant="detail" className="detail-card" title={currentCity.name}>
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">Station</span>
                  </div>
                  <p className="detail-card__prompt">Choose payment color.</p>
                </div>
                <div className="detail-card__decision-shelf chip-row">
                  {currentCityOccupied ? (
                    <span className="muted-copy">A station is already built in this city.</span>
                  ) : stationOptions.length > 0 ? (
                    stationOptions.map((color) => (
                      <ChoiceChipButton
                        key={color}
                        style={{ ["--choice-chip-accent" as string]: cardColorPalette[color] }}
                        disabled={!canTakeTurnAction}
                        onMouseEnter={() => setPaymentPreview({ color, totalCost: currentStationCost })}
                        onMouseLeave={() => setPaymentPreview(null)}
                        onFocus={() => setPaymentPreview({ color, totalCost: currentStationCost })}
                        onBlur={() => setPaymentPreview(null)}
                        onClick={() => applyAction({ type: "build_station", cityId: currentCity.id, color })}
                      >
                        Build {formatCardLabel(color)}
                      </ChoiceChipButton>
                    ))
                  ) : (
                    <span className="muted-copy">
                      {game.turn.stage === "idle" ? "No affordable station payment colors right now." : "Finish the current draw before building a station."}
                    </span>
                  )}
                </div>
              </SurfaceCard>
                ) : null}

                {game.turn.latestTunnelReveal.length > 0 && visibility === "visible" ? (
              <SurfaceCard variant="detail" className="detail-card detail-card--tunnel" eyebrow="Tunnel check" title="Tunnel reveal">
                <p>{game.turn.latestTunnelReveal.join(", ")}</p>
              </SurfaceCard>
                ) : null}
              </>
            }
          />
        </main>
      </div>

      {game.phase === "gameOver" ? (
        <GameOverLayer
          title="Final board locked."
          subtitle="Review the completed routes, station saves, and ticket swings before leaving the table."
          actions={
            <>
              <Button disabled>Share result</Button>
              <Button variant="primary" onClick={resetGame}>
                Play again
              </Button>
            </>
          }
        >
          <div className="endgame-grid">
            {game.players.map((player) => (
              <SurfaceCard key={player.id} as="article" variant="summary" eyebrow="Final score" title={player.name} className="endgame-card">
                <div className="endgame-card__hero">
                  <p className="endgame-score">{player.score}</p>
                  <span className="endgame-score__label">points</span>
                </div>
                <EndgameBreakdown player={player} config={localMap} />
              </SurfaceCard>
            ))}
          </div>
        </GameOverLayer>
      ) : null}

      {visibility === "postTurn" && game.phase !== "gameOver" ? (
        <ModalShell tone={tutorialTarget === "handoff" ? "tutorial" : "default"} width="md" align="center">
            <SectionHeader eyebrow="Turn complete" title={`${activePlayer.name}, pass the laptop.`} density="ceremony" />
            <p>{game.turn.summary ?? "Your action is locked in."}</p>
            <Button variant="primary" onClick={() => applyAction({ type: "advance_turn" })}>
              I&apos;m done
            </Button>
        </ModalShell>
      ) : null}

      {visibility === "handoff" && game.phase !== "gameOver" ? (
        <ModalShell tone={tutorialTarget === "handoff" ? "tutorial" : "default"} width="md" align="center">
            <SectionHeader eyebrow="Next player" title={`${activePlayer.name}, take over.`} density="ceremony" />
            <p>The board is safe to look at. Private cards and tickets stay hidden until you are ready.</p>
            <Button variant="primary" onClick={() => setVisibility("visible")}>
              I&apos;m ready
            </Button>
        </ModalShell>
      ) : null}

      {pendingTickets.length > 0 && visibility === "visible" && !isCurrentPlayerLocalBot ? (
        <TicketChoiceSheet
          title={game.phase === "initialTickets" ? `${activePlayer.name}, choose starting tickets` : `${activePlayer.name}, keep new tickets`}
          subtitle={
            game.phase === "initialTickets"
              ? "Keep at least two. Anything you return is gone for this game."
              : "Keep at least one. This counts as your full turn."
          }
          tickets={pendingTickets}
          config={localMap}
          minimumKeep={game.phase === "initialTickets" ? 2 : 1}
          selectedIds={selectedTicketIds}
          focusedTicketId={focusedTicket?.id ?? null}
          onFocusTicket={setFocusedTicket}
          onToggle={(ticketId) =>
            setSelectedTicketIds((current) =>
              current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]
            )
          }
          onConfirm={() =>
            applyAction(
              game.phase === "initialTickets"
                ? { type: "select_initial_tickets", keptTicketIds: selectedTicketIds }
                : { type: "keep_drawn_tickets", keptTicketIds: selectedTicketIds }
            )
          }
        />
      ) : null}

      {revealedDeckCard ? (
        <ModalShell width="md" align="center" cardClassName="draw-reveal-card">
            <SectionHeader eyebrow="Deck draw" title={`You drew ${formatFaceLabel(revealedDeckCard)}`} density="ceremony" />
            <TransitCard className="draw-reveal-preview" color={revealedDeckCard} context="hand" />
            <Button variant="primary" onClick={() => setRevealedDeckCard(null)}>
              Continue
            </Button>
        </ModalShell>
      ) : null}

      {showLeaveConfirm ? (
        <ModalShell width="md" align="center" cardClassName="leave-confirm-card">
          <SectionHeader eyebrow="Leave game" title="Leave this game?" density="ceremony" />
          <p>Your local match will return to setup.</p>
          <div className="setup-actions">
            <Button onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={resetGame}>
              Leave
            </Button>
          </div>
        </ModalShell>
      ) : null}

      <NotificationPipe notifications={notifications} />
      {tutorial}
    </div>
  );
}
