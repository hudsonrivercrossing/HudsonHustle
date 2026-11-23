import { Button } from "../ui/primitives";
import { DepartureBoardTile, SetupShell } from "../setup";

interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
  onOpenGuide: () => void;
}

export function SetupGateway({ onChooseLocal, onChooseOnline, onOpenGuide }: SetupGatewayProps): JSX.Element {
  const setupHeroImageUrl = "/setup/landing-bg.webp";

  return (
    <SetupShell
      eyebrow="NYC / NJ transit strategy"
      title="Hudson Hustle"
      lead="Choose your line"
      backgroundImageUrl={setupHeroImageUrl}
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
      >
        First time? Open the rulebook →
      </Button>
    </SetupShell>
  );
}
