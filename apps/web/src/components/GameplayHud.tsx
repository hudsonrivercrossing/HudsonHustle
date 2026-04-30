import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getCityName,
  trainCardColors,
  type MapConfig,
  type TicketDef,
  type TicketProgress,
  type TrainCard,
  type TrainCardColor,
  type TrainCardFace
} from "@hudson-hustle/game-core";
import { Button } from "./system/Button";
import { Panel } from "./system/Panel";
import { SectionHeader } from "./system/SectionHeader";
import {
  CardSlot,
  GameOverPanel,
  NotificationStack,
  SeatTile,
  SideTabRail,
  TicketSlip,
  formatCardLabel,
  type GameplayNotification
} from "./system/game";

export { formatCardLabel, type GameplayNotification } from "./system/game";

type InspectorTab = "market" | "build" | "chat";

type PlayerRosterEntry = {
  id: string;
  name: string;
  color: string;
  trainsLeft: number;
  stationsLeft: number;
  tickets?: unknown[];
  ticketCount?: number;
};

type PlayerRosterTimer = {
  activePlayerIndex: number;
  secondsRemaining: number | null;
} | null;

interface PlayerRosterProps {
  players: PlayerRosterEntry[];
  activePlayerIndex: number;
  playerPalette: Record<string, string>;
  timer?: PlayerRosterTimer;
  className?: string;
}

function formatRosterTimer(secondsRemaining: number | null): string | null {
  if (secondsRemaining === null) {
    return null;
  }
  return String(Math.max(0, Math.min(99, Math.ceil(secondsRemaining)))).padStart(2, "0");
}

export function PlayerRoster({ players, activePlayerIndex, playerPalette, timer = null, className = "" }: PlayerRosterProps): JSX.Element {
  const rosterSlots = Array.from({ length: 4 }, (_, index) => players[index] ?? null);
  const timerLabel = timer?.activePlayerIndex === activePlayerIndex ? formatRosterTimer(timer.secondsRemaining) : null;

  return (
    <Panel variant="status" className={["player-roster", className].filter(Boolean).join(" ")}>
      <div className="scoreboard player-roster__list">
        {rosterSlots.map((player, index) => {
          const isActive = index === activePlayerIndex;
          const slotTimer = timer?.activePlayerIndex === index ? formatRosterTimer(timer.secondsRemaining) : null;
          return player ? (
            <SeatTile
              key={player.id}
              name={player.name}
              color={playerPalette[player.color]}
              ticketCount={player.tickets?.length ?? player.ticketCount ?? 0}
              trainsLeft={player.trainsLeft}
              stationsLeft={player.stationsLeft}
              active={isActive}
              timerLabel={slotTimer}
            />
          ) : (
            <SeatTile key={`empty-seat-${index}`} placeholder seatLabel={`Seat ${index + 1}`} />
          );
        })}
      </div>
      <span className="player-roster__active-label">{players[activePlayerIndex]?.name ?? "Player"} active{timerLabel ? ` · ${timerLabel}` : ""}</span>
    </Panel>
  );
}

function countHandByFace(hand: TrainCard[]): Record<TrainCardFace, number> {
  const counts = Object.fromEntries([...trainCardColors, "locomotive"].map((color) => [color, 0])) as Record<TrainCardFace, number>;
  for (const card of hand) {
    counts[card.color] += 1;
  }
  return counts;
}

interface PrivateHandRailProps {
  hand: TrainCard[];
  cardPalette: Record<string, string>;
  paymentPreview?: {
    color: TrainCardColor;
    totalCost: number;
    minimumLocomotives?: number;
  } | null;
  className?: string;
}

function buildPaymentSpend(
  counts: Record<TrainCardFace, number>,
  preview: NonNullable<PrivateHandRailProps["paymentPreview"]>
): Partial<Record<TrainCardFace, number>> {
  const minimumLocomotives = preview.minimumLocomotives ?? 0;
  const spend: Partial<Record<TrainCardFace, number>> = {};
  const baseNeed = Math.max(0, preview.totalCost - minimumLocomotives);
  const coloredUsed = Math.min(counts[preview.color], baseNeed);
  const extraLocomotives = Math.max(0, baseNeed - coloredUsed);
  if (coloredUsed > 0) {
    spend[preview.color] = coloredUsed;
  }
  if (minimumLocomotives + extraLocomotives > 0) {
    spend.locomotive = minimumLocomotives + extraLocomotives;
  }
  return spend;
}

