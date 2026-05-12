import { useEffect, useMemo, useRef, useState } from "react";
import {
  chooseBotAction,
  getAffordableRouteColors,
  getAffordableStationColors,
  getCurrentPlayer,
  getTicketProgress,
  reduceGame,
  startGame,
  type GameAction,
  type GameState,
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
import {
  BoardMap,
  BoardStage,
  ChatPanel,
  FloatingBuildPanel,
  PlayerRoster,
  GameOverLayer,
  NotificationPipe,
  PrivateHandRail,
  SupplyDock,
  TicketChoiceSheet,
  TicketDock,
  TurnIndicator,
  type GameplayNotification
} from "../ui/game";
import { GuidebookScreen } from "./GuidebookScreen";
import OnboardingTour, { shouldShowTour } from "../shared/OnboardingTour";
import {
  EndgameGrid,
  HandoffModal,
  RouteBuildPanel,
  StationBuildPanel,
  botPlayerIdsFromSavedGame,
  botPlayerIdsFromSeatIds,
  buildLocalPrivateState,
  buildLocalPublicGameState,
  configIdForSavedMap,
  formatFaceLabel,
  LOCAL_SAVE_KEY,
  readSavedGame,
  shuffleAvatars,
  type LocalStartSetup,
  type VisibilityMode
} from "../local";
import { ScoreGuide, TransitCard } from "../ui/game";
import { SetupScreen } from "./SetupScreen";
import { Button } from "../ui/primitives/Button";
import { ModalShell } from "../ui/primitives/ModalShell";
import { Panel } from "../ui/primitives/Panel";
import { StatusBanner } from "../ui/primitives/StatusBanner";
import { SectionHeader } from "../ui/primitives/SectionHeader";
import { SurfaceCard } from "../ui/primitives/SurfaceCard";

interface LocalPlayScreenProps {
  onReturnToGateway?: () => void;
}

export function LocalPlayScreen({ onReturnToGateway }: LocalPlayScreenProps): JSX.Element {
  const [game, setGame] = useState<GameState | null>(null);
  const [visibility, setVisibility] = useState<VisibilityMode>("visible");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [buildAnchor, setBuildAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [focusedTicket, setFocusedTicket] = useState<TicketDef | null>(null);
  const [pinnedTicket, setPinnedTicket] = useState<TicketDef | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<{ color: TrainCardColor; totalCost: number; minimumLocomotives?: number } | null>(null);
  const [revealedDeckCard, setRevealedDeckCard] = useState<keyof typeof cardColorPalette | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => typeof window !== "undefined" && Boolean(readSavedGame()));
  const [localConfigId, setLocalConfigId] = useState(hudsonHustleCurrentConfigId);
  const [localTurnTimeLimitSeconds, setLocalTurnTimeLimitSeconds] = useState(0);
  const [localBotPlayerIds, setLocalBotPlayerIds] = useState<string[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notifications, setNotifications] = useState<GameplayNotification[]>([]);
  const notificationIdRef = useRef(0);
  const pendingDrawsRef = useRef<{ player: string; cards: string[] } | null>(null);
  const [localChat, setLocalChat] = useState<Array<{ id: string; playerName: string; message: string }>>([]);
  const chatIdRef = useRef(0);
  const [turnStartedAt, setTurnStartedAt] = useState<number>(() => Date.now());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [tourOpen, setTourOpen] = useState(false);
  const tourInitRef = useRef(false);
  const localMap = useMemo(() => getHudsonHustleMapByConfigId(localConfigId), [localConfigId]);
  const localVisuals = useMemo(() => getHudsonHustleVisualsByConfigId(localConfigId), [localConfigId]);

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

  // Show onboarding tour the first time the player reaches a playable game
  useEffect(() => {
    if (game && game.phase === "main" && visibility === "visible" && !tourInitRef.current) {
      tourInitRef.current = true;
      setTourOpen(shouldShowTour());
    }
  }, [game?.phase, visibility]);

  const liveTimerSecondsRemaining = localTurnTimeLimitSeconds > 0
    ? Math.max(0, Math.ceil(localTurnTimeLimitSeconds - (nowMs - turnStartedAt) / 1000))
    : null;

  function pushNotification(message: string, tone: GameplayNotification["tone"] = "neutral") {
    notificationIdRef.current += 1;
    const id = `local-${Date.now()}-${notificationIdRef.current}`;
    setNotifications((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== id));
    }, 2000);
  }

  function flushPendingDraws() {
    const pending = pendingDrawsRef.current;
    if (pending && pending.cards.length > 0) {
      const cardList = pending.cards.join(", ");
      pushNotification(`${pending.player} drew ${cardList}.`);
    }
    pendingDrawsRef.current = null;
  }

  function announceGameChange(previous: GameState, nextGame: GameState) {
    if (nextGame.phase === "gameOver" && previous.phase !== "gameOver") {
      flushPendingDraws();
      pushNotification("Final scores are in.", "success");
      return;
    }
    if (nextGame.finalRoundTriggeredBy && previous.finalRoundTriggeredBy !== nextGame.finalRoundTriggeredBy) {
      flushPendingDraws();
      const triggerPlayer = nextGame.players.find((p) => p.id === nextGame.finalRoundTriggeredBy);
      pushNotification(`${triggerPlayer?.name ?? "A player"} triggered the final round.`, "warning");
      return;
    }

    // Walk every new log entry; batch consecutive draws per player into one notification
    const newEntries = nextGame.log.slice(previous.log.length);
    for (const entry of newEntries) {
      if (entry === "Game setup complete.") continue;

      const drawMatch = entry.match(/^(.+) drew a (.+) card\.$/);
      if (drawMatch) {
        const [, player, card] = drawMatch;
        if (pendingDrawsRef.current && pendingDrawsRef.current.player !== player) {
          flushPendingDraws();
        }
        if (!pendingDrawsRef.current) {
          pendingDrawsRef.current = { player, cards: [] };
        }
        pendingDrawsRef.current.cards.push(card);
        continue;
      }
      if (entry.includes("claimed") || entry.includes("built a station")) {
        flushPendingDraws();
        pushNotification(entry);
        continue;
      }
      if (entry.includes("turn started")) {
        flushPendingDraws();
      }
    }
  }

  const currentPlayer = game ? getCurrentPlayer(game) : null;
  const isCurrentPlayerLocalBot = currentPlayer ? localBotPlayerIds.includes(currentPlayer.id) : false;
  const pendingTickets = currentPlayer?.pendingTickets ?? [];
  const pendingTicketIds = useMemo(() => pendingTickets.map((t) => t.id).join("|"), [pendingTickets]);

  useEffect(() => {
    if (!game || pendingTickets.length === 0) {
      setSelectedTicketIds([]);
      return;
    }
    const minimumKeep = game.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pendingTickets.slice(0, minimumKeep).map((t) => t.id));
  }, [game?.phase, pendingTicketIds]);

  useEffect(() => {
    if (!game || game.phase === "gameOver" || localBotPlayerIds.length === 0) return;
    const activePlayer = getCurrentPlayer(game);
    if (!localBotPlayerIds.includes(activePlayer.id)) return;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        if (!current || current.phase === "gameOver") return current;
        try {
          let nextGame = current;
          for (let steps = 0; steps < 8; steps += 1) {
            const nextActivePlayer = getCurrentPlayer(nextGame);
            if (!localBotPlayerIds.includes(nextActivePlayer.id) || nextGame.phase === "gameOver") break;
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
    if (!saved) return;
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
    window.localStorage.removeItem(LOCAL_SAVE_KEY);
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

  function applyAction(action: GameAction) {
    if (!game) return;
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
        if (drawnCard) setRevealedDeckCard(drawnCard.color);
      }

      if (nextGame.phase === "gameOver") { setVisibility("visible"); return; }
      if (action.type === "select_initial_tickets") { setVisibility("handoff"); return; }
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

  const routeOptions = useMemo(() => {
    if (!game || !selectedRouteId) return [];
    if (!localMap.routes.find((r) => r.id === selectedRouteId)) return [];
    return getAffordableRouteColors(game, localMap, selectedRouteId);
  }, [game, localMap, selectedRouteId]);

  const stationOptions = useMemo(() => {
    if (!game || !selectedCityId) return [];
    return getAffordableStationColors(game, localMap);
  }, [game, localMap, selectedCityId]);

  const ticketProgress = useMemo(() => {
    if (!game || !currentPlayer) return [];
    return getTicketProgress(game, localMap, currentPlayer.id).sort(
      (a, b) => Number(a.completed) - Number(b.completed)
    );
  }, [currentPlayer, game, localMap]);

  const currentRouteUnavailableReason = useMemo(() => {
    if (!game || !selectedRouteId) return null;
    const route = localMap.routes.find((r) => r.id === selectedRouteId);
    if (!route) return null;
    const claim = game.routeClaims.find((c) => c.routeId === route.id);
    const owner = claim ? game.players.find((p) => p.id === claim.playerId) : null;
    if (route.twinGroup && game.players.length <= 3) {
      const twinIds = localMap.routes.filter((r) => r.twinGroup === route.twinGroup).map((r) => r.id);
      const twinClaim = game.routeClaims.find((c) => twinIds.includes(c.routeId) && c.routeId !== route.id);
      if (twinClaim) {
        const twinOwner = game.players.find((p) => p.id === twinClaim.playerId);
        return `This parallel route is unavailable in a ${game.players.length}-player game because its twin is already claimed${twinOwner ? ` by ${twinOwner.name}` : ""}.`;
      }
    }
    if (!owner) return null;
    if (currentPlayer && owner.id !== currentPlayer.id) return `Already claimed by ${owner.name}.`;
    return "No affordable claim options right now.";
  }, [game, localMap, selectedRouteId]);

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
  const tutorialTarget = null;
  const canTakeTurnAction = visibility === "visible" && game.phase === "main" && game.turn.stage === "idle";
  const marketDisabled = visibility !== "visible" || game.phase !== "main" || game.turn.stage === "awaitingHandoff";
  const currentCity = selectedCityId ? localMap.cities.find((c) => c.id === selectedCityId) : null;
  const currentCityOccupied = currentCity ? game.stations.some((s) => s.cityId === currentCity.id) : false;
  const currentRoute = selectedRouteId ? localMap.routes.find((r) => r.id === selectedRouteId) : null;
  const currentRouteClaim = currentRoute ? game.routeClaims.find((c) => c.routeId === currentRoute.id) : null;
  const currentRouteOwner = currentRouteClaim ? game.players.find((p) => p.id === currentRouteClaim.playerId) : null;
  const currentStationCost = localMap.settings.stationsPerPlayer - activePlayer.stationsLeft + 1;
  const highlightedTicket = focusedTicket ?? pinnedTicket;
  const highlightedCityIds = highlightedTicket ? [highlightedTicket.from, highlightedTicket.to] : [];

  return (
    <div className="app-shell app-shell--gameplay-hud" data-config-theme={localVisuals.theme}>
      <header className="topbar topbar--gameplay-actions">
        <div className="topbar-private-spacer" aria-hidden="true" />
        <TurnIndicator playerName={game.players[game.activePlayerIndex]?.name ?? ""} secondsRemaining={liveTimerSecondsRemaining} />
        <div className="topbar-actions">
          <Button className="topbar-icon-btn" aria-label="Guide" onClick={() => setGuideOpen(true)} data-label="Guide">?</Button>
          <ScoreGuide className="score-guide--subtle topbar-icon-btn" label="★" tooltipLabel="Score" />
          <Button className="topbar-icon-btn topbar-icon-btn--leave" aria-label="Leave room" onClick={() => setShowLeaveConfirm(true)} data-label="Leave">✕</Button>
        </div>
      </header>

      <div className={`game-layout ${visibility !== "visible" ? "game-layout--obscured" : ""} ${tutorialTarget ? "game-layout--tutorial" : ""}`}>
        {/* Left column: 50/50 split — roster (top), tickets + draw button (bottom) */}
        <aside className="side-panel" data-tour-target="roster">
          {visibility === "visible" ? (
            <>
              <div className="side-panel__top">
                <PlayerRoster
                  players={rosterPlayers}
                  activePlayerIndex={game.activePlayerIndex}
                  playerPalette={playerColorPalette}
                />
              </div>
              <div className="side-panel__bottom" data-tour-target="tickets">
                <TicketDock
                  ticketProgress={ticketProgress}
                  config={localMap}
                  focusedTicketId={focusedTicket?.id ?? null}
                  pinnedTicketId={pinnedTicket?.id ?? null}
                  onFocusTicket={setFocusedTicket}
                  onTogglePinnedTicket={(ticket) => setPinnedTicket((current) => current?.id === ticket.id ? null : ticket)}
                  onDrawTickets={() => applyAction({ type: "draw_tickets" })}
                  drawTicketsDisabled={!canTakeTurnAction}
                  className={tutorialTarget === "tickets" ? "panel--tutorial-focus" : ""}
                />
              </div>
            </>
          ) : (
            <Panel variant="danger" className="hidden-panel">
              <SectionHeader eyebrow="Privacy shield" title="Private info hidden" variant="standard" />
              <p>The next player should only see the public board until they click `I'm ready`.</p>
            </Panel>
          )}
        </aside>

        {/* Center + right: board-column grid */}
        <main className="board-column">
          {/* Center: map + hand strip */}
          <div className="map-col">
            <BoardStage
              className={`board-panel ${tutorialTarget === "board" ? "panel--tutorial-focus" : ""}`}
              isMyTurn={visibility === "visible" && game.phase === "main"}
              data-tour-target="board"
            >
              <BoardMap
                config={localMap}
                backdrop={localVisuals.backdrop}
                backdropMode={localVisuals.backdropMode}
                boardLabelMode={localVisuals.boardLabelMode}
                cardPalette={cardColorPalette}
                playerPalette={playerColorPalette}
                viewerPlayerId={game.players[game.activePlayerIndex]?.id}
                game={{
                  players: game.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
                  activePlayerIndex: game.activePlayerIndex,
                  routeClaims: game.routeClaims,
                  stations: game.stations
                }}
                selectedRouteId={selectedRouteId}
                selectedCityId={selectedCityId}
                highlightedCityIds={highlightedCityIds}
                onSelectRoute={(routeId, position) => { setSelectedRouteId(routeId); setSelectedCityId(null); setPaymentPreview(null); setBuildAnchor(position ?? null); }}
                onSelectCity={(cityId, position) => { setSelectedCityId(cityId); setSelectedRouteId(null); setPaymentPreview(null); setBuildAnchor(position ?? null); }}
              />

              {/* Floating build popup — appears on map when route/city selected */}
              {(currentRoute || currentCity) && game.phase === "main" && visibility === "visible" ? (
                <FloatingBuildPanel
                  anchor={buildAnchor}
                  onClose={() => { setSelectedRouteId(null); setSelectedCityId(null); setPaymentPreview(null); setBuildAnchor(null); }}
                >
                  {currentRoute ? (
                    <RouteBuildPanel
                      route={currentRoute}
                      config={localMap}
                      options={routeOptions}
                      unavailableReason={currentRouteUnavailableReason}
                      cardPalette={cardColorPalette}
                      disabled={!canTakeTurnAction}
                      claimedByName={currentRouteOwner?.name ?? null}
                      onClaim={(color) => applyAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      onPaymentPreviewEnter={(preview) => setPaymentPreview(preview)}
                      onPaymentPreviewLeave={() => setPaymentPreview(null)}
                    />
                  ) : currentCity ? (
                    <StationBuildPanel
                      city={currentCity}
                      config={localMap}
                      options={stationOptions}
                      cityOccupied={currentCityOccupied}
                      stationCost={currentStationCost}
                      cardPalette={cardColorPalette}
                      disabled={!canTakeTurnAction}
                      turnStage={game.turn.stage}
                      onBuild={(color) => applyAction({ type: "build_station", cityId: currentCity.id, color })}
                      onPaymentPreviewEnter={(preview) => setPaymentPreview(preview)}
                      onPaymentPreviewLeave={() => setPaymentPreview(null)}
                    />
                  ) : null}
                  {game.turn.latestTunnelReveal.length > 0 ? (
                    <SurfaceCard variant="detail" className="detail-card detail-card--tunnel" eyebrow="Tunnel check" title="Tunnel reveal">
                      <p>{game.turn.latestTunnelReveal.join(", ")}</p>
                    </SurfaceCard>
                  ) : null}
                  {error ? (
                    <StatusBanner tone="warning" eyebrow="Action error" headline={error} />
                  ) : null}
                </FloatingBuildPanel>
              ) : null}
            </BoardStage>

            {visibility === "visible" ? (
              <div data-tour-target="hand" style={{ display: "contents" }}>
                <PrivateHandRail
                  hand={activePlayer.hand}
                  cardPalette={cardColorPalette}
                  paymentPreview={paymentPreview}
                  className={tutorialTarget === "hand" ? "panel--tutorial-focus" : ""}
                />
              </div>
            ) : null}
          </div>

          {/* Right column: chat + market — overlaid by ticket picker when active */}
          <div className="right-col" data-tour-target="market">
            <ChatPanel
              messages={localChat}
              onSendMessage={(message) => {
                chatIdRef.current += 1;
                setLocalChat((current) => [
                  ...current,
                  { id: `local-chat-${chatIdRef.current}`, playerName: activePlayer.name, message }
                ]);
              }}
              className={tutorialTarget === "action" ? "panel--tutorial-focus" : ""}
            />
            <SupplyDock
              market={game.market}
              deckCount={game.trainDeck.length}
              cardPalette={cardColorPalette}
              disabled={marketDisabled}
              onDrawFromMarket={(marketIndex) => applyAction({ type: "draw_card", source: "market", marketIndex })}
              onDrawFromDeck={() => applyAction({ type: "draw_card", source: "deck" })}
              className={`supply-dock--board ${tutorialTarget === "market" ? "panel--tutorial-focus" : ""}`}
            />
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
          </div>
        </main>
      </div>

      {game.phase === "gameOver" ? (
        <GameOverLayer
          title="Final board locked."
          subtitle="Review the completed routes, station saves, and ticket swings before leaving the table."
          actions={
            <>
              <Button disabled>Share result</Button>
              <Button variant="primary" onClick={resetGame}>Play again</Button>
            </>
          }
        >
          <EndgameGrid players={game.players} config={localMap} />
        </GameOverLayer>
      ) : null}

      {visibility === "postTurn" && game.phase !== "gameOver" ? (
        <HandoffModal
          mode="postTurn"
          playerName={activePlayer.name}
          summary={game.turn.summary}
          onAdvance={() => applyAction({ type: "advance_turn" })}
          onReady={() => setVisibility("visible")}
        />
      ) : null}

      {visibility === "handoff" && game.phase !== "gameOver" ? (
        <HandoffModal
          mode="handoff"
          playerName={activePlayer.name}
          onAdvance={() => applyAction({ type: "advance_turn" })}
          onReady={() => setVisibility("visible")}
        />
      ) : null}

      {revealedDeckCard ? (
        <ModalShell width="md" align="center" cardClassName="draw-reveal-card">
          <SectionHeader eyebrow="Deck draw" title={`You drew ${formatFaceLabel(revealedDeckCard)}`} variant="ceremony" />
          <TransitCard className="draw-reveal-preview" color={revealedDeckCard} context="hand" />
          <Button variant="primary" onClick={() => setRevealedDeckCard(null)}>Continue</Button>
        </ModalShell>
      ) : null}

      {showLeaveConfirm ? (
        <ModalShell width="md" align="center" cardClassName="leave-confirm-card">
          <SectionHeader eyebrow="Leave game" title="Leave this game?" variant="ceremony" />
          <p>Your local match will return to setup.</p>
          <div className="setup-actions">
            <Button onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={resetGame}>Leave</Button>
          </div>
        </ModalShell>
      ) : null}

      <NotificationPipe notifications={notifications} />

      {tourOpen && (
        <OnboardingTour onDismiss={() => setTourOpen(false)} />
      )}
    </div>
  );
}
