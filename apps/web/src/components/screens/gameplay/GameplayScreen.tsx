import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getAffordableRouteColors,
  getAffordableStationColors,
  getTicketProgress,
  type GameAction,
  type GameState,
  type MapConfig,
  type TicketDef,
  type TrainCardColor
} from "@hudson-hustle/game-core";
import type { getHudsonHustleVisualsByConfigId } from "@hudson-hustle/game-data";
import {
  BoardMap,
  BoardStage,
  FloatingBuildPanel,
  GameOverLayer,
  NotificationPipe,
  PlayerRoster,
  PrivateHandRail,
  ScoreGuide,
  SupplyDock,
  TicketChoiceSheet,
  TicketDock,
  TurnIndicator,
  type GameplayNotification
} from "../../ui/game";
import { EndgameGrid, RouteBuildPanel, StationBuildPanel, shuffleAvatars } from "../../local";
import { CoachHint } from "../../shared/CoachHint";
import { pickCoachMoment, resetTips } from "../../shared/coachHints";
import { Button } from "../../ui/primitives/Button";
import { ModalShell } from "../../ui/primitives/ModalShell";
import { Panel } from "../../ui/primitives/Panel";
import { SectionHeader } from "../../ui/primitives/SectionHeader";
import { StatusBanner } from "../../ui/primitives/StatusBanner";
import { SurfaceCard } from "../../ui/primitives/SurfaceCard";
import { GuidebookScreen } from "../GuidebookScreen";
import { ReplayScreen } from "../replay/ReplayScreen";
import { canDrawCards, describeRouteCost, getRouteUnavailableReason } from "./routeAvailability";
import { useDrawnCardHighlight } from "./useDrawnCardHighlight";

type PaymentPreview = { color: TrainCardColor; totalCost: number; minimumLocomotives?: number };

export interface GameplayScreenProps {
  config: MapConfig;
  visuals: ReturnType<typeof getHudsonHustleVisualsByConfigId>;
  /** The whole game in local play; one seat's view of it online. */
  game: GameState;
  /** Whose hand and tickets are on screen. */
  viewerPlayerId: string;
  /** The viewer is the active player and may act now. */
  canAct: boolean;
  /** Pass-and-play only: cover hand and tickets while the laptop changes hands. */
  privateInfoHidden?: boolean;
  /** Hide the ticket chooser, e.g. while a bot holds the pending tickets. */
  ticketChoiceSuppressed?: boolean;
  avatarSeed: string;
  /** Whose turn it is, worded for whoever is looking at this screen. */
  turnLabel: string;
  /** The turn clock, already worded, or null when untimed. */
  timerLabel: string | null;
  /** What sits above the market: room chat online, the turn guide in pass-and-play. */
  sidePanel: ReactNode;
  notifications: GameplayNotification[];
  error?: string | null;
  onAction: (action: GameAction) => void;
  copy: {
    initialTicketsTitle: string;
    initialTicketsSubtitle: string;
    drawnTicketsTitle: string;
    drawnTicketsSubtitle: string;
    gameOverSubtitle: string;
    leaveLabel: string;
    leaveBody: string;
  };
  onPlayAgain: () => void;
  onLeave: () => void;
  /** Offer leaving next to "Play again" once the game is over. */
  leaveOfferedAtGameOver?: boolean;
  /** Mode-specific layers drawn above the board, such as the pass-and-play handoff. */
  children?: ReactNode;
}

