import { getCityName, type MapConfig, type TicketDef } from "@hudson-hustle/game-core";
import { Button } from "../primitives/Button";
import { ModalShell } from "../primitives/ModalShell";
import { SectionHeader } from "../primitives/SectionHeader";

interface TicketPickerProps {
  title: string;
  subtitle: string;
  tickets: TicketDef[];
  config: MapConfig;
  minimumKeep: number;
  selectedIds: string[];
  onToggle: (ticketId: string) => void;
  onConfirm: () => void;
}

export function TicketPicker({
  title,
  subtitle,
  tickets,
  config,
  minimumKeep,
  selectedIds,
  onToggle,
  onConfirm
}: TicketPickerProps): JSX.Element {
  const selectedCount = selectedIds.length;

  return (
    <ModalShell width="lg" align="center" cardClassName="ticket-picker-modal">
      <div className="ticket-picker">
        <div className="ticket-picker__header">
          <SectionHeader eyebrow="Private choice" title={title} variant="ceremony" />
          <div className="ticket-picker__rule state-surface state-surface--waiting">
            <span className="ticket-picker__rule-label">Selection rule</span>
            <strong className="ticket-picker__rule-value">Keep at least {minimumKeep}</strong>
            <span className="ticket-picker__rule-note">
              {selectedCount} of {tickets.length} selected
            </span>
          </div>
        </div>

        <p className="modal-copy ticket-picker__intro">{subtitle}</p>

        <div className="ticket-picker__tray panel panel--private-info">
          <div className="ticket-list">
            {tickets.map((ticket) => {
              const selected = selectedIds.includes(ticket.id);
              return (
                <button
                  key={ticket.id}
                  className={`ticket-card artifact-card artifact-card--ticket ${selected ? "ticket-card--selected artifact-card--selected" : ""}`}
                  onClick={() => onToggle(ticket.id)}
                >
                  <span className="ticket-card__kicker">Destination ticket</span>
                  <span className="ticket-card__route">
                    {getCityName(config, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(config, ticket.to)}
                  </span>
                  <strong className="ticket-card__points">{ticket.points} pts</strong>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ticket-picker__footer">
          <p className="ticket-picker__hint">Ticket picks lock once you confirm. Review the map pairings before you keep.</p>
          <div className="setup-actions">
            <Button variant="primary" disabled={selectedCount < minimumKeep} onClick={onConfirm}>
              Keep {selectedCount} ticket{selectedCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
