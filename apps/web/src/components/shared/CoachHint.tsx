import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/primitives/Button";
import { coachHints, markMomentSeen, readSeenMoments, turnOffTips, type CoachMoment } from "./coachHints";

const CALLOUT_WIDTH = 320;
const CALLOUT_GAP = 14;
const SPOTLIGHT_PADDING = 8;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CalloutPlacement {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  arrowSide: "left" | "right" | "top" | "bottom" | null;
}

const CALLOUT_HEIGHT_ESTIMATE = 260;

function computeCallout(spot: SpotlightRect): CalloutPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  const spaceRight = vw - (spot.left + spot.width + SPOTLIGHT_PADDING);
  const spaceLeft = spot.left - SPOTLIGHT_PADDING;
  const spaceBelow = vh - (spot.top + spot.height + SPOTLIGHT_PADDING);
  const spaceAbove = spot.top - SPOTLIGHT_PADDING;

  // Prefer horizontal placement when there's room
  if (spaceRight >= CALLOUT_WIDTH + CALLOUT_GAP) {
    const idealTop = spot.top + spot.height / 2 - 120;
    return {
      top: Math.max(margin, Math.min(idealTop, vh - CALLOUT_HEIGHT_ESTIMATE - margin)),
      left: spot.left + spot.width + SPOTLIGHT_PADDING + CALLOUT_GAP,
      arrowSide: "left",
    };
  }
  if (spaceLeft >= CALLOUT_WIDTH + CALLOUT_GAP) {
    const idealTop = spot.top + spot.height / 2 - 120;
    return {
      top: Math.max(margin, Math.min(idealTop, vh - CALLOUT_HEIGHT_ESTIMATE - margin)),
      right: vw - (spot.left - SPOTLIGHT_PADDING - CALLOUT_GAP),
      arrowSide: "right",
    };
  }

  // Vertical placement — prefer whichever side has more room
  const idealLeft = spot.left + spot.width / 2 - CALLOUT_WIDTH / 2;
  const clampedLeft = Math.max(margin, Math.min(idealLeft, vw - CALLOUT_WIDTH - margin));

  if (spaceBelow >= spaceAbove && spaceBelow >= CALLOUT_HEIGHT_ESTIMATE + CALLOUT_GAP) {
    return {
      top: spot.top + spot.height + SPOTLIGHT_PADDING + CALLOUT_GAP,
      left: clampedLeft,
      arrowSide: "top",
    };
  }
  if (spaceAbove >= CALLOUT_HEIGHT_ESTIMATE + CALLOUT_GAP) {
    return {
      bottom: vh - (spot.top - SPOTLIGHT_PADDING - CALLOUT_GAP),
      left: clampedLeft,
      arrowSide: "bottom",
    };
  }

  // Nothing fits comfortably — pin to viewport bottom edge
  return {
    bottom: margin,
    left: clampedLeft,
    arrowSide: null,
  };
}

interface CoachHintProps {
  /** What the player is doing right now; null when there is nothing worth explaining. */
  moment: CoachMoment | null;
  /** Bumped by the caller to forget what has been seen, as when the guide asks to show tips again. */
  resetToken?: number;
}

/**
 * Shows the tip for the current moment beside the part of the screen it is about. The game stays
 * fully usable underneath: nothing is dimmed or blocked. A tip is retired once it is dismissed or
 * once the player moves on from the moment it describes.
 */
export function CoachHint({ moment, resetToken = 0 }: CoachHintProps): JSX.Element | null {
  const [seen, setSeen] = useState(() => readSeenMoments());
  const [spotRect, setSpotRect] = useState<SpotlightRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
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

  useEffect(() => {
    observerRef.current?.disconnect();

    if (!hint) {
      setSpotRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour-target="${hint?.target ?? ""}"]`);
    if (!el) {
      setSpotRect(null);
      return;
    }

    function measure() {
      if (!el) return;
      // display:contents elements have zero bounding rect — fall through to first child
      let target: Element = el;
      const r0 = el.getBoundingClientRect();
      if (r0.width === 0 && r0.height === 0 && el.firstElementChild) {
        target = el.firstElementChild;
      }
      const r = target.getBoundingClientRect();
      setSpotRect({
        top: r.top - SPOTLIGHT_PADDING,
        left: r.left - SPOTLIGHT_PADDING,
        width: r.width + SPOTLIGHT_PADDING * 2,
        height: r.height + SPOTLIGHT_PADDING * 2,
      });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    observerRef.current = ro;
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hint?.target]);

  if (!active || !hint) {
    return null;
  }

  const placement = spotRect ? computeCallout(spotRect) : null;

  return (
    <div className="tour-overlay" role="status" aria-live="polite">
      {spotRect ? (
        <div
          className="tour-spotlight"
          style={{ top: spotRect.top, left: spotRect.left, width: spotRect.width, height: spotRect.height }}
        />
      ) : null}

      <div
        className={["tour-callout", placement?.arrowSide ? `tour-callout--arrow-${placement.arrowSide}` : "", !spotRect ? "tour-callout--centered" : ""]
          .filter(Boolean)
          .join(" ")}
        style={
          placement
            ? {
                top: placement.top !== undefined ? placement.top : "auto",
                bottom: placement.bottom !== undefined ? placement.bottom : "auto",
                left: placement.left !== undefined ? placement.left : "auto",
                right: placement.right !== undefined ? placement.right : "auto"
              }
            : undefined
        }
      >
        <div className="tour-callout__header">
          <span className="tour-callout__eyebrow">{hint.eyebrow}</span>
        </div>
        <h2 className="tour-callout__title">{hint.title}</h2>
        <p className="tour-callout__body">{hint.body}</p>
        <footer className="tour-callout__footer">
          <Button variant="ghost" onClick={() => setSeen(turnOffTips())}>
            Turn off tips
          </Button>
          <Button variant="primary" onClick={() => setSeen(markMomentSeen(active))}>
            Got it
          </Button>
        </footer>
      </div>
    </div>
  );
}
