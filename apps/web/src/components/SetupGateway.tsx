import { SetupShell, type SetupStep } from "./setup/SetupPrimitives";

interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
}

export function SetupGateway({ onChooseLocal, onChooseOnline }: SetupGatewayProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.png";
  const gatewaySteps: SetupStep[] = [
    { label: "Choose table", meta: "Local or online", status: "current" },
    { label: "Set seats", meta: "Players and bots", status: "upcoming" },
    { label: "Start route", meta: "Board preflight", status: "upcoming" }
  ];

  return (
    <SetupShell
      eyebrow="NYC / NJ transit strategy"
      title="Hudson Hustle"
      lead="Choose your line"
      backgroundImageUrl={setupHeroImageUrl}
      steps={gatewaySteps}
      className="setup-board-shell--gateway"
    >
      <div className="setup-entry-grid setup-entry-grid--gateway">
        <button
          type="button"
          className="setup-entry-artifact setup-entry-artifact--local"
          onClick={onChooseLocal}
          data-testid="gateway-local"
          aria-label="Choose Local mode"
        >
          <span className="setup-entry-artifact__kicker">Table mode</span>
          <span className="setup-entry-artifact__split" aria-hidden="true">
            <span>L</span>
            <span>O</span>
            <span>C</span>
            <span>A</span>
            <span>L</span>
            <span></span>
          </span>
          <span className="setup-entry-artifact__copy">One laptop. Human and bot seats.</span>
          <em>Pass-and-play</em>
        </button>

        <button
          type="button"
          className="setup-entry-artifact setup-entry-artifact--online"
          onClick={onChooseOnline}
          data-testid="gateway-online"
          aria-label="Choose Online mode"
        >
          <span className="setup-entry-artifact__kicker">Live room</span>
          <span className="setup-entry-artifact__split" aria-hidden="true">
            <span>O</span>
            <span>N</span>
            <span>L</span>
            <span>I</span>
            <span>N</span>
            <span>E</span>
          </span>
          <span className="setup-entry-artifact__copy">Create or join by room code.</span>
          <em>Claim a seat</em>
        </button>

        <button
          type="button"
          className="setup-entry-artifact setup-entry-artifact--rules"
          disabled
          data-testid="gateway-onboarding"
          aria-label="Rules tour coming soon"
        >
          <span className="setup-entry-artifact__kicker">First ride</span>
          <span className="setup-entry-artifact__split" aria-hidden="true">
            <span>G</span>
            <span>U</span>
            <span>I</span>
            <span>D</span>
            <span>E</span>
            <span></span>
          </span>
          <span className="setup-entry-artifact__copy">Guided rulebook table.</span>
          <em>Boarding soon</em>
        </button>
      </div>
    </SetupShell>
  );
}
