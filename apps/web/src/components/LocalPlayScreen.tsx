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
  FloatingPlayerRoster,
  GameOverLayer,
  InspectorDock,
  NotificationPipe,
  PrivateHandRail,
  SupplyDock,
  TicketChoiceSheet,
  TicketDock,
  formatCardLabel,
  type GameplayNotification
} from "./GameplayHud";
import { GuidebookScreen } from "./GuidebookScreen";
import { ScoreGuide } from "./ScoreGuide";
import { SetupScreen } from "./SetupScreen";
import { TransitCard } from "./TransitCard";
import { Button } from "./system/Button";
import { ChoiceChipButton } from "./system/ChoiceChipButton";
import { ModalShell } from "./system/ModalShell";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { SurfaceCard } from "./system/SurfaceCard";

const AVATAR_NAMES = [
  "Conductor", "Milo", "Engineer", "Rosa", "Switchman",
  "Jack", "Dispatcher", "Lily", "Caboose", "Nellie"
];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h = (h ^ (h >>> 16)) * 0x45d9f3b | 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffleAvatars(seed: string, count: number): string[] {
  const rng = seededRandom(seed);
  const pool = [...AVATAR_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const saveKey = "hudson-hustle-save-v1";

type VisibilityMode = "visible" | "postTurn" | "handoff";
type LocalStartSetup = { playerNames: string[]; botSeatIds: string[]; configId: string; turnTimeLimitSeconds: number };

interface LocalPlayScreenProps {
  onReturnToGateway?: () => void;
}

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
  const [guideOpen, setGuideOpen] = useState(false);
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
    if (!localMap.routes.find((route) => route.id === selectedRouteId)) {
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
    setGuideOpen(true);
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

  if (guideOpen) {
    return <GuidebookScreen onBack={() => setGuideOpen(false)} />;
  }

  if (!game) {
    return (
      <SetupScreen
        onStart={startNewGame}
        canResume={hasSavedGame}
        onResume={resumeGame}
        onOpenGuide={openTutorial}
        onBack={onReturnToGateway}
        releasedConfigs={hudsonHustleReleasedConfigs}
        initialConfigId={localConfigId}
      />
    );
  }

  const activePlayer = getCurrentPlayer(game);
  const tutorialTarget = null;
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

  const playerAvatars = useMemo(() => {
    if (!game) return {};
    const avatars = shuffleAvatars(game.players.map((p) => p.id).join("|"), game.players.length);
    const map: Record<string, string> = {};
    game.players.forEach((p, i) => { map[p.id] = avatars[i]; });
    return map;
  }, [game?.players.map((p) => p.id).join("|")]);

  const rosterPlayers = useMemo(() => {
    if (!game) return [];
    return game.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      trainsLeft: p.trainsLeft,
      stationsLeft: p.stationsLeft,
      ticketCount: p.tickets.length + p.pendingTickets.length,
      avatarName: playerAvatars[p.id] ?? null
    })) as Array<{ id: string; name: string; color: string; trainsLeft: number; stationsLeft: number; ticketCount: number; avatarName?: string | null }>;
  }, [game, playerAvatars]);

  return (
    <div className="app-shell app-shell--gameplay-hud" data-config-theme={localVisuals.theme}>
      <header className="topbar topbar--gameplay-actions">
        <div className="topbar-private-spacer" aria-hidden="true" />
        <div className="turn-indicator">
          <span className="turn-indicator__name">{game.players[game.activePlayerIndex]?.name}</span>
          <span className="turn-indicator__label">active</span>
        </div>
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
            <FloatingPlayerRoster
              players={rosterPlayers}
              activePlayerIndex={game.activePlayerIndex}
              playerPalette={playerColorPalette}
              viewerPlayerId={game.players[game.activePlayerIndex]?.id ?? null}
            />
          </BoardStage>

          <InspectorDock
            summary={game.turn.summary}
            className={`action-panel ${tutorialTarget === "action" ? "panel--tutorial-focus" : ""}`}
            activeBuildKey={selectedRouteId ?? selectedCityId}
            currentPlayerName={game.players[game.activePlayerIndex]?.name}
            deckCount={game.trainDeck.length}
            ticketDeckCount={game.regularTickets.length + game.longTickets.length}
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
    </div>
  );
}
