import { ModalShell } from "./system/ModalShell";
import { SectionHeader } from "./system/SectionHeader";
import { SurfaceCard } from "./system/SurfaceCard";

export type TutorialTarget = "setup" | "scoreboard" | "hand" | "market" | "board" | "action" | "handoff";

export interface TutorialStep {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tip: string;
  target: TutorialTarget;
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  stepIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onJumpTo: (index: number) => void;
}

const targetLabels: Record<TutorialTarget, string> = {
  setup: "Setup table",
  scoreboard: "Round table",
  hand: "Private hand",
  market: "Transit market",
  board: "Main board",
  action: "Action rail",
  handoff: "Handoff flow"
};

export function OnboardingTutorial({
  steps,
  stepIndex,
  onClose,
  onNext,
  onPrevious,
  onJumpTo
}: OnboardingTutorialProps): JSX.Element {
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <ModalShell tone="tutorial" width="lg" align="left" cardClassName="tutorial-card">
        <div className="tutorial-layout">
          <aside className="tutorial-nav">
            <p className="eyebrow">First game guide</p>
            <h2>Learn the board in a few minutes</h2>
            <p className="tutorial-copy">
              This walkthrough covers the key rules, where to look on screen, and what new players should notice first.
            </p>
            <div className="tutorial-step-list">
              {steps.map((entry, index) => (
                <button
                  key={entry.id}
                  className={`tutorial-step-link ${index === stepIndex ? "tutorial-step-link--active" : ""}`}
                  onClick={() => onJumpTo(index)}
                >
                  <span className="tutorial-step-link__index">{index + 1}</span>
                  <span>{entry.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="tutorial-main">
            <div className="tutorial-header">
              <SectionHeader eyebrow="Guided tutorial" title={step.title} />
              <button className="secondary-button" onClick={onClose}>
                Skip tutorial
              </button>
            </div>

            <div className="tutorial-progress" aria-hidden="true">
              {steps.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`tutorial-progress__dot ${index === stepIndex ? "tutorial-progress__dot--active" : ""}`}
                />
              ))}
            </div>

            <p className="tutorial-copy">{step.summary}</p>

            <SurfaceCard variant="detail" className="tutorial-target" eyebrow="Focus" title="Look at">
              <p>{targetLabels[step.target]}</p>
            </SurfaceCard>

            <SurfaceCard variant="detail" className="tutorial-points" eyebrow="Guide" title="Key points">
              <ul className="tutorial-point-list">
                {step.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </SurfaceCard>

            <SurfaceCard variant="detail" className="tutorial-tip" eyebrow="Try this" title="Suggested move">
              <p>{step.tip}</p>
            </SurfaceCard>

            <div className="setup-actions">
              <button className="secondary-button" disabled={isFirst} onClick={onPrevious}>
                Previous
              </button>
              {isLast ? (
                <button className="primary-button" onClick={onClose}>
                  Finish tutorial
                </button>
              ) : (
                <button className="primary-button" onClick={onNext}>
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
    </ModalShell>
  );
}
