import { useMemo, useState } from "react";
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
import { Button } from "../primitives/Button";
import { Panel } from "../primitives/Panel";
import { SectionHeader } from "../primitives/SectionHeader";
import { CardSlot } from "./CardSlot";
import { TicketSlip } from "./TicketSlip";

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
  if (coloredUsed > 0) spend[preview.color] = coloredUsed;
  if (minimumLocomotives + extraLocomotives > 0) spend.locomotive = minimumLocomotives + extraLocomotives;
  return spend;
}

export function PrivateHandRail({ hand, cardPalette, paymentPreview = null, className = "" }: PrivateHandRailProps): JSX.Element {
  const counts = countHandByFace(hand);
  const faces: TrainCardFace[] = [...trainCardColors, "locomotive"];
  const spend = paymentPreview ? buildPaymentSpend(counts, paymentPreview) : {};

  return (
    <Panel variant="private" className={["private-hand-rail", className].filter(Boolean).join(" ")}>
      <SectionHeader title="Hand" meta="Color counts" variant="compact" />
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
  onDrawTickets?: () => void;
  drawTicketsDisabled?: boolean;
  className?: string;
}

export function TicketDock({
  ticketProgress,
  config,
  focusedTicketId = null,
  pinnedTicketId = null,
  onFocusTicket,
  onTogglePinnedTicket,
  onDrawTickets,
  drawTicketsDisabled = false,
  className = ""
}: TicketDockProps): JSX.Element {
  const pageSize = 3;
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
    <Panel variant="private" className={["ticket-dock", className].filter(Boolean).join(" ")}>
      <div className="ticket-dock__header">
        <SectionHeader title="Tickets" meta={`${connectedCount}/${sortedTickets.length} connected`} variant="compact" />
        <div className="ticket-dock__pager" aria-label="Ticket pages">
          <Button
            variant="ghost"
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
            variant="ghost"
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
            focused={focusedTicketId === ticket.id}
            onMouseEnter={() => onFocusTicket?.(ticket)}
            onMouseLeave={() => onFocusTicket?.(null)}
            onFocus={() => onFocusTicket?.(ticket)}
            onBlur={() => onFocusTicket?.(null)}
          />
        ))}
        {Array.from({ length: Math.max(0, pageSize - visibleTickets.length) }, (_, index) => (
          <div key={`ticket-placeholder-${index}`} className="ticket-row ticket-row--placeholder" aria-hidden="true" />
        ))}
      </div>
      {onDrawTickets ? (
        <Button
          className="ticket-dock__draw"
          disabled={drawTicketsDisabled}
          onClick={onDrawTickets}
        >
          Draw tickets
        </Button>
      ) : null}
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
                    className="ticket-row--choice"
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
