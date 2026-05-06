import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { MapThumbnail, SetupSummaryRow, SetupTicketSlip } from "../setup";
import type { SetupFlowStep } from "./multiplayerSetup.types";

interface CreateRoomPreflightProps {
  step: SetupFlowStep;
  hostName: string;
  playerCount: number;
  plannedBotCount: number;
  turnTimeLimitSeconds: number;
  selectedConfig: HudsonHustleReleasedConfigSummary | undefined;
  configId: string;
}

export function CreateRoomPreflight({
  step,
  hostName,
  playerCount,
  plannedBotCount,
  turnTimeLimitSeconds,
  selectedConfig,
  configId
}: CreateRoomPreflightProps): JSX.Element {
  return (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">{step >= 3 ? "Table preflight" : "Table ticket"}</span>
      {step >= 2 ? (
        <MapThumbnail
          configId={selectedConfig?.configId ?? configId}
          mapName={selectedConfig?.mapName ?? "Hudson Hustle"}
          version={selectedConfig?.version}
        />
      ) : (
        <SetupTicketSlip
          className="setup-room-code-plate--table"
          ariaLabel="Table setup ticket"
          label={step === 0 ? "Host" : "Seats"}
          value={step === 0 ? hostName.trim() || "Host" : `${Math.max(1, playerCount - plannedBotCount)} human`}
          detail={step >= 1 ? `${plannedBotCount} bot` : undefined}
        />
      )}
      {step >= 1 ? (
        <div className="setup-summary-stack">
          <SetupSummaryRow label="Host" value={hostName.trim() || "Host"} />
          {step >= 2 ? (
            <SetupSummaryRow
              label="Seats"
              value={`${Math.max(1, playerCount - plannedBotCount)} human`}
              detail={`${plannedBotCount} bot`}
            />
          ) : null}
          {step >= 3 ? (
            <>
              <SetupSummaryRow label="Map" value={selectedConfig?.mapName ?? "Map"} />
              <SetupSummaryRow label="Timer" value={turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
