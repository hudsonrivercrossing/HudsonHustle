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
            <article key={player.id} className={`player-strip player-roster__row ${isActive ? "player-strip--active" : ""}`}>
              <span className="player-swatch row-object__lead" style={{ background: playerPalette[player.color] }} />
              {slotTimer ? <span className="player-roster__timer">{slotTimer}</span> : null}
              <div className="row-object__main">
                <strong className="row-object__title">{player.name}</strong>
                <span className="row-object__meta">{isActive ? "Active" : `${player.tickets?.length ?? player.ticketCount ?? 0} tickets`}</span>
              </div>
              <div className="row-object__stats">
                <span className="row-object__stat">{player.trainsLeft} trains</span>
                <span className="row-object__stat">{player.stationsLeft} stations</span>
              </div>
            </article>
          ) : (
            <article key={`empty-seat-${index}`} className="player-strip player-roster__row player-roster__row--placeholder" aria-label="Empty player slot">
              <span className="player-swatch row-object__lead" />
              <div className="row-object__main">
                <strong className="row-object__title">Open</strong>
                <span className="row-object__meta">Seat {index + 1}</span>
              </div>
            </article>
          );
        })}
      </div>
      <span className="player-roster__active-label">{players[activePlayerIndex]?.name ?? "Player"} active{timerLabel ? ` · ${timerLabel}` : ""}</span>
    </Panel>
  );
}

