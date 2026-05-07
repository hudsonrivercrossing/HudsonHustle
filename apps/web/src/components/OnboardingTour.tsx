import { useState } from "react";
import { Button } from "./system/Button";
import "../styles/onboarding.css";

// ─── Persistence helpers ───────────────────────────────────────────────────

const TOUR_SEEN_KEY = "hh-tour-seen";

/** Returns true if the player has not yet completed the onboarding tour. */
export function shouldShowTour(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === null;
}

function markTourSeen(): void {
  localStorage.setItem(TOUR_SEEN_KEY, "1");
}

// ─── Step definitions ─────────────────────────────────────────────────────

interface TourStep {
  title: string;
  body: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Your transit cards",
    body: "Draw cards from the market to build your hand. Matching colors let you claim routes."
  },
  {
    title: "Your destination tickets",
    body: "Secret routes you must connect by game end. Complete them for bonus points — ignore them and lose points."
  },
  {
    title: "The card market",
    body: "Draw up to 2 cards per turn. Face-up cards show what's available; the deck draws blind."
  },
  {
    title: "Players at the table",
    body: "Track everyone's train count and score here. Watch who's close to running out — that starts the final round."
  },
  {
    title: "Your turn actions",
    body: "On your turn, choose exactly one: draw cards, claim a route, draw tickets, or build a station."
  }
];

const STEP_EYEBROWS = ["Hand", "Tickets", "Market", "Roster", "Actions"] as const;

const TOTAL_STEPS = TOUR_STEPS.length;

// ─── Component ────────────────────────────────────────────────────────────

export interface OnboardingTourProps {
  onDismiss: () => void;
}

export function OnboardingTour({ onDismiss }: OnboardingTourProps): JSX.Element {
  const [stepIndex, setStepIndex] = useState(0);

  const step = TOUR_STEPS[stepIndex];
  const eyebrow = STEP_EYEBROWS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;

  function handleDismiss(): void {
    markTourSeen();
    onDismiss();
  }

  function handleNext(): void {
    if (isLast) {
      handleDismiss();
    } else {
      setStepIndex((current) => current + 1);
    }
  }

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="onboarding-card">
        <p className="onboarding-card__eyebrow" aria-label={`Step ${stepIndex + 1} of ${TOTAL_STEPS} — ${eyebrow}`}>
          {eyebrow} · Step {stepIndex + 1} of {TOTAL_STEPS}
        </p>

        <h2 id="onboarding-title" className="onboarding-card__title">
          {step.title}
        </h2>

        <p className="onboarding-card__body">{step.body}</p>

        <footer className="onboarding-card__footer">
          <nav className="onboarding-dots" aria-label="Tour progress" aria-hidden="true">
            {TOUR_STEPS.map((_, index) => (
              <span
                key={index}
                className={
                  index === stepIndex
                    ? "onboarding-dots__dot onboarding-dots__dot--active"
                    : "onboarding-dots__dot"
                }
              />
            ))}
          </nav>

          <div className="onboarding-card__footer-actions">
            {isFirst && (
              <Button variant="ghost" onClick={handleDismiss}>
                Skip tour
              </Button>
            )}
            <Button variant="primary" onClick={handleNext}>
              {isLast ? "Got it" : "Next"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
