import { getCityName, type MapConfig, type TicketDef, type TicketProgress } from "@hudson-hustle/game-core";

interface TableTicketsProps {
  ticketProgress: TicketProgress[];
  config: MapConfig;
  focusedTicketId?: string | null;
  pinnedTicketId?: string | null;
  onFocusTicket?: (ticket: TicketDef | null) => void;
  onTogglePinnedTicket?: (ticket: TicketDef) => void;
  onDrawTickets?: () => void;
  drawTicketsDisabled?: boolean;
}

/** The player's destination tickets, and the pile to draw more from. */
export function TableTickets({
  ticketProgress,
  config,
  focusedTicketId = null,
  pinnedTicketId = null,
  onFocusTicket,
  onTogglePinnedTicket,
  onDrawTickets,
  drawTicketsDisabled = false
}: TableTicketsProps): JSX.Element {
  const open = ticketProgress.filter((entry) => !entry.completed);
  const done = ticketProgress.filter((entry) => entry.completed);
  const connected = done.length;

  return (
    <section className="table-tickets" aria-label={`Your tickets: ${connected} of ${ticketProgress.length} connected`}>
      <ul className="table-tickets__list">
        {[...open, ...done].map(({ ticket, completed }) => {
          const pinned = pinnedTicketId === ticket.id;
          return (
            <li key={ticket.id}>
              <button
                type="button"
                className={[
                  "ticket-stub",
                  completed ? "ticket-stub--connected" : "",
                  focusedTicketId === ticket.id || pinned ? "ticket-stub--focused" : ""
                ].filter(Boolean).join(" ")}
                aria-pressed={pinned}
                aria-label={`${getCityName(config, ticket.from)} to ${getCityName(config, ticket.to)}, ${ticket.points} points, ${completed ? "connected" : "not connected yet"}. Show on the map.`}
                onMouseEnter={() => onFocusTicket?.(ticket)}
                onMouseLeave={() => onFocusTicket?.(null)}
                onFocus={() => onFocusTicket?.(ticket)}
                onBlur={() => onFocusTicket?.(null)}
                onClick={() => onTogglePinnedTicket?.(ticket)}
              >
                <span className="ticket-stub__route">
                  <span className="ticket-stub__city">{getCityName(config, ticket.from)}</span>
                  <span className="ticket-stub__city">{getCityName(config, ticket.to)}</span>
                </span>
                <span className="ticket-stub__end">
                  <span className="ticket-stub__points">{ticket.points}</span>
                  {completed ? <span className="ticket-stub__stamp">Done</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {onDrawTickets ? (
        <button type="button" className="table-tickets__deck" disabled={drawTicketsDisabled} onClick={onDrawTickets}>
          Draw tickets
        </button>
      ) : null}
    </section>
  );
}

interface TicketChoiceProps {
  title: string;
  tickets: TicketDef[];
  config: MapConfig;
  minimumKeep: number;
  selectedIds: string[];
  focusedTicketId?: string | null;
  onToggle: (ticketId: string) => void;
  onConfirm: () => void;
  onFocusTicket?: (ticket: TicketDef | null) => void;
}

/** Tickets just dealt: choose which to keep. They sit where kept tickets live, so the map stays in view. */
export function TicketChoice({ title, tickets, config, minimumKeep, selectedIds, focusedTicketId = null, onToggle, onConfirm, onFocusTicket }: TicketChoiceProps): JSX.Element {
  const kept = selectedIds.length;
  return (
    <section className="ticket-choice" role="group" aria-label={title}>
      <header className="ticket-choice__header">
        <h2 className="ticket-choice__title">{title}</h2>
        <p className="ticket-choice__rule">
          Keep at least {minimumKeep}. A ticket you keep and do not connect costs its points.
        </p>
      </header>
      <ul className="table-tickets__list">
        {tickets.map((ticket) => {
          const selected = selectedIds.includes(ticket.id);
          return (
            <li key={ticket.id}>
              <button
                type="button"
                className={[
                  "ticket-stub",
                  "ticket-stub--choice",
                  selected ? "ticket-stub--kept" : "ticket-stub--returned",
                  focusedTicketId === ticket.id ? "ticket-stub--focused" : ""
                ].filter(Boolean).join(" ")}
                aria-pressed={selected}
                aria-label={`${getCityName(config, ticket.from)} to ${getCityName(config, ticket.to)}, ${ticket.points} points. ${selected ? "Keeping" : "Returning"}.`}
                onMouseEnter={() => onFocusTicket?.(ticket)}
                onMouseLeave={() => onFocusTicket?.(null)}
                onFocus={() => onFocusTicket?.(ticket)}
                onBlur={() => onFocusTicket?.(null)}
                onClick={() => onToggle(ticket.id)}
              >
                <span className="ticket-stub__route">
                  <span className="ticket-stub__city">{getCityName(config, ticket.from)}</span>
                  <span className="ticket-stub__city">{getCityName(config, ticket.to)}</span>
                </span>
                <span className="ticket-stub__end">
                  <span className="ticket-stub__points">{ticket.points}</span>
                  <span className="ticket-stub__stamp">{selected ? "Keep" : "Return"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="ticket-choice__confirm" disabled={kept < minimumKeep} onClick={onConfirm}>
        Keep {kept} ticket{kept === 1 ? "" : "s"}
      </button>
    </section>
  );
}
