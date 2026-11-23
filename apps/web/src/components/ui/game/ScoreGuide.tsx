import { useEffect, useId, useRef, useState } from "react";
import { ROUTE_POINTS } from "@hudson-hustle/game-core";
import { Button } from "../primitives/Button";

interface ScoreGuideProps {
  className?: string;
  label?: string;
  tooltipLabel?: string;
}

const routePointRows = Object.entries(ROUTE_POINTS).map(([length, points]) => `${length} train${length === "1" ? "" : "s"} = ${points} point${points === 1 ? "" : "s"}`);

export function ScoreGuide({ className, label = "Scoring", tooltipLabel }: ScoreGuideProps): JSX.Element {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const classes = ["score-guide", open ? "score-guide--open" : "", className].filter(Boolean).join(" ");

  // Open, it closes on Escape or on a press anywhere else. It works the same with a mouse, a finger or keys.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={classes} ref={rootRef}>
      <Button
        className="score-guide__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={tooltipLabel ?? label}
        data-label={tooltipLabel}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </Button>
      <div id={panelId} className="score-guide__panel" role="note" hidden={!open}>
        <p className="score-guide__eyebrow">Final scoring</p>
        <div className="score-guide__section">
          <strong className="score-guide__heading">Route points</strong>
          <ul className="score-guide__list">
            {routePointRows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
        <div className="score-guide__section">
          <strong className="score-guide__heading">Endgame</strong>
          <ul className="score-guide__list">
            <li>Completed tickets: add printed points.</li>
            <li>Incomplete tickets: subtract printed points.</li>
            <li>Unused stations: +4 each.</li>
            <li>Longest continuous network: +10. Ties each get the bonus.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