export function GameplayScreen({
  config,
  visuals,
  game,
  viewerPlayerId,
  canAct,
  privateInfoHidden = false,
  ticketChoiceSuppressed = false,
  avatarSeed,
  turnLabel,
  timerLabel,
  sidePanel,
  notifications,
  error = null,
  onAction,
  copy,
  onPlayAgain,
  onLeave,
  leaveOfferedAtGameOver = false,
  children
}: GameplayScreenProps): JSX.Element {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [buildAnchor, setBuildAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [focusedTicket, setFocusedTicket] = useState<TicketDef | null>(null);
  const [pinnedTicket, setPinnedTicket] = useState<TicketDef | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<PaymentPreview | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tipsResetToken, setTipsResetToken] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const lastPendingTicketKeyRef = useRef("");

  const viewer = game.players.find((player) => player.id === viewerPlayerId) ?? game.players[game.activePlayerIndex];
  const activePlayer = game.players[game.activePlayerIndex];
  const pendingTickets = viewer.pendingTickets;
  const pendingTicketKey = pendingTickets.map((ticket) => ticket.id).join("|");
  const minimumKeep = game.phase === "initialTickets" ? 2 : 1;

  function clearSelection() {
    setSelectedRouteId(null);
    setSelectedCityId(null);
    setPaymentPreview(null);
    setBuildAnchor(null);
  }

  // A different person is now looking at the screen (pass-and-play): drop what the last one had open.
  useEffect(() => {
    clearSelection();
    setFocusedTicket(null);
    setPinnedTicket(null);
  }, [viewerPlayerId]);

  // A payment preview belongs to the turn it was opened in.
  useEffect(() => {
    setPaymentPreview(null);
  }, [game.activePlayerIndex, game.turn.stage]);

  // Preselect the minimum number of tickets each time a new set is offered.
  useEffect(() => {
    if (pendingTicketKey === "") {
      lastPendingTicketKeyRef.current = "";
      setSelectedTicketIds([]);
      return;
    }
    if (lastPendingTicketKeyRef.current === pendingTicketKey) {
      return;
    }
    lastPendingTicketKeyRef.current = pendingTicketKey;
    setSelectedTicketIds(pendingTickets.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [minimumKeep, pendingTicketKey]);

  const drawnFace = useDrawnCardHighlight(viewer.id, viewer.hand);

  const playerIdsKey = game.players.map((player) => player.id).join("|");
  const rosterPlayers = useMemo(() => {
    const avatars = shuffleAvatars(avatarSeed, game.players.length);
    return game.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      trainsLeft: player.trainsLeft,
      stationsLeft: player.stationsLeft,
      ticketCount: player.tickets.length,
      score: player.score,
      routesCount: game.routeClaims.filter((claim) => claim.playerId === player.id).length,
      avatarName: avatars[index] ?? null
    }));
  }, [avatarSeed, game.players, game.routeClaims, playerIdsKey]);

  const ticketProgress = useMemo(
    () => getTicketProgress(game, config, viewer.id).sort((left, right) => Number(left.completed) - Number(right.completed)),
    [config, game, viewer.id]
  );

  const currentRoute = selectedRouteId ? config.routes.find((route) => route.id === selectedRouteId) ?? null : null;
  const currentCity = selectedCityId ? config.cities.find((city) => city.id === selectedCityId) ?? null : null;

  const routeOptions = useMemo(
    () => (canAct && currentRoute ? getAffordableRouteColors(game, config, currentRoute.id) : []),
    [canAct, config, currentRoute, game]
  );
  const stationOptions = useMemo(
    () => (canAct && currentCity ? getAffordableStationColors(game, config) : []),
    [canAct, config, currentCity, game]
  );
  const routeUnavailableReason = currentRoute ? getRouteUnavailableReason({ game, config, routeId: currentRoute.id, canAct }) : null;

  if (guideOpen) {
    return (
      <GuidebookScreen
        onBack={() => setGuideOpen(false)}
        onReplayTour={() => {
          resetTips();
          setTipsResetToken((current) => current + 1);
          setGuideOpen(false);
        }}
      />
    );
  }

  if (replayOpen) {
    return <ReplayScreen game={game} config={config} visuals={visuals} onClose={() => setReplayOpen(false)} />;
  }

  const canTakeTurnAction = canAct && game.phase === "main" && game.turn.stage === "idle";
  const currentRouteClaim = currentRoute ? game.routeClaims.find((claim) => claim.routeId === currentRoute.id) : null;
  const currentRouteOwner = currentRouteClaim ? game.players.find((player) => player.id === currentRouteClaim.playerId) : null;
  const currentCityOccupied = currentCity ? game.stations.some((station) => station.cityId === currentCity.id) : false;
  const stationCost = config.settings.stationsPerPlayer - viewer.stationsLeft + 1;
  const highlightedTicket = focusedTicket ?? pinnedTicket;
  const highlightedCityIds = highlightedTicket ? [highlightedTicket.from, highlightedTicket.to] : [];
  const cardPalette = visuals.palettes.cards;
  const playerPalette = visuals.palettes.players;
  const isInitialTickets = game.phase === "initialTickets";

  return (
    <div className="app-shell app-shell--gameplay-hud" data-config-theme={visuals.theme}>
      <header className="topbar topbar--gameplay-actions">
        <div className="topbar-private-spacer" aria-hidden="true" />
        <TurnIndicator label={turnLabel} timerLabel={timerLabel} data-tour-target="turn" />
        <div className="topbar-actions">
          <Button className="topbar-icon-btn" aria-label="Guide" onClick={() => setGuideOpen(true)} data-label="Guide">?</Button>
          <ScoreGuide className="score-guide--subtle topbar-icon-btn" label="★" tooltipLabel="Score" />
          <Button className="topbar-icon-btn topbar-icon-btn--leave" aria-label={copy.leaveLabel} onClick={() => setShowLeaveConfirm(true)} data-label="Leave">✕</Button>
        </div>
      </header>

      <div className="game-layout">
        <aside className="side-panel" data-tour-target="roster">
          {privateInfoHidden ? (
            <Panel variant="danger" className="hidden-panel">
              <SectionHeader eyebrow="Privacy shield" title="Private info hidden" variant="standard" />
              <p>Hand and tickets stay covered until the next player is ready. The board is public.</p>
            </Panel>
          ) : (
            <>
              <div className="side-panel__top">
                <PlayerRoster players={rosterPlayers} activePlayerIndex={game.activePlayerIndex} playerPalette={playerPalette} showOpenSeats={false} />
              </div>
              <div className="side-panel__bottom" data-tour-target="tickets">
                <TicketDock
                  ticketProgress={ticketProgress}
                  config={config}
                  focusedTicketId={focusedTicket?.id ?? null}
                  pinnedTicketId={pinnedTicket?.id ?? null}
                  onFocusTicket={setFocusedTicket}
                  onTogglePinnedTicket={(ticket) => setPinnedTicket((current) => (current?.id === ticket.id ? null : ticket))}
                  onDrawTickets={() => onAction({ type: "draw_tickets" })}
                  drawTicketsDisabled={!canTakeTurnAction}
                />
              </div>
            </>
          )}
        </aside>

        <main className="board-column">
          <div className="map-col">
            <BoardStage className="board-panel" isMyTurn={canAct && game.phase === "main"} data-tour-target="board">
              <BoardMap
                config={config}
                backdrop={visuals.backdrop}
                backdropMode={visuals.backdropMode}
                boardLabelMode={visuals.boardLabelMode}
                cardPalette={cardPalette}
                playerPalette={playerPalette}
                viewerPlayerId={viewer.id}
                game={{
                  players: game.players.map((player) => ({ id: player.id, name: player.name, color: player.color })),
                  activePlayerIndex: game.activePlayerIndex,
                  routeClaims: game.routeClaims,
                  stations: game.stations
                }}
                selectedRouteId={selectedRouteId}
                selectedCityId={selectedCityId}
                highlightedCityIds={highlightedCityIds}
                onSelectRoute={(routeId, position) => {
                  setSelectedRouteId(routeId);
                  setSelectedCityId(null);
                  setPaymentPreview(null);
                  setBuildAnchor(position ?? null);
                }}
                onSelectCity={(cityId, position) => {
                  setSelectedCityId(cityId);
                  setSelectedRouteId(null);
                  setPaymentPreview(null);
                  setBuildAnchor(position ?? null);
                }}
              />

              {(currentRoute || currentCity) && game.phase === "main" && !privateInfoHidden ? (
                <FloatingBuildPanel anchor={buildAnchor} onClose={clearSelection}>
                  {currentRoute ? (
                    <RouteBuildPanel
                      route={currentRoute}
                      config={config}
                      options={routeOptions}
                      unavailableReason={routeUnavailableReason}
                      cardPalette={cardPalette}
                      disabled={!canTakeTurnAction}
                      claimedByName={currentRouteOwner?.name ?? null}
                      costSummary={describeRouteCost(currentRoute)}
                      onClaim={(color) => onAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      onPaymentPreviewEnter={setPaymentPreview}
                      onPaymentPreviewLeave={() => setPaymentPreview(null)}
                    />
                  ) : currentCity ? (
                    <StationBuildPanel
                      city={currentCity}
                      config={config}
                      options={stationOptions}
                      cityOccupied={currentCityOccupied}
                      stationCost={stationCost}
                      cardPalette={cardPalette}
                      disabled={!canTakeTurnAction}
                      turnStage={game.turn.stage}
                      onBuild={(color) => onAction({ type: "build_station", cityId: currentCity.id, color })}
                      onPaymentPreviewEnter={setPaymentPreview}
                      onPaymentPreviewLeave={() => setPaymentPreview(null)}
                    />
                  ) : null}
                  {game.turn.latestTunnelReveal.length > 0 ? (
                    <SurfaceCard variant="detail" className="detail-card detail-card--tunnel" eyebrow="Tunnel check" title="Tunnel reveal">
                      <p>{game.turn.latestTunnelReveal.join(", ")}</p>
                    </SurfaceCard>
                  ) : null}
                  {error ? <StatusBanner tone="warning" eyebrow="Action error" headline={error} /> : null}
                </FloatingBuildPanel>
              ) : null}
            </BoardStage>

            {privateInfoHidden ? null : (
              <div data-tour-target="hand" style={{ display: "contents" }}>
                <PrivateHandRail hand={viewer.hand} cardPalette={cardPalette} paymentPreview={paymentPreview} highlightedFace={drawnFace} />
              </div>
            )}
          </div>

          <div className="right-col" data-tour-target="market">
            {sidePanel}
            <SupplyDock
              market={game.market}
              deckCount={game.trainDeck.length}
              cardPalette={cardPalette}
              disabled={!canDrawCards(game, canAct)}
              isMarketCardDisabled={(card) => game.turn.drawsTaken === 1 && card.color === "locomotive"}
              onDrawFromMarket={(marketIndex) => onAction({ type: "draw_card", source: "market", marketIndex })}
              onDrawFromDeck={() => onAction({ type: "draw_card", source: "deck" })}
              className="supply-dock--board"
            />
            {pendingTickets.length > 0 && !privateInfoHidden && !ticketChoiceSuppressed ? (
              <TicketChoiceSheet
                title={isInitialTickets ? copy.initialTicketsTitle : copy.drawnTicketsTitle}
                subtitle={isInitialTickets ? copy.initialTicketsSubtitle : copy.drawnTicketsSubtitle}
                tickets={pendingTickets}
                config={config}
                minimumKeep={minimumKeep}
                selectedIds={selectedTicketIds}
                focusedTicketId={focusedTicket?.id ?? null}
                onFocusTicket={setFocusedTicket}
                onToggle={(ticketId) =>
                  setSelectedTicketIds((current) => (current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]))
                }
                onConfirm={() =>
                  onAction({ type: isInitialTickets ? "select_initial_tickets" : "keep_drawn_tickets", keptTicketIds: selectedTicketIds })
                }
              />
            ) : null}
          </div>
        </main>
      </div>

      {game.phase === "gameOver" ? (
        <GameOverLayer
          title="Final board locked."
          subtitle={copy.gameOverSubtitle}
          actions={
            <>
              <Button onClick={() => setReplayOpen(true)}>Replay</Button>
              <Button variant="primary" onClick={onPlayAgain}>Play again</Button>
              {leaveOfferedAtGameOver ? (
                <Button onClick={() => setShowLeaveConfirm(true)}>{copy.leaveLabel}</Button>
              ) : null}
            </>
          }
        >
          <EndgameGrid players={game.players} config={config} />
        </GameOverLayer>
      ) : null}

      {children}

      {showLeaveConfirm ? (
        <ModalShell width="md" align="center" cardClassName="leave-confirm-card">
          <SectionHeader eyebrow="Leave game" title="Leave this game?" variant="ceremony" />
          <p>{copy.leaveBody}</p>
          <div className="setup-actions">
            <Button onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              className="leave-button"
              onClick={() => {
                setShowLeaveConfirm(false);
                onLeave();
              }}
            >
              Leave
            </Button>
          </div>
        </ModalShell>
      ) : null}

      <NotificationPipe notifications={notifications} />

      <CoachHint
        resetToken={tipsResetToken}
        moment={
          showLeaveConfirm || replayOpen
            ? null
            : pickCoachMoment({
                phase: game.phase,
                canAct,
                privateInfoHidden,
                choosingTickets: pendingTickets.length > 0 && !ticketChoiceSuppressed,
                turnStage: game.turn.stage,
                routeSelected: Boolean(currentRoute),
                citySelected: Boolean(currentCity),
                finalRound: game.finalRoundRemaining !== null
              })
        }
      />
    </div>
  );
}
