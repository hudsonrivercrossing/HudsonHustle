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
  FloatingBuildPanel,
  GameOverLayer,
  LOCOMOTIVE_COLOR,
  NotificationPipe,
  ScoreGuide,
  TableHand,
  TableSeats,
  TableSupply,
  TableTickets,
  TicketChoice,
  TunnelRevealMoment,
  TurnAnnouncement,
  TurnIndicator,
  buildEndgameLedgers,
  describeMargin,
  describeWinner,
  type GameplayNotification
} from "../../ui/game";
import { EndgameGrid, RouteBuildPanel, StationBuildPanel, shuffleAvatars } from "../../local";
import { CoachHint } from "../../shared/CoachHint";
import { pickCoachMoment, resetTips } from "../../shared/coachHints";
import { Button } from "../../ui/primitives/Button";
import { ModalShell } from "../../ui/primitives/ModalShell";
import { SectionHeader } from "../../ui/primitives/SectionHeader";
import { StatusBanner } from "../../ui/primitives/StatusBanner";
import { GuidebookScreen } from "../GuidebookScreen";
import { ReplayScreen } from "../replay/ReplayScreen";
import { canDrawCards, describeRouteCost, getRouteUnavailableReason } from "./routeAvailability";
import { useCardFlight } from "./useCardFlight";
import { useDrawnCardHighlight } from "./useDrawnCardHighlight";
import { useTunnelReveal } from "./useTunnelReveal";

