import type { ButtonHTMLAttributes } from "react";

export type TicketSlipStatus = "open" | "connected" | "keep" | "review";

interface TicketSlipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fromLabel: string;
  toLabel: string;
  points: number;
  status: TicketSlipStatus;
  focused?: boolean;
}

function formatStatus(status: TicketSlipStatus): string {
  switch (status) {
    case "connected":
      return "Linked";
    case "keep":
      return "Kept";
    case "review":
      return "";
    case "open":
    default:
      return "Open";
  }
}

export function TicketSlip({
  fromLabel,
  toLabel,
  points,
  status,
  focused = false,
  className,
  ...rest
}: TicketSlipProps): JSX.Element {
  const completed = status === "connected";
  const selected = status === "keep";
  const classes = [
    "ticket-row",
    "ticket-row--button",
    `ticket-row--${status}`,
    completed ? "ticket-row--done ticket-row--compact" : "",
    selected ? "ticket-row--selected" : "",
    focused ? "ticket-row--focused" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <button type="button" className={classes} {...rest}>
      <span className={`ticket-status ticket-status--${status} row-object__lead ${completed || selected ? "ticket-status--done" : ""}`}>
        {formatStatus(status)}
      </span>
      <div className="row-object__main">
        <span className="row-object__title ticket-route__cities">
          {fromLabel} <span className="ticket-arrow">to</span> {toLabel}
        </span>
      </div>
      <div className="row-object__stats">
        <strong className="ticket-points row-object__stat row-object__stat--strong">{points}</strong>
      </div>
    </button>
  );
}
