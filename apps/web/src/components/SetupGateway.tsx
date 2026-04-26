import { DepartureBoardTile, SetupShell, type SetupStep } from "./setup/SetupPrimitives";

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
        <DepartureBoardTile
          className="setup-entry-artifact--local"
          onClick={onChooseLocal}
          testId="gateway-local"
          ariaLabel="Choose Local mode"
          kicker="Table mode"
          code="LOCAL_"
          copy="One screen. Human and bot seats."
          status="Pass-and-play"
        />

        <DepartureBoardTile
          className="setup-entry-artifact--online"
          onClick={onChooseOnline}
          testId="gateway-online"
          ariaLabel="Choose Online mode"
          kicker="Live room"
          code="ONLINE"
          copy="Create a room, claim a seat, start together."
          status="Room code"
        />

        <DepartureBoardTile
          className="setup-entry-artifact--rules"
          disabled
          testId="gateway-onboarding"
          ariaLabel="Rules tour coming soon"
          kicker="First ride"
          code="GUIDE_"
          copy="Learn the routes before the table opens."
          status="Boarding soon"
        />
      </div>
    </SetupShell>
  );
}
