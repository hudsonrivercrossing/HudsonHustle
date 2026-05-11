import { Button } from "../ui/primitives";
import { DepartureBoardTile, SetupShell, type SetupStep } from "../setup";

interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
  onOpenGuide: () => void;
}

export function SetupGateway({ onChooseLocal, onChooseOnline, onOpenGuide }: SetupGatewayProps): JSX.Element {
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
        <DepartureBoardTile
          className="setup-entry-artifact--local"
          onClick={onChooseLocal}
          testId="gateway-local"
          ariaLabel="Choose Local mode"
          kicker="Pass-and-play"
          code="LOCAL_"
          copy="One screen. All players welcome."
          status=""
        />

        <DepartureBoardTile
          className="setup-entry-artifact--online"
          onClick={onChooseOnline}
          testId="gateway-online"
          ariaLabel="Choose Online mode"
          kicker="Start Game"
          code="ONLINE"
          copy="Create a room, claim a seat."
          status=""
        />
      </div>
      <Button
        variant="link"
        className="setup-guide-link"
        onClick={onOpenGuide}
        data-testid="gateway-onboarding"
        aria-label="Open the guide"
      >
        First time? Open the rulebook →
      </Button>
    </SetupShell>
  );
}
