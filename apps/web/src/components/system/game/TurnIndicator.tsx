interface TurnIndicatorProps {
  playerName: string;
  secondsRemaining?: number | null;
}

export function TurnIndicator({ playerName, secondsRemaining }: TurnIndicatorProps): JSX.Element {
  return (
    <div className="turn-indicator">
      <span className="turn-indicator__name">{playerName}</span>
      <span className="turn-indicator__label">active</span>
      {secondsRemaining != null && (
        <span className="turn-indicator__timer">{secondsRemaining}s</span>
      )}
    </div>
  );
}
