import type { ReactNode } from "react";
import type { StatusBannerTone } from "./StatusBanner";

interface StateSurfaceProps {
  tone?: StatusBannerTone;
  eyebrow: string;
  headline: string;
  copy?: string | null;
  action?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
  testId?: string;
}

export function StateSurface({
  tone = "neutral",
  eyebrow,
  headline,
  copy,
  action,
  rightSlot,
  className,
  testId
}: StateSurfaceProps): JSX.Element {
  const classes = ["state-surface", `state-surface--${tone}`, className].filter(Boolean).join(" ");

  return (
    <section className={classes} data-testid={testId}>
      <div className="state-surface__body">
        <span className="state-surface__eyebrow">{eyebrow}</span>
        <strong className="state-surface__headline">{headline}</strong>
        {copy ? <span className="state-surface__copy">{copy}</span> : null}
      </div>
      {rightSlot ? <div className="state-surface__aside">{rightSlot}</div> : null}
      {action ? <div className="state-surface__actions">{action}</div> : null}
    </section>
  );
}
