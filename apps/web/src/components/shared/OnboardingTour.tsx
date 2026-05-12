import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/primitives/Button";

const TOUR_SEEN_KEY = "hh-tour-seen";
const CALLOUT_WIDTH = 320;
const CALLOUT_GAP = 14;
const SPOTLIGHT_PADDING = 8;

export function shouldShowTour(): boolean {
  return !localStorage.getItem(TOUR_SEEN_KEY);
}

interface TourStep {
  eyebrow: string;
  title: string;
  body: string;
  target: string;
}

const tourSteps: TourStep[] = [
  {
    eyebrow: "Tickets",
    title: "Your hidden route plan",
    body: "Every ticket is a private destination contract — wire two stations together to bank the printed points. Skip the connection and those points subtract from your final tally.",
    target: "tickets",
  },
  {
    eyebrow: "Hand",
    title: "Stack matching transit cards",
    body: "Your hand is the fare you'll pay for routes. Collect cards in the colors your tickets need; locomotives ride any line as wild cards.",
    target: "hand",
  },
  {
    eyebrow: "Market",
    title: "Pull from the platform",
    body: "Two face-up cards per turn from the market, or grab one locomotive (it costs your whole turn). Empty seat? Draw blind from the deck and hope for a useful color.",
    target: "market",
  },
  {
    eyebrow: "Board",
    title: "Claim a route",
    body: "Tap any line on the map, pick a payment color in the popup, and pay the fare. Longer routes cost more cards but pay back far more in points.",
    target: "board",
  },
  {
    eyebrow: "Stations",
    title: "Drop your emergency stop",
    body: "Click a city instead of a route to plant a station. You only get a few stations all game — they let you borrow one of another player's claimed routes when you're boxed out.",
    target: "board",
  },
  {
    eyebrow: "Turn",
    title: "One move, then pass",
    body: "Each turn picks exactly one action: draw transit cards, claim a route, build a station, or draw new tickets. Watch the clock — when it runs out, your turn ends.",
    target: "turn",
  },
  {
    eyebrow: "Roster",
    title: "Track the table",
    body: "The roster shows every rider's trains, stations, ticket count, and score. Glance here often to read what your opponents are planning.",
    target: "roster",
  },
  {
    eyebrow: "Endgame",
    title: "Last stop coming",
    body: "When any player drops to two trains or fewer, every other rider gets one more turn — then final scoring locks in completed tickets, route points, and station leftovers.",
    target: "roster",
  },
];

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

function computeCallout(spot: SpotlightRect): CalloutPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  const spaceRight = vw - (spot.left + spot.width + SPOTLIGHT_PADDING);
  const spaceLeft = spot.left - SPOTLIGHT_PADDING;

  // Prefer horizontal placement
  if (spaceRight >= CALLOUT_WIDTH + CALLOUT_GAP) {
    const idealTop = spot.top + spot.height / 2 - 120;
    return {
      top: Math.max(margin, Math.min(idealTop, vh - 260 - margin)),
      left: spot.left + spot.width + SPOTLIGHT_PADDING + CALLOUT_GAP,
      arrowSide: "left",
    };
  }
  if (spaceLeft >= CALLOUT_WIDTH + CALLOUT_GAP) {
    const idealTop = spot.top + spot.height / 2 - 120;
    return {
      top: Math.max(margin, Math.min(idealTop, vh - 260 - margin)),
      right: vw - (spot.left - SPOTLIGHT_PADDING - CALLOUT_GAP),
      arrowSide: "right",
    };
  }
  // Fall back to above the target
  const idealLeft = spot.left + spot.width / 2 - CALLOUT_WIDTH / 2;
  return {
    bottom: vh - (spot.top - SPOTLIGHT_PADDING - CALLOUT_GAP),
    left: Math.max(margin, Math.min(idealLeft, vw - CALLOUT_WIDTH - margin)),
    arrowSide: "bottom",
  };
}

interface OnboardingTourProps {
  onDismiss: () => void;
}

export default function OnboardingTour({ onDismiss }: OnboardingTourProps): JSX.Element {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotRect, setSpotRect] = useState<SpotlightRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  function handleDismiss() {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
    onDismiss();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    observerRef.current?.disconnect();

    const el = document.querySelector<HTMLElement>(`[data-tour-target="${step.target}"]`);
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
  }, [step.target]);

  const placement = spotRect ? computeCallout(spotRect) : null;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Game tour">
      {spotRect && (
        <div
          className="tour-spotlight"
          style={{
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
          }}
        />
      )}

      <div
        className={[
          "tour-callout",
          placement?.arrowSide ? `tour-callout--arrow-${placement.arrowSide}` : "",
          !spotRect ? "tour-callout--centered" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          placement
            ? {
                top: placement.top !== undefined ? placement.top : "auto",
                bottom: placement.bottom !== undefined ? placement.bottom : "auto",
                left: placement.left !== undefined ? placement.left : "auto",
                right: placement.right !== undefined ? placement.right : "auto",
              }
            : undefined
        }
      >
        <div className="tour-callout__header">
          <span className="tour-callout__eyebrow">{step.eyebrow}</span>
          <span className="tour-callout__counter">
            {stepIndex + 1} / {tourSteps.length}
          </span>
        </div>

        <h2 className="tour-callout__title">{step.title}</h2>
        <p className="tour-callout__body">{step.body}</p>

        <div className="tour-dots" aria-hidden="true">
          {tourSteps.map((_, i) => (
            <span
              key={i}
              className={i === stepIndex ? "tour-dots__dot tour-dots__dot--active" : "tour-dots__dot"}
            />
          ))}
        </div>

        <footer className="tour-callout__footer">
          <Button onClick={handleDismiss} variant="ghost">
            Skip
          </Button>
          <div className="tour-callout__forward">
            {stepIndex > 0 && (
              <Button onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button variant="primary" onClick={handleDismiss}>
                Start playing
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setStepIndex((i) => i + 1)}>
                Next
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