export function PrivateHandRail({ hand, cardPalette, paymentPreview = null, className = "" }: PrivateHandRailProps): JSX.Element {
  const counts = countHandByFace(hand);
  const faces: TrainCardFace[] = [...trainCardColors, "locomotive"];
  const spend = paymentPreview ? buildPaymentSpend(counts, paymentPreview) : {};

  return (
    <Panel variant="private-info" className={["private-hand-rail", className].filter(Boolean).join(" ")}>
      <SectionHeader title="Hand" meta="Color counts" density="compact" />
      <div className="private-hand-rail__slots">
        {faces.map((face) => {
          const count = counts[face];
          const spendCount = spend[face] ?? 0;
          const afterCount = count - spendCount;
          const slotColor = face === "locomotive" ? "#91a8bd" : cardPalette[face];
          return (
            <CardSlot
              key={face}
              mode="hand"
              face={face}
              accentColor={slotColor}
              count={paymentPreview && spendCount > 0 ? afterCount + spendCount : count}
              spendDelta={spendCount}
            />
          );
        })}
      </div>
    </Panel>
  );
}

interface TicketDockProps {
  ticketProgress: TicketProgress[];
  config: MapConfig;
  focusedTicketId?: string | null;
  pinnedTicketId?: string | null;
  onFocusTicket?: (ticket: TicketDef | null) => void;
  onTogglePinnedTicket?: (ticket: TicketDef) => void;
  className?: string;
}

export function TicketDock({
  ticketProgress,
  config,
  focusedTicketId = null,
  pinnedTicketId = null,
  onFocusTicket,
  onTogglePinnedTicket,
  className = ""
}: TicketDockProps): JSX.Element {
  const pageSize = 4;
  const [pageIndex, setPageIndex] = useState(0);
  const sortedTickets = useMemo(
    () => [...ticketProgress].sort((left, right) => Number(left.completed) - Number(right.completed)),
    [ticketProgress]
  );
  const connectedCount = sortedTickets.filter((entry) => entry.completed).length;
  const pageCount = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visibleTickets = sortedTickets.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

  return (
    <Panel variant="private-info" className={["ticket-dock", className].filter(Boolean).join(" ")}>
      <div className="ticket-dock__header">
        <SectionHeader title="Tickets" meta={`${connectedCount}/${sortedTickets.length} connected`} density="compact" />
        <div className="ticket-dock__pager" aria-label="Ticket pages">
          <Button
            className="ticket-dock__pager-button"
            disabled={safePageIndex === 0}
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          >
            ‹
          </Button>
          <span className="ticket-dock__page-label">
            {safePageIndex + 1}/{pageCount}
          </span>
          <Button
            className="ticket-dock__pager-button"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
          >
            ›
          </Button>
        </div>
      </div>
      <div className="ticket-stack ticket-dock__scroll">
        {visibleTickets.map(({ ticket, completed }) => (
          <TicketSlip
            key={ticket.id}
            fromLabel={getCityName(config, ticket.from)}
            toLabel={getCityName(config, ticket.to)}
            points={ticket.points}
            status={completed ? "connected" : "open"}
            focused={focusedTicketId === ticket.id || pinnedTicketId === ticket.id}
            onMouseEnter={() => onFocusTicket?.(ticket)}
            onMouseLeave={() => onFocusTicket?.(null)}
            onFocus={() => onFocusTicket?.(ticket)}
            onBlur={() => onFocusTicket?.(null)}
            onClick={() => onTogglePinnedTicket?.(ticket)}
          />
        ))}
        {Array.from({ length: Math.max(0, pageSize - visibleTickets.length) }, (_, index) => (
          <div key={`ticket-placeholder-${index}`} className="ticket-row ticket-row--placeholder" aria-hidden="true" />
        ))}
      </div>
    </Panel>
  );
}

