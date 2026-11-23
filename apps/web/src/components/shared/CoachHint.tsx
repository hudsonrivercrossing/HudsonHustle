import { useEffect, useRef, useState } from "react";
import { coachHints, markMomentSeen, readSeenMoments, turnOffTips, type CoachMoment } from "./coachHints";

const RING_PADDING = 6;

interface Ring {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CoachHintProps {
  /** What the player is doing right now; null when there is nothing worth explaining. */
  moment: CoachMoment | null;
  /** Bumped by the caller to forget what has been seen, as when the guide asks to show tips again. */
  resetToken?: number;
}

/**
 * Shows the tip for the current moment as a card at the edge of the table, never over the board,
 * and rings the part of the screen it is about. A tip is retired once it is dismissed or once the
 * player moves on from the moment it describes.
 */
export function CoachHint({ moment, resetToken = 0 }: CoachHintProps): JSX.Element | null {
  const [seen, setSeen] = useState(() => readSeenMoments());
  const [ring, setRing] = useState<Ring | null>(null);
  const shownRef = useRef<CoachMoment | null>(null);
  const active = moment && !seen.has(moment) ? moment : null;
  const hint = active ? coachHints[active] : null;

  useEffect(() => {
    setSeen(readSeenMoments());
  }, [resetToken]);

  // Acting on a tip is as good as dismissing it: once the moment has passed, do not show it again.
  useEffect(() => {
    const previous = shownRef.current;
    shownRef.current = active;
    if (previous && previous !== active) {
      setSeen(markMomentSeen(previous));
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && active) setSeen(markMomentSeen(active));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const target = hint?.target;
  useEffect(() => {
    const el = target ? document.querySelector<HTMLElement>(`[data-tour-target="${target}"]`) : null;
    if (!el) {
      setRing(null);
      return;
    }
    function measure() {
      if (!el) return;
      // An element laid out with display: contents has no box of its own; its first child stands in.
      const own = el.getBoundingClientRect();
      const box = own.width === 0 && own.height === 0 && el.firstElementChild ? el.firstElementChild.getBoundingClientRect() : own;
      setRing({ top: box.top - RING_PADDING, left: box.left - RING_PADDING, width: box.width + RING_PADDING * 2, height: box.height + RING_PADDING * 2 });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  if (!active || !hint) {
    return null;
  }

  return (
    <>
      {ring ? <div className="table-tip__ring" style={ring} aria-hidden="true" /> : null}
      <aside className="table-tip" role="status" aria-live="polite">
        <p className="table-tip__eyebrow">Tip · {hint.eyebrow}</p>
        <h2 className="table-tip__title">{hint.title}</h2>
        <p className="table-tip__body">{hint.body}</p>
        <footer className="table-tip__actions">
          <button type="button" className="table-tip__dismiss" onClick={() => setSeen(markMomentSeen(active))}>
            Got it
          </button>
          <button type="button" className="table-tip__off" onClick={() => setSeen(turnOffTips())}>
            Turn off tips
          </button>
        </footer>
      </aside>
    </>
  );
}
