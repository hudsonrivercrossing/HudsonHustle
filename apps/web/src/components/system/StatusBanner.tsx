import type { ReactNode } from "react";
import type { StatusBannerTone } from "../../design/tokens";

interface StatusBannerProps {
  tone?: StatusBannerTone;
  eyebrow: string;
  headline: string;
  copy?: string | null;
  timerLabel?: string | null;
  className?: string;
  testId?: string;
  rightSlot?: ReactNode;
}

/**
 * @deprecated Gameplay no longer uses this banner. Keep temporarily for setup/lobby comparison.
 */
export function StatusBanner({
  tone = "neutral",
  eyebrow,
  headline,
  copy,
  timerLabel,
  className,
  testId,
  rightSlot
}: StatusBannerProps): JSX.Element {
  const classes = ["status-banner", `status-banner--${tone}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} data-testid={testId}>
      <div>
        <span className="status-banner__eyebrow">{eyebrow}</span>
        <strong className="status-banner__headline">{headline}</strong>
        {copy ? <span className="status-banner__copy">{copy}</span> : null}
      </div>
      {rightSlot ?? timerLabel ? (
        <span className="status-banner__timer" data-testid={testId === "turn-status-banner" ? "turn-timer-badge" : undefined}>
          {rightSlot ?? timerLabel}
        </span>
      ) : null}
    </div>
  );
}