interface TicketChoiceSheetProps {
  title: string;
  subtitle: string;
  tickets: TicketDef[];
  config: MapConfig;
  minimumKeep: number;
  selectedIds: string[];
  focusedTicketId?: string | null;
  onToggle: (ticketId: string) => void;
  onConfirm: () => void;
  onFocusTicket?: (ticket: TicketDef | null) => void;
}

export function TicketChoiceSheet({
  title,
  tickets,
  config,
  minimumKeep,
  selectedIds,
  focusedTicketId = null,
  onToggle,
  onConfirm,
  onFocusTicket
}: TicketChoiceSheetProps): JSX.Element {
  const selectedCount = selectedIds.length;

  return (
    <div className="ticket-choice-sheet" role="dialog" aria-label={title}>
      <div className="ticket-choice-sheet__panel">
        <div className="ticket-picker ticket-picker--rail">
          <SectionHeader
            eyebrow=" "
            title={title}
            meta={`Keep ${minimumKeep}+ · ${selectedCount}/${tickets.length}`}
            // density="compact"
          />

          <div className="ticket-picker__tray">
            <div className="ticket-list">
              {tickets.map((ticket) => {
                const selected = selectedIds.includes(ticket.id);
                const focused = focusedTicketId === ticket.id;
                return (
                  <TicketSlip
                    key={ticket.id}
                    fromLabel={getCityName(config, ticket.from)}
                    toLabel={getCityName(config, ticket.to)}
                    points={ticket.points}
                    status={selected ? "keep" : "review"}
                    focused={focused}
                    className={[
                      "ticket-row--choice",
                    ].filter(Boolean).join(" ")}
                    onMouseEnter={() => onFocusTicket?.(ticket)}
                    onMouseLeave={() => onFocusTicket?.(null)}
                    onFocus={() => onFocusTicket?.(ticket)}
                    onBlur={() => onFocusTicket?.(null)}
                    onClick={() => onToggle(ticket.id)}
                  />
                );
              })}
            </div>
          </div>

          <div className="ticket-picker__footer">
            <div className="setup-actions">
              <Button variant="primary" disabled={selectedCount < minimumKeep} onClick={onConfirm}>
                Keep {selectedCount} ticket{selectedCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SupplyDockProps {
  market: TrainCard[];
  deckCount: number;
  cardPalette: Record<string, string>;
  disabled: boolean;
  isMarketCardDisabled?: (card: TrainCard, marketIndex: number) => boolean;
  onDrawFromMarket: (marketIndex: number) => void;
  onDrawFromDeck: () => void;
  onDrawTickets?: () => void;
  drawTicketsDisabled?: boolean;
  className?: string;
}

export function SupplyDock({
  market,
  deckCount,
  cardPalette,
  disabled,
  isMarketCardDisabled,
  onDrawFromMarket,
  onDrawFromDeck,
  onDrawTickets,
  drawTicketsDisabled = false,
  className = ""
}: SupplyDockProps): JSX.Element {
  return (
    <div className={["supply-dock", className].filter(Boolean).join(" ")}>
      <SectionHeader title="Market" meta={`${deckCount} deck`} density="compact" />
      <div className="market-grid supply-dock__market">
        {market.map((card, index) => (
          <CardSlot
            key={card.id}
            mode="market"
            face={card.color}
            accentColor={card.color === "locomotive" ? "#91a8bd" : cardPalette[card.color]}
            disabled={disabled || Boolean(isMarketCardDisabled?.(card, index))}
            onClick={() => onDrawFromMarket(index)}
          />
        ))}
      </div>
      <Button className="supply-dock__draw-deck" disabled={disabled} onClick={onDrawFromDeck}>
        Draw from deck
      </Button>
      {onDrawTickets && (
        <div className="supply-dock__divider" />
      )}
      {onDrawTickets ? (
        <Button className="supply-dock__draw-tickets" disabled={drawTicketsDisabled} onClick={onDrawTickets}>
          Draw tickets
        </Button>
      ) : null}
    </div>
  );
}

interface BoardStageProps {
  className?: string;
  children: ReactNode;
}

export function BoardStage({ className = "", children }: BoardStageProps): JSX.Element {
  return (
    <Panel variant="neutral" className={["board-stage", className].filter(Boolean).join(" ")}>
      <div className="board-stage__map">{children}</div>
    </Panel>
  );
}

interface InspectorDockProps {
  summary: string | null;
  className?: string;
  marketContent: ReactNode;
  buildContent: ReactNode;
  activeBuildKey?: string | null;
  chatMessages?: Array<{ id: string; playerName: string; message: string }>;
  onSendChat?: (message: string) => void;
  turnNumber?: number;
  currentPlayerName?: string;
  deckCount?: number;
  ticketDeckCount?: number;
}

export function InspectorDock({
  summary,
  className = "",
  marketContent,
  buildContent,
  activeBuildKey = null,
  chatMessages = [],
  onSendChat,
  turnNumber,
  currentPlayerName,
  deckCount,
  ticketDeckCount
}: InspectorDockProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<InspectorTab>("market");
  const [chatDraft, setChatDraft] = useState("");

  useEffect(() => {
    if (activeBuildKey) {
      setActiveTab("build");
    }
  }, [activeBuildKey]);

  return (
    <Panel variant="status" className={["inspector-dock", `inspector-dock--${activeTab}`, className].filter(Boolean).join(" ")}>
      <SideTabRail
        ariaLabel="Right rail modules"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "market", label: "Market" },
          { id: "build", label: "Build" },
          { id: "chat", label: "Chat" }
        ]}
      />
      {summary ? <p className="inspector-dock__summary">{summary}</p> : null}
      {activeTab === "market" ? (
        <div className="inspector-dock__body" role="tabpanel" aria-label="Market">
          {marketContent}
        </div>
      ) : activeTab === "build" ? (
        <div className="inspector-dock__body" role="tabpanel" aria-label="Build">
          {buildContent}
        </div>
      ) : (
        <div className="inspector-dock__body inspector-dock__body--chat" role="tabpanel" aria-label="Chat">
          <form
            className="chat-panel"
            onSubmit={(event) => {
              event.preventDefault();
              const message = chatDraft.trim();
              if (!message || !onSendChat) {
                return;
              }
              onSendChat(message);
              setChatDraft("");
            }}
          >
            <SectionHeader title="Chat" density="compact" />
            <div className="chat-panel__messages" aria-label="Chat messages">
              {chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <p key={message.id} className="chat-panel__message">
                    <strong>{message.playerName}</strong>
                    <span>{message.message}</span>
                  </p>
                ))
              ) : (
                <p className="chat-panel__message chat-panel__message--system">
                  {onSendChat ? "No room messages yet." : "Local play — no chat."}
                </p>
              )}
            </div>
            {onSendChat ? (
              <div className="chat-panel__composer" aria-label="Chat composer">
                <input
                  type="text"
                  placeholder="Message room"
                  value={chatDraft}
                  maxLength={280}
                  onChange={(event) => setChatDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && chatDraft.trim().length > 0) {
                      event.preventDefault();
                      onSendChat(chatDraft.trim());
                      setChatDraft("");
                    }
                  }}
                />
              </div>
            ) : null}
          </form>
        </div>
      )}
      <div className="inspector-dock__footer">
        {currentPlayerName ? <span className="inspector-dock__footer-stat">{currentPlayerName}</span> : null}
        {turnNumber != null ? <span className="inspector-dock__footer-stat">Turn {turnNumber}</span> : null}
        {deckCount != null ? <span className="inspector-dock__footer-stat">{deckCount} cards</span> : null}
        {ticketDeckCount != null ? <span className="inspector-dock__footer-stat">{ticketDeckCount} tickets</span> : null}
      </div>
    </Panel>
  );
}

interface NotificationPipeProps {
  notifications: GameplayNotification[];
}

export function NotificationPipe({ notifications }: NotificationPipeProps): JSX.Element {
  return <NotificationStack notifications={notifications} />;
}

interface GameOverLayerProps {
  title: string;
  subtitle: string;
  actions: ReactNode;
  children: ReactNode;
}

export function GameOverLayer({ title, subtitle, actions, children }: GameOverLayerProps): JSX.Element {
  return <GameOverPanel title={title} subtitle={subtitle} actions={actions}>{children}</GameOverPanel>;
}