export function formatCardLabel(color: TrainCardFace): string {
  if (color === "locomotive") {
    return "Locomotive";
  }
  return color
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
            <div
              key={face}
              className={[
                "hand-color-slot",
                `hand-color-slot--${face}`,
                count === 0 ? "hand-color-slot--empty" : "",
                spendCount > 0 ? "hand-color-slot--spending" : ""
              ].filter(Boolean).join(" ")}
              style={{ ["--hand-slot-color" as string]: slotColor }}
            >
              <span className="hand-color-slot__count">{paymentPreview && spendCount > 0 ? afterCount : count}</span>
              <span className="hand-color-slot__label">{formatCardLabel(face)}</span>
              <span className={`hand-color-slot__spend ${spendCount > 0 ? "" : "hand-color-slot__spend--empty"}`}>
                {spendCount > 0 ? `-${spendCount}` : "0"}
              </span>
            </div>
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
          <button
            key={ticket.id}
            type="button"
            className={[
              "ticket-row",
              "ticket-row--button",
              completed ? "ticket-row--done ticket-row--compact" : "",
              focusedTicketId === ticket.id || pinnedTicketId === ticket.id ? "ticket-row--focused" : ""
            ].filter(Boolean).join(" ")}
            onMouseEnter={() => onFocusTicket?.(ticket)}
            onMouseLeave={() => onFocusTicket?.(null)}
            onFocus={() => onFocusTicket?.(ticket)}
            onBlur={() => onFocusTicket?.(null)}
            onClick={() => onTogglePinnedTicket?.(ticket)}
          >
            <span className={`ticket-status row-object__lead ${completed ? "ticket-status--done" : ""}`}>
              {completed ? "Done" : "Open"}
            </span>
            <div className="row-object__main">
              <span className="row-object__title ticket-route__cities">
                {getCityName(config, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(config, ticket.to)}
              </span>
            </div>
            <div className="row-object__stats">
              <strong className="ticket-points row-object__stat row-object__stat--strong">{ticket.points}</strong>
            </div>
          </button>
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
            eyebrow="Private choice"
            title={title}
            meta={`Keep ${minimumKeep}+ · ${selectedCount}/${tickets.length}`}
            density="compact"
          />

          <div className="ticket-picker__tray">
            <div className="ticket-list">
              {tickets.map((ticket) => {
                const selected = selectedIds.includes(ticket.id);
                const focused = focusedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    className={[
                      "ticket-row",
                      "ticket-row--button",
                      "ticket-row--choice",
                      selected ? "ticket-row--selected" : "",
                      focused ? "ticket-row--focused" : ""
                    ].filter(Boolean).join(" ")}
                    onMouseEnter={() => onFocusTicket?.(ticket)}
                    onMouseLeave={() => onFocusTicket?.(null)}
                    onFocus={() => onFocusTicket?.(ticket)}
                    onBlur={() => onFocusTicket?.(null)}
                    onClick={() => onToggle(ticket.id)}
                  >
                    <span className={`ticket-status row-object__lead ${selected ? "ticket-status--done" : ""}`}>
                      {selected ? "Keep" : "Review"}
                    </span>
                    <div className="row-object__main">
                      <span className="row-object__title ticket-route__cities">
                        {getCityName(config, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(config, ticket.to)}
                      </span>
                    </div>
                    <div className="row-object__stats">
                      <strong className="ticket-points row-object__stat row-object__stat--strong">{ticket.points}</strong>
                    </div>
                  </button>
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

function MarketColorSlot({
  card,
  disabled,
  cardPalette,
  onClick
}: {
  card: TrainCard;
  disabled: boolean;
  cardPalette: Record<string, string>;
  onClick: () => void;
}): JSX.Element {
  const slotColor = card.color === "locomotive" ? "#91a8bd" : cardPalette[card.color];

  return (
    <button
      type="button"
      className={`market-color-slot market-color-slot--${card.color}`}
      style={{ ["--hand-slot-color" as string]: slotColor }}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="market-color-slot__count">{card.color === "locomotive" ? "L" : "1"}</span>
      <span className="market-color-slot__label">{formatCardLabel(card.color)}</span>
    </button>
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
    <Panel variant="neutral" className={["supply-dock", className].filter(Boolean).join(" ")}>
      <SectionHeader title="Market" meta={`${deckCount} deck`} density="compact" />
      <div className="market-grid supply-dock__market">
        {market.map((card, index) => (
          <MarketColorSlot
            key={card.id}
            card={card}
            cardPalette={cardPalette}
            disabled={disabled || Boolean(isMarketCardDisabled?.(card, index))}
            onClick={() => onDrawFromMarket(index)}
          />
        ))}
      </div>
      <Button disabled={disabled} onClick={onDrawFromDeck}>
        Draw from deck
      </Button>
      {onDrawTickets ? (
        <Button className="supply-dock__draw-tickets" disabled={drawTicketsDisabled} onClick={onDrawTickets}>
          Draw tickets
        </Button>
      ) : null}
    </Panel>
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
}

export function InspectorDock({
  summary,
  className = "",
  marketContent,
  buildContent,
  activeBuildKey = null,
  chatMessages = [],
  onSendChat
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
      <div className="inspector-tabs" role="tablist" aria-label="Right rail modules">
        <button
          type="button"
          className={`inspector-tabs__tab ${activeTab === "market" ? "inspector-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={activeTab === "market"}
          onClick={() => setActiveTab("market")}
        >
          Market
        </button>
        <button
          type="button"
          className={`inspector-tabs__tab ${activeTab === "build" ? "inspector-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={activeTab === "build"}
          onClick={() => setActiveTab("build")}
        >
          Build
        </button>
        <button
          type="button"
          className={`inspector-tabs__tab ${activeTab === "chat" ? "inspector-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
      </div>
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
            <SectionHeader title="Chat" meta="Reserved channel" density="compact" />
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
                  {onSendChat ? "No room messages yet." : "Chat is reserved for multiplayer rooms."}
                </p>
              )}
            </div>
            <div className="chat-panel__composer" aria-label="Chat composer">
              <input
                type="text"
                placeholder="Message room"
                value={chatDraft}
                maxLength={280}
                disabled={!onSendChat}
                onChange={(event) => setChatDraft(event.target.value)}
              />
              <Button disabled={!onSendChat || chatDraft.trim().length === 0}>Send</Button>
            </div>
          </form>
        </div>
      )}
    </Panel>
  );
}

export type GameplayNotification = {
  id: string;
  message: string;
  tone?: "neutral" | "success" | "warning";
};

interface NotificationPipeProps {
  notifications: GameplayNotification[];
}

export function NotificationPipe({ notifications }: NotificationPipeProps): JSX.Element {
  return (
    <div className="notification-pipe" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={[
            "notification-pipe__item",
            notification.tone ? `notification-pipe__item--${notification.tone}` : ""
          ].filter(Boolean).join(" ")}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

interface GameOverLayerProps {
  title: string;
  subtitle: string;
  actions: ReactNode;
  children: ReactNode;
}

export function GameOverLayer({ title, subtitle, actions, children }: GameOverLayerProps): JSX.Element {
  return (
    <section className="game-over-layer" aria-label="Final scoreboard">
      <div className="game-over-layer__header">
        <SectionHeader eyebrow="Game over" title={title} density="ceremony" />
        <p>{subtitle}</p>
        <div className="game-over-layer__actions">{actions}</div>
      </div>
      <div className="game-over-layer__scores">{children}</div>
    </section>
  );
}
