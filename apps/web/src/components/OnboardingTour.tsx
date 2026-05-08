import { useState } from "react";
import { Button } from "./system/Button";
import { ModalShell } from "./system/ModalShell";

const TOUR_SEEN_KEY = "hh-tour-seen";

export function shouldShowTour(): boolean {
  return !localStorage.getItem(TOUR_SEEN_KEY);
}

interface TourStep {
  eyebrow: string;
  title: string;
  body: string;
}

const tourSteps: TourStep[] = [
  {
    eyebrow: "Hand",
    title: "Draw transit cards",
    body: "Each turn you can draw 2 transit cards from the market or deck. Locomotives are wild and count as any color. Build up sets to claim the routes on your tickets."
  },
  {
    eyebrow: "Tickets",
    title: "Follow your secret plan",
    body: "Tickets are goals — connect two cities and score the printed points at the end. Unfinished tickets subtract points, so every plan carries risk. At setup keep at least 2 of your 4."
  },
  {
    eyebrow: "Market",
    title: "Claim routes on the map",
    body: "Spend matching cards to claim a route. Tap a route on the board to see your payment options. Longer routes are worth more but cost more trains and cards."
  },
  {
    eyebrow: "Roster",
    title: "Watch what others do",
    body: "The roster shows every player's trains, stations, and ticket count. Watch train counts — when someone drops to 2 or fewer trains the final round begins."
  },
  {
    eyebrow: "Actions",
    title: "One move per turn",
    body: "Each turn pick exactly one major action: draw cards, claim a route, draw new tickets, or build a station. Then play passes to the next seat."
  }
];

interface OnboardingTourProps {
  onDismiss: () => void;
}

export default function OnboardingTour({ onDismiss }: OnboardingTourProps): JSX.Element {
  const [stepIndex, setStepIndex] = useState(0);
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  function handleDismiss() {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
    onDismiss();
  }

  return (
    <ModalShell variant="tutorial" width="md" align="left">
      <div className="tour-progress-row">
        <span className="tour-eyebrow">{step.eyebrow}</span>
        <span className="tour-step-counter">
          {stepIndex + 1} / {tourSteps.length}
        </span>
      </div>

      <h2 className="tour-title">{step.title}</h2>
      <p className="tour-body">{step.body}</p>

      <div className="tour-track" aria-hidden="true">
        {tourSteps.map((_, index) => (
          <span
            key={index}
            className={index === stepIndex ? "tour-track__dot tour-track__dot--active" : "tour-track__dot"}
          />
        ))}
      </div>

      <footer className="tour-nav">
        <Button onClick={handleDismiss} variant="ghost">
          Skip
        </Button>
        <div className="tour-nav__forward">
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
    </ModalShell>
  );
}