/** The pause between one line of the final count and the next. */
const ENDGAME_STEP_MS = 320;

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
    drawnTicketsTitle: string;
    leaveLabel: string;
    leaveBody: string;
  };
  onPlayAgain: () => void;
  onLeave: () => void;
  /** Offer leaving next to "Play again" once the game is over. */
  leaveOfferedAtGameOver?: boolean;
  /** Sweep a banner across the table when the turn reaches this screen. Off where a handoff screen already says so. */
  announceTurn?: boolean;
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
  announceTurn = true,
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
  /** Phones show one tray at a time under the map. Wider screens show both and ignore this. */
  const [tray, setTray] = useState<"cards" | "tickets">("cards");
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

  // Once a route is claimed or a station built, its panel has done its job.
  useEffect(() => {
    clearSelection();
  }, [game.routeClaims.length, game.stations.length]);

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
  const { markSource } = useCardFlight(drawnFace, (face) => (face === "locomotive" ? LOCOMOTIVE_COLOR : visuals.palettes.cards[face]));
  const tunnel = useTunnelReveal(game, config);

  const playerIdsKey = game.players.map((player) => player.id).join("|");
  const seats = useMemo(() => {
    const avatars = shuffleAvatars(avatarSeed, game.players.length);
    return game.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      trainsLeft: player.trainsLeft,
      stationsLeft: player.stationsLeft,
      ticketCount: player.tickets.length,
      score: player.score,
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
  const choosingTickets = pendingTickets.length > 0 && !privateInfoHidden && !ticketChoiceSuppressed;
  // While tickets are being chosen, a phone shows the ticket tray whichever tab was open.
  const shownTray = choosingTickets ? "tickets" : tray;
  const endgameLedgers = game.phase === "gameOver" ? buildEndgameLedgers(game.players, config) : [];
  // Every player's lines are read out in step; totals wait for the longest list to finish.
  const endgameTotalBeat = Math.max(0, ...endgameLedgers.map((ledger) => 3 + ledger.completed.length + ledger.failed.length));

  return (
    <div className="app-shell app-shell--gameplay-hud tabletop" data-config-theme={visuals.theme} data-tray={shownTray}>
      <header className="tabletop__top">
        <div className="tabletop__seats" data-tour-target="roster">
          <TableSeats
            seats={seats}
            activePlayerId={activePlayer?.id ?? null}
            viewerPlayerId={viewer.id}
            playerPalette={playerPalette}
            finalRound={game.finalRoundRemaining !== null && game.phase === "main"}
          />
        </div>
        <TurnIndicator label={turnLabel} timerLabel={timerLabel} data-tour-target="turn" />
        <div className="tabletop__menu">
          <Button className="tabletop__menu-button" onClick={() => setGuideOpen(true)}>Guide</Button>
          <ScoreGuide className="score-guide--subtle tabletop__menu-item" label="Score" />
          <Button className="tabletop__menu-button tabletop__menu-button--leave" onClick={() => setShowLeaveConfirm(true)}>{copy.leaveLabel}</Button>
        </div>
      </header>

      <main className="tabletop__table">
        <aside className="tabletop__left" data-tour-target="tickets">
          {choosingTickets ? (
            <TicketChoice
              title={isInitialTickets ? copy.initialTicketsTitle : copy.drawnTicketsTitle}
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
          {privateInfoHidden ? null : (
            <TableTickets
              ticketProgress={ticketProgress}
              config={config}
              focusedTicketId={focusedTicket?.id ?? null}
              pinnedTicketId={pinnedTicket?.id ?? null}
              onFocusTicket={setFocusedTicket}
              onTogglePinnedTicket={(ticket) => setPinnedTicket((current) => (current?.id === ticket.id ? null : ticket))}
              onDrawTickets={() => onAction({ type: "draw_tickets" })}
              drawTicketsDisabled={!canTakeTurnAction}
            />
          )}
        </aside>

        <div className={`tabletop__board ${canAct && game.phase === "main" ? "tabletop__board--my-turn" : ""}`} data-tour-target="board">
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
            scores={game.players.map((player) => ({ playerId: player.id, score: player.score }))}
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
              {error ? <StatusBanner tone="warning" eyebrow="Action error" headline={error} /> : null}
            </FloatingBuildPanel>
          ) : null}
        </div>

        <aside className="tabletop__right" data-tour-target="market">
          <TableSupply
            market={game.market}
            deckCount={game.trainDeck.length}
            cardPalette={cardPalette}
            disabled={!canDrawCards(game, canAct)}
            isMarketCardDisabled={(card) => game.turn.drawsTaken === 1 && card.color === "locomotive"}
            onDrawFromMarket={(marketIndex) => {
              markSource(document.querySelectorAll('[data-draw-source="market"]')[marketIndex] ?? null);
              onAction({ type: "draw_card", source: "market", marketIndex });
            }}
            onDrawFromDeck={() => {
              markSource(document.querySelector('[data-draw-source="deck"] .train-card'));
              onAction({ type: "draw_card", source: "deck" });
            }}
          />
          <div className="tabletop__side">{sidePanel}</div>
        </aside>

        <div className="tabletop__hand" data-tour-target="hand">
          {privateInfoHidden ? null : <TableHand hand={viewer.hand} cardPalette={cardPalette} paymentPreview={paymentPreview} highlightedFace={drawnFace} />}
        </div>
      </main>

      <nav className="tabletop__tabs" aria-label="Show">
        <button type="button" aria-pressed={shownTray === "cards"} onClick={() => setTray("cards")}>Cards</button>
        <button type="button" aria-pressed={shownTray === "tickets"} onClick={() => setTray("tickets")}>
          Tickets ({ticketProgress.filter((entry) => entry.completed).length}/{ticketProgress.length})
        </button>
      </nav>

      <TurnAnnouncement
        active={announceTurn && canAct && game.phase === "main" && !privateInfoHidden}
        turnKey={`${game.activePlayerIndex}:${game.events?.filter((event) => event.type === "turn_started").at(-1)?.seq ?? 0}`}
        color={playerPalette[viewer.color]}
      />
      {tunnel.reveal ? <TunnelRevealMoment reveal={tunnel.reveal} cardPalette={cardPalette} onDone={tunnel.dismiss} /> : null}

      {game.phase === "gameOver" ? (
        <GameOverLayer
          title={describeWinner(endgameLedgers)}
          subtitle={describeMargin(endgameLedgers)}
          headlineDelayMs={(endgameTotalBeat + 1) * ENDGAME_STEP_MS}
          actions={
            <>
              <Button variant="primary" onClick={onPlayAgain}>Play again</Button>
              <Button onClick={() => setReplayOpen(true)}>Replay</Button>
              {leaveOfferedAtGameOver ? (
                <Button onClick={() => setShowLeaveConfirm(true)}>{copy.leaveLabel}</Button>
              ) : null}
            </>
          }
        >
          <EndgameGrid ledgers={endgameLedgers} playerPalette={playerPalette} revealStepMs={ENDGAME_STEP_MS} totalBeat={endgameTotalBeat} />
        </GameOverLayer>
      ) : null}

      {children}

      {showLeaveConfirm ? (
        <ModalShell width="md" align="center" cardClassName="leave-confirm-card" aria-label="Leave this game?" onDismiss={() => setShowLeaveConfirm(false)}>
          <SectionHeader eyebrow="Leave game" title="Leave this game?" variant="ceremony" />
          <p>{copy.leaveBody}</p>
          <div className="setup-actions">
            <Button data-autofocus onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
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
                choosingTickets,
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
