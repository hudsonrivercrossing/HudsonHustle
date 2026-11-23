import type { HudsonHustleReleasedConfigSummary } from "@hudson-hustle/game-data";
import { MapThumbnail, SetupSummaryRow } from "../setup";

interface CreateRoomPreflightProps {
  hostName: string;
  playerCount: number;
  plannedBotCount: number;
  turnTimeLimitSeconds: number;
  selectedConfig: HudsonHustleReleasedConfigSummary | undefined;
  configId: string;
}

/** The room as it will be created, kept beside the form so every choice is visible at once. */
export function CreateRoomPreflight({
  hostName,
  playerCount,
  plannedBotCount,
  turnTimeLimitSeconds,
  selectedConfig,
  configId
}: CreateRoomPreflightProps): JSX.Element {
  return (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">Table preflight</span>
      <MapThumbnail configId={selectedConfig?.configId ?? configId} mapName={selectedConfig?.mapName ?? "Hudson Hustle"} version={selectedConfig?.version} />
      <div className="setup-summary-stack">
        <SetupSummaryRow label="Host" value={hostName.trim() || "Host"} />
        <SetupSummaryRow label="Seats" value={`${Math.max(1, playerCount - plannedBotCount)} human`} detail={`${plannedBotCount} bot`} />
        <SetupSummaryRow label="Map" value={selectedConfig?.mapName ?? "Map"} />
        <SetupSummaryRow label="Timer" value={turnTimeLimitSeconds === 0 ? "Untimed" : `${turnTimeLimitSeconds}s`} />
      </div>
    </div>
  );
}
