import type { HTMLAttributes } from "react";

interface TurnIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Whose turn it is, from the viewer's side: "Your turn", "Waiting for Beau", "Ava's turn". */
  label: string;
  /** The clock for this turn, already worded ("24s left"), or null when the table is untimed. */
  timerLabel?: string | null;
}

export function TurnIndicator({ label, timerLabel = null, ...rest }: TurnIndicatorProps): JSX.Element {
  return (
    <div className="turn-indicator" role="status" {...rest}>
      <span className="turn-indicator__name" data-testid="turn-status-banner">
        {label}
      </span>
      {timerLabel ? (
        <span className="turn-indicator__timer" data-testid="turn-timer-badge">
          {timerLabel}
        </span>
      ) : null}
    </div>
  );
}
