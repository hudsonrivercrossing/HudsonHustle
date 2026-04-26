import { useEffect, useMemo, useState } from "react";
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
  type SeatPrivateState
} from "@hudson-hustle/game-core";
import {
  cardColorPalette,
  hudsonHustleCurrentConfigId,
  hudsonHustleCurrentConfigMeta,
  hudsonHustleReleasedConfigs,
  getHudsonHustleMapByConfigId,
  getHudsonHustleRegisteredConfig,
  getHudsonHustleVisualsByConfigId,
  playerColorPalette
} from "@hudson-hustle/game-data";
import { BoardMap } from "./BoardMap";
import { EndgameBreakdown } from "./EndgameBreakdown";
import { GuidebookScreen } from "./GuidebookScreen";
import { ScoreGuide } from "./ScoreGuide";
import { SetupScreen } from "./SetupScreen";
import { TicketPicker } from "./TicketPicker";
import { TransitCard } from "./TransitCard";
import { Button } from "./system/Button";
import { Chip } from "./system/Chip";
import { ChoiceChipButton } from "./system/ChoiceChipButton";
import { ModalShell } from "./system/ModalShell";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import { SurfaceCard } from "./system/SurfaceCard";
import { StateSurface } from "./system/StateSurface";
import { StatusBanner } from "./system/StatusBanner";
import { UtilityPill } from "./system/UtilityPill";

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
  const [revealedDeckCard, setRevealedDeckCard] = useState<keyof typeof cardColorPalette | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => typeof window !== "undefined" && Boolean(readSavedGame()));
  const [localConfigId, setLocalConfigId] = useState(hudsonHustleCurrentConfigId);
  const [localTurnTimeLimitSeconds, setLocalTurnTimeLimitSeconds] = useState(0);
  const [localBotPlayerIds, setLocalBotPlayerIds] = useState<string[]>([]);
  const localMap = useMemo(() => getHudsonHustleMapByConfigId(localConfigId), [localConfigId]);
  const localVisuals = useMemo(() => getHudsonHustleVisualsByConfigId(localConfigId), [localConfigId]);
  const localConfigBundle = getHudsonHustleRegisteredConfig(localConfigId);
  const localConfigMeta = localConfigBundle?.meta ?? hudsonHustleCurrentConfigMeta;

  useEffect(() => {
    if (!game) {
      return;
    }
    window.localStorage.setItem(saveKey, JSON.stringify(game));
    setHasSavedGame(true);
  }, [game]);

  const currentPlayer = game ? getCurrentPlayer(game) : null;
  const isCurrentPlayerLocalBot = currentPlayer ? localBotPlayerIds.includes(currentPlayer.id) : false;
  const pendingTickets = currentPlayer?.pendingTickets ?? [];

  useEffect(() => {
    if (!game || pendingTickets.length === 0) {
      setSelectedTicketIds([]);
      return;
    }

    const minimumKeep = game.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pendingTickets.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [game, pendingTickets]);

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

          setSelectedRouteId(null);
          setSelectedCityId(null);
          setRevealedDeckCard(null);
          setError(null);
          setVisibility(nextGame.phase === "gameOver" ? "visible" : "handoff");
          return nextGame;
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Local bot could not complete its turn.");
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
    setRevealedDeckCard(null);
    setError(null);
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
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
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
        onOpenGuide={() => setGuideOpen(true)}
        onBack={onReturnToGateway}
        releasedConfigs={hudsonHustleReleasedConfigs}
        initialConfigId={localConfigId}
      />
    );
  }

  const activePlayer = getCurrentPlayer(game);
  const canTakeTurnAction = visibility === "visible" && game.phase === "main" && game.turn.stage === "idle";
  const marketDisabled = visibility !== "visible" || game.phase !== "main" || game.turn.stage === "awaitingHandoff";
  const currentCity = selectedCityId ? localMap.cities.find((city) => city.id === selectedCityId) : null;
  const currentCityOccupied = currentCity ? game.stations.some((station) => station.cityId === currentCity.id) : false;
  const currentRoute = selectedRouteId ? localMap.routes.find((route) => route.id === selectedRouteId) : null;
  const currentRouteClaim = currentRoute ? game.routeClaims.find((claim) => claim.routeId === currentRoute.id) : null;
  const currentRouteOwner = currentRouteClaim ? game.players.find((player) => player.id === currentRouteClaim.playerId) : null;
  const localBannerTone =
    error ? "failure" : game.phase === "gameOver" ? "neutral" : visibility === "postTurn" ? "warning" : visibility === "handoff" ? "waiting" : "active";
  const localBannerEyebrow =
    game.phase === "gameOver" ? "Final scores" : visibility === "postTurn" ? "Turn complete" : visibility === "handoff" ? "Next player" : "Local turn";
  const localBannerHeadline =
    error
      ? "Local game needs attention."
      : game.phase === "gameOver"
        ? "Match complete."
        : visibility === "postTurn"
          ? `${activePlayer.name}, pass the laptop.`
          : visibility === "handoff"
            ? `${activePlayer.name}, take over.`
            : `${activePlayer.name}, make your move.`;
  const localBannerCopy = error
    ? error
    : game.phase === "gameOver"
      ? "Review the final table, then head back to setup when you are ready for another match."
      : visibility === "postTurn"
        ? game.turn.summary ?? "Your action is locked in. End the handoff once the next player is ready."
        : visibility === "handoff"
          ? "The board is safe to view. Private hands and tickets remain hidden until the next player continues."
          : game.turn.stage === "drawing"
            ? "Finish the current draw before taking another action."
            : game.turn.stage === "awaitingHandoff"
              ? "Your action is complete. End the turn to pass the laptop."
              : "Claim a route, build a station, or draw tickets on this turn.";

  return (
    <div className="app-shell" data-config-theme={localVisuals.theme}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Hudson Hustle</p>
          <h1>{localMap.name}</h1>
          <div className="utility-pill-group">
            <div className="config-hover-card">
              <UtilityPill
                label="Config"
                value={`${localConfigMeta.version} · ${localConfigId}`}
                tone="accent"
              />
              <span className="config-summary-tooltip">{localConfigMeta.summary}</span>
            </div>
          </div>
          <StatusBanner
            tone={localBannerTone}
            eyebrow={localBannerEyebrow}
            headline={localBannerHeadline}
            copy={localBannerCopy}
            timerLabel={
              game.phase === "gameOver"
                ? "Final"
                : visibility === "handoff"
                  ? "Hidden"
                  : localTurnTimeLimitSeconds === 0
                    ? "Untimed"
                    : `Timer ${localTurnTimeLimitSeconds}s`
            }
          />
        </div>
        <div className="topbar-actions">
          <ScoreGuide />
          <Button onClick={() => setGuideOpen(true)}>
            Guide
          </Button>
          <Button onClick={resetGame}>
            Back to setup
          </Button>
        </div>
      </header>

      <div className={`game-layout ${visibility !== "visible" ? "game-layout--obscured" : ""}`}>
        <aside className="side-panel">
          <Panel variant="status">
            <SectionHeader
              eyebrow="Table status"
              title="Round table"
              meta={game.phase === "gameOver" ? "Final score" : `${activePlayer.name}'s turn`}
              density="ceremony"
            />
            <div className="scoreboard">
              {game.players.map((player, index) => (
                <article key={player.id} className={`player-strip ${index === game.activePlayerIndex ? "player-strip--active" : ""}`}>
                  <span className="player-swatch row-object__lead" style={{ background: playerColorPalette[player.color] }} />
                  <div className="row-object__main">
                    <strong className="row-object__title">{player.name}</strong>
                    <span className="row-object__meta">{player.tickets.length} tickets</span>
                  </div>
                  <div className="row-object__stats">
                    <span className="row-object__stat row-object__stat--strong">{player.score} pts</span>
                    <span className="row-object__stat">{player.trainsLeft} trains</span>
                    <span className="row-object__stat">{player.stationsLeft} stations</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          {visibility === "visible" ? (
            <>
              <div className="side-panel__private-stack">
                <Panel variant="private-info">
                  <SectionHeader title="Hand" meta={`${activePlayer.hand.length} cards`} density="compact" />
                  <div className="card-grid">
                    {activePlayer.hand.map((card) => (
                      <TransitCard key={card.id} className="artifact-card artifact-card--hand" color={card.color} context="hand" />
                    ))}
                  </div>
                </Panel>

                <Panel variant="private-info">
                  <SectionHeader
                    title="Tickets"
                    meta={`${ticketProgress.filter((entry) => entry.completed).length}/${ticketProgress.length} connected`}
                    density="compact"
                  />
                  <div className="ticket-stack">
                    {ticketProgress.map(({ ticket, completed }) => (
                      <div key={ticket.id} className={`ticket-row ${completed ? "ticket-row--done" : ""}`}>
                        <div className="row-object__lead">
                          <Chip className={`ticket-status ${completed ? "ticket-status--done" : ""}`} tone={completed ? "success" : "warning"}>
                            {completed ? "Connected" : "Pending"}
                          </Chip>
                        </div>
                        <div className="row-object__main">
                          <span className="row-object__title ticket-route__cities">
                            {getCityName(localMap, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(localMap, ticket.to)}
                          </span>
                        </div>
                        <div className="row-object__stats">
                          <strong className="ticket-points row-object__stat row-object__stat--strong">{ticket.points}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </>
          ) : (
            <Panel variant="alert" className="hidden-panel">
              <SectionHeader eyebrow="Privacy shield" title="Private info hidden" density="standard" />
              <p>The next player should only see the public board until they click `I'm ready`.</p>
            </Panel>
          )}

          <Panel variant="neutral" className="side-panel__supply-panel">
            <SectionHeader title="Market" meta={`${game.trainDeck.length} deck`} density="compact" />
            <div className="market-grid">
              {game.market.map((card, index) => (
                <TransitCard
                  key={card.id}
                  className="market-card artifact-card artifact-card--market"
                  color={card.color}
                  context="market"
                  disabled={marketDisabled}
                  onClick={() => applyAction({ type: "draw_card", source: "market", marketIndex: index })}
                  tag={card.color === "locomotive" ? "Ends draw" : undefined}
                />
              ))}
            </div>
            <Button disabled={marketDisabled} onClick={() => applyAction({ type: "draw_card", source: "deck" })}>
              Draw from deck
            </Button>
          </Panel>
        </aside>

        <main className="board-column">
          <Panel variant="neutral" className="board-panel">
            <SectionHeader eyebrow="Public board" title="Board" meta="Click a route or city to inspect actions" />
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
              onSelectRoute={(routeId) => {
                setSelectedRouteId(routeId);
                setSelectedCityId(null);
              }}
              onSelectCity={(cityId) => {
                setSelectedCityId(cityId);
                setSelectedRouteId(null);
              }}
            />
          </Panel>

          <Panel variant="status" className="action-panel">
            <SectionHeader eyebrow="Turn controls" title="Action rail" meta={game.turn.summary ?? "Choose one action for this turn."} />
            {error ? (
              <StateSurface
                tone="failure"
                eyebrow="Action issue"
                headline="This move could not complete."
                copy={error}
              />
            ) : null}

            {game.phase === "main" && visibility === "visible" && !currentRoute && !currentCity ? (
              <StateSurface
                tone="neutral"
                eyebrow="Inspect the board"
                headline="Select a route or city."
                copy="The action rail will show legal payments and build options once you inspect a board element."
                testId="action-empty-state"
              />
            ) : null}

            {game.phase === "gameOver" ? (
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
            ) : null}

            {game.phase === "main" && visibility === "visible" ? (
              <div className="action-rail">
                <Button disabled={!canTakeTurnAction} onClick={() => applyAction({ type: "draw_tickets" })}>
                  Draw tickets
                </Button>
                <Button disabled>
                  Score updates automatically
                </Button>
              </div>
            ) : null}

            {currentRoute && game.phase === "main" && visibility === "visible" ? (
              <SurfaceCard
                variant="detail"
                className="detail-card"
                data-detail-kind="route"
                eyebrow="Route detail"
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
                    {currentRouteOwner ? `Claimed by ${currentRouteOwner.name}.` : "Choose a payment color to claim this segment."}
                  </p>
                </div>
                <div className="detail-card__decision-shelf chip-row">
                  {routeOptions.length > 0 ? (
                    routeOptions.map((color) => (
                      <ChoiceChipButton
                        key={color}
                        style={{ ["--choice-chip-accent" as string]: cardColorPalette[color] }}
                        disabled={!canTakeTurnAction}
                        onClick={() => applyAction({ type: "claim_route", routeId: currentRoute.id, color })}
                      >
                        Claim with {color}
                      </ChoiceChipButton>
                    ))
                  ) : (
                    <span className="muted-copy">{currentRouteUnavailableReason}</span>
                  )}
                </div>
              </SurfaceCard>
            ) : null}

            {currentCity && game.phase === "main" && visibility === "visible" ? (
              <SurfaceCard variant="detail" className="detail-card" eyebrow="City detail" title={currentCity.name}>
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">station city</span>
                    <span className="detail-card__fact">borrow 1 rival link</span>
                    <span className="detail-card__fact">endgame only</span>
                  </div>
                  <p className="detail-card__prompt">Choose a payment color to build a station here.</p>
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
                        onClick={() => applyAction({ type: "build_station", cityId: currentCity.id, color })}
                      >
                        Build with {color}
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
          </Panel>
        </main>
      </div>

      {visibility === "postTurn" && game.phase !== "gameOver" ? (
        <ModalShell width="md" align="center">
            <SectionHeader eyebrow="Turn complete" title={`${activePlayer.name}, pass the laptop.`} density="ceremony" />
            <p>{game.turn.summary ?? "Your action is locked in."}</p>
            <Button variant="primary" onClick={() => applyAction({ type: "advance_turn" })}>
              I&apos;m done
            </Button>
        </ModalShell>
      ) : null}

      {visibility === "handoff" && game.phase !== "gameOver" ? (
        <ModalShell width="md" align="center">
            <SectionHeader eyebrow="Next player" title={`${activePlayer.name}, take over.`} density="ceremony" />
            <p>The board is safe to look at. Private cards and tickets stay hidden until you are ready.</p>
            <Button variant="primary" onClick={() => setVisibility("visible")}>
              I&apos;m ready
            </Button>
        </ModalShell>
      ) : null}

      {pendingTickets.length > 0 && visibility === "visible" && !isCurrentPlayerLocalBot ? (
        <TicketPicker
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
    </div>
  );
}
