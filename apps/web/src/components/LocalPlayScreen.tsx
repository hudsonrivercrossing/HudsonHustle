import { useEffect, useMemo, useState } from "react";
import {
  getAffordableRouteColors,
  getAffordableStationColors,
  getCityName,
  getCurrentPlayer,
  getTicketProgress,
  reduceGame,
  startGame,
  summarizeEndgame,
  type GameAction,
  type GameState
} from "@hudson-hustle/game-core";
import {
  cardColorPalette,
  hudsonHustleBackdrop,
  hudsonHustleCurrentBackdropMode,
  hudsonHustleCurrentBoardLabelMode,
  hudsonHustleCurrentConfigId,
  hudsonHustleCurrentConfigMeta,
  hudsonHustleCurrentTheme,
  hudsonHustleMap,
  playerColorPalette
} from "@hudson-hustle/game-data";
import { BoardMap } from "./BoardMap";
import { OnboardingTutorial, type TutorialStep } from "./OnboardingTutorial";
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
const tutorialSeenKey = "hudson-hustle-onboarding-v1-1";

type VisibilityMode = "visible" | "postTurn" | "handoff";

interface LocalPlayScreenProps {
  onOpenMultiplayer: () => void;
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
      "The round table shows score, trains left, stations left, and ticket counts for every player. This is where you feel late-game pressure.",
    keyPoints: [
      "The final round starts when a player ends a turn with two or fewer trains left.",
      "Unused stations are worth points, so building one is a tradeoff.",
      "Ticket counts can hint at who is still chasing risky plans."
    ],
    tip: "Before drawing more tickets, glance at train counts so you do not overcommit late.",
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

export function LocalPlayScreen({ onOpenMultiplayer, onReturnToGateway }: LocalPlayScreenProps): JSX.Element {
  const [game, setGame] = useState<GameState | null>(null);
  const [visibility, setVisibility] = useState<VisibilityMode>("visible");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [revealedDeckCard, setRevealedDeckCard] = useState<keyof typeof cardColorPalette | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorialStepIndex, setTutorialStepIndex] = useState<number | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => typeof window !== "undefined" && Boolean(readSavedGame()));

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

  const currentPlayer = game ? getCurrentPlayer(game) : null;
  const pendingTickets = currentPlayer?.pendingTickets ?? [];

  useEffect(() => {
    if (!game || pendingTickets.length === 0) {
      setSelectedTicketIds([]);
      return;
    }

    const minimumKeep = game.phase === "initialTickets" ? 2 : 1;
    setSelectedTicketIds(pendingTickets.slice(0, minimumKeep).map((ticket) => ticket.id));
  }, [game, pendingTickets]);

  const routeOptions = useMemo(() => {
    if (!game || !selectedRouteId) {
      return [];
    }
    return getAffordableRouteColors(game, hudsonHustleMap, selectedRouteId);
  }, [game, selectedRouteId]);

  const stationOptions = useMemo(() => {
    if (!game || !selectedCityId) {
      return [];
    }
    return getAffordableStationColors(game, hudsonHustleMap);
  }, [game, selectedCityId]);

  const ticketProgress = useMemo(() => {
    if (!game || !currentPlayer) {
      return [];
    }

    return getTicketProgress(game, hudsonHustleMap, currentPlayer.id).sort(
      (left, right) => Number(left.completed) - Number(right.completed)
    );
  }, [currentPlayer, game]);

  const currentRouteUnavailableReason = useMemo(() => {
    if (!game || !selectedRouteId) {
      return null;
    }

    const currentRoute = hudsonHustleMap.routes.find((route) => route.id === selectedRouteId);
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
      const twinIds = hudsonHustleMap.routes
        .filter((route) => route.twinGroup === currentRoute.twinGroup && route.id !== currentRoute.id)
        .map((route) => route.id);
      const twinClaim = game.routeClaims.find((claim) => twinIds.includes(claim.routeId));
      if (twinClaim) {
        const twinOwner = game.players.find((player) => player.id === twinClaim.playerId);
        return `This parallel route is unavailable in a ${game.players.length}-player game because its twin is already claimed${twinOwner ? ` by ${twinOwner.name}` : ""}.`;
      }
    }

    return "No affordable claim options right now.";
  }, [game, selectedRouteId]);

  function startNewGame(playerNames: string[]) {
    const nextGame = startGame(hudsonHustleMap, { playerNames });
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
    setVisibility("visible");
    setSelectedRouteId(null);
    setSelectedCityId(null);
    setSelectedTicketIds([]);
    setRevealedDeckCard(null);
    setError(null);
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
      const nextGame = reduceGame(game, action, hudsonHustleMap);
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
          onOpenMultiplayer={onOpenMultiplayer}
          onBack={onReturnToGateway}
          configLabel={`${hudsonHustleCurrentConfigMeta.version} · ${hudsonHustleCurrentConfigId}`}
          configSummary={hudsonHustleCurrentConfigMeta.summary}
        />
        {tutorial}
      </>
    );
  }

  const activePlayer = getCurrentPlayer(game);
  const tutorialTarget = tutorialStepIndex !== null ? tutorialSteps[tutorialStepIndex].target : null;
  const canTakeTurnAction = visibility === "visible" && game.phase === "main" && game.turn.stage === "idle";
  const marketDisabled = visibility !== "visible" || game.phase !== "main" || game.turn.stage === "awaitingHandoff";
  const currentCity = selectedCityId ? hudsonHustleMap.cities.find((city) => city.id === selectedCityId) : null;
  const currentCityOccupied = currentCity ? game.stations.some((station) => station.cityId === currentCity.id) : false;
  const currentRoute = selectedRouteId ? hudsonHustleMap.routes.find((route) => route.id === selectedRouteId) : null;
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
    <div className="app-shell" data-config-theme={hudsonHustleCurrentTheme}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Hudson Hustle</p>
          <h1>{hudsonHustleMap.name}</h1>
          <div className="utility-pill-group">
            <div className="config-hover-card">
              <UtilityPill
                label="Config"
                value={`${hudsonHustleCurrentConfigMeta.version} · ${hudsonHustleCurrentConfigId}`}
                tone="accent"
              />
              <span className="config-summary-tooltip">{hudsonHustleCurrentConfigMeta.summary}</span>
            </div>
          </div>
          <StatusBanner
            tone={localBannerTone}
            eyebrow={localBannerEyebrow}
            headline={localBannerHeadline}
            copy={localBannerCopy}
            timerLabel={game.phase === "gameOver" ? "Final" : visibility === "handoff" ? "Hidden" : null}
          />
        </div>
        <div className="topbar-actions">
          <Button onClick={openTutorial}>
            Tutorial
          </Button>
          <Button onClick={resetGame}>
            Back to setup
          </Button>
        </div>
      </header>

      <div className={`game-layout ${visibility !== "visible" ? "game-layout--obscured" : ""} ${tutorialTarget ? "game-layout--tutorial" : ""}`}>
        <aside className="side-panel">
          <Panel variant="status" className={tutorialTarget === "scoreboard" ? "panel--tutorial-focus" : ""}>
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
                <Panel variant="private-info" className={tutorialTarget === "hand" ? "panel--tutorial-focus" : ""}>
                  <SectionHeader title="Hand" meta={`${activePlayer.hand.length} cards`} density="compact" />
                  <div className="card-grid">
                    {activePlayer.hand.map((card) => (
                      <TransitCard key={card.id} className="artifact-card artifact-card--hand" color={card.color} context="hand" />
                    ))}
                  </div>
                </Panel>

                <Panel variant="private-info" className={tutorialTarget === "hand" ? "panel--tutorial-focus" : ""}>
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
                            {getCityName(hudsonHustleMap, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(hudsonHustleMap, ticket.to)}
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

          <Panel variant="neutral" className={`side-panel__supply-panel ${tutorialTarget === "market" ? "panel--tutorial-focus" : ""}`}>
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
          <Panel variant="neutral" className={`board-panel ${tutorialTarget === "board" ? "panel--tutorial-focus" : ""}`}>
            <SectionHeader eyebrow="Public board" title="Board" meta="Click a route or city to inspect actions" />
            <BoardMap
              config={hudsonHustleMap}
              backdrop={hudsonHustleBackdrop}
              backdropMode={hudsonHustleCurrentBackdropMode}
              boardLabelMode={hudsonHustleCurrentBoardLabelMode}
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

          <Panel variant="status" className={`action-panel ${tutorialTarget === "action" ? "panel--tutorial-focus" : ""}`}>
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
                    <div className="endgame-breakdown">
                      {summarizeEndgame(player, hudsonHustleMap).map((line) => {
                        const [label, ...valueParts] = line.split(":");
                        const value = valueParts.join(":").trim();
                        return (
                          <div key={line} className="endgame-breakdown__row">
                            <span className="endgame-breakdown__label">{label}</span>
                            <span className="endgame-breakdown__value">{value || line}</span>
                          </div>
                        );
                      })}
                    </div>
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
                eyebrow="Route detail"
                title={`${getCityName(hudsonHustleMap, currentRoute.from)} → ${getCityName(hudsonHustleMap, currentRoute.to)}`}
              >
                <div className="detail-card__summary">
                  <div className="detail-card__facts">
                    <span className="detail-card__fact">{currentRoute.length} train{currentRoute.length === 1 ? "" : "s"}</span>
                    <span className="detail-card__fact">{currentRoute.type}</span>
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

      {pendingTickets.length > 0 && visibility === "visible" ? (
        <TicketPicker
          title={game.phase === "initialTickets" ? `${activePlayer.name}, choose starting tickets` : `${activePlayer.name}, keep new tickets`}
          subtitle={
            game.phase === "initialTickets"
              ? "Keep at least two. Anything you return is gone for this game."
              : "Keep at least one. This counts as your full turn."
          }
          tickets={pendingTickets}
          config={hudsonHustleMap}
          minimumKeep={game.phase === "initialTickets" ? 2 : 1}
          selectedIds={selectedTicketIds}
          onCancel={game.phase === "ticketChoice" ? () => applyAction({ type: "cancel_ticket_draw" }) : undefined}
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

      {tutorial}
    </div>
  );
}
