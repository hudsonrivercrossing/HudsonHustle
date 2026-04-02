import { getCityName, type MapConfig, type TicketDef } from "@hudson-hustle/game-core";
import { Button } from "./system/Button";
import { ModalShell } from "./system/ModalShell";
import { SectionHeader } from "./system/SectionHeader";

interface TicketPickerProps {
  title: string;
  subtitle: string;
  tickets: TicketDef[];
  config: MapConfig;
  minimumKeep: number;
  selectedIds: string[];
  onToggle: (ticketId: string) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function TicketPicker({
  title,
  subtitle,
  tickets,
  config,
  minimumKeep,
  selectedIds,
  onToggle,
  onConfirm,
  onCancel
}: TicketPickerProps): JSX.Element {
  return (
    <ModalShell width="md" align="center">
        <SectionHeader eyebrow="Private choice" title={title} meta={`Keep at least ${minimumKeep}`} />
        <p className="modal-copy">{subtitle}</p>
        <div className="ticket-list">
          {tickets.map((ticket) => {
            const selected = selectedIds.includes(ticket.id);
            return (
              <button
                key={ticket.id}
                className={`ticket-card ${selected ? "ticket-card--selected" : ""}`}
                onClick={() => onToggle(ticket.id)}
              >
                <span className="ticket-card__route">
                  {getCityName(config, ticket.from)} <span className="ticket-arrow">to</span> {getCityName(config, ticket.to)}
                </span>
                <strong className="ticket-card__points">{ticket.points} pts</strong>
              </button>
            );
          })}
        </div>
        <div className="setup-actions">
          {onCancel ? (
            <Button onClick={onCancel}>
              Back
            </Button>
          ) : null}
          <Button variant="primary" disabled={selectedIds.length < minimumKeep} onClick={onConfirm}>
            Keep {selectedIds.length} ticket{selectedIds.length === 1 ? "" : "s"}
          </Button>
        </div>
    </ModalShell>
  );
}
