import { Button } from "./system/Button";
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
            <p className="tutorial-progress-note">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <div className="tutorial-step-list">
              {steps.map((entry, index) => (
                <Button
                  key={entry.id}
                  className={`tutorial-step-link ${index === stepIndex ? "tutorial-step-link--active" : ""}`}
                  onClick={() => onJumpTo(index)}
                >
                  <span className="tutorial-step-link__index">{index + 1}</span>
                  <span>{entry.title}</span>
                </Button>
              ))}
            </div>
          </aside>

          <div className="tutorial-main">
            <div className="tutorial-hero">
              <div className="tutorial-header">
                <SectionHeader eyebrow="Guided tutorial" title={step.title} density="ceremony" />
                <Button onClick={onClose}>
                  Skip tutorial
                </Button>
              </div>
              <p className="tutorial-copy tutorial-copy--hero">{step.summary}</p>
            </div>

            <div className="tutorial-progress" aria-hidden="true">
              {steps.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`tutorial-progress__dot ${index === stepIndex ? "tutorial-progress__dot--active" : ""}`}
                />
              ))}
            </div>

            <div className="tutorial-body">
              <SurfaceCard variant="detail" className="tutorial-lesson" eyebrow="Focus" title={targetLabels[step.target]}>
                <div className="tutorial-lesson__section">
                  <span className="tutorial-lesson__label">What to notice</span>
                  <ul className="tutorial-point-list">
                    {step.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </SurfaceCard>

              <SurfaceCard variant="detail" className="tutorial-tip" eyebrow="Try this" title="Suggested move">
                <p>{step.tip}</p>
              </SurfaceCard>
            </div>

            <div className="setup-actions">
              <Button disabled={isFirst} onClick={onPrevious}>
                Previous
              </Button>
              {isLast ? (
                <Button variant="primary" onClick={onClose}>
                  Finish tutorial
                </Button>
              ) : (
                <Button variant="primary" onClick={onNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
    </ModalShell>
  );
}
