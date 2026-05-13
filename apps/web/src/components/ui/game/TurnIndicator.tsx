import type { HTMLAttributes } from "react";

interface TurnIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  playerName: string;
  secondsRemaining?: number | null;
}

export function TurnIndicator({ playerName, secondsRemaining, ...rest }: TurnIndicatorProps): JSX.Element {
  return (
    <div className="turn-indicator" {...rest}>
      <span className="turn-indicator__name">{playerName}</span>
      <span className="turn-indicator__label">active</span>
      {secondsRemaining != null && (
        <span className="turn-indicator__timer">{secondsRemaining}s</span>
      )}
    </div>
  );
}
