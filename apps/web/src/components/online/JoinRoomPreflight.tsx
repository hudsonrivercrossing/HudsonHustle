import type { RoomSummary } from "@hudson-hustle/game-core";
import { MapThumbnail, SetupSummaryRow, SetupTicketSlip } from "../setup";
import type { SetupFlowStep } from "./multiplayerSetup.types";

interface JoinRoomPreflightProps {
  step: SetupFlowStep;
  joinRoomCode: string;
  roomPreview: RoomSummary | null;
  openSeatCount: number;
  preferredSeatId: string | undefined;
}

export function JoinRoomPreflight({
  step,
  joinRoomCode,
  roomPreview,
  openSeatCount,
  preferredSeatId
}: JoinRoomPreflightProps): JSX.Element {
  const previewConfig = roomPreview
    ? { configId: roomPreview.configId, mapName: roomPreview.mapName, version: roomPreview.configVersion }
    : null;

  return (
    <div className="setup-preflight-card">
      <span className="setup-preflight-card__eyebrow">{roomPreview ? "Room board" : "Room ticket"}</span>
      {previewConfig ? (
        <MapThumbnail configId={previewConfig.configId} mapName={previewConfig.mapName} version={previewConfig.version} />
      ) : (
        <SetupTicketSlip ariaLabel="No room preview yet" label="Room" value={joinRoomCode || "------"} />
      )}
      {step > 0 || roomPreview ? (
        <div className="setup-summary-stack">
          <SetupSummaryRow label="Room" value={joinRoomCode || "------"} />
          {roomPreview ? <SetupSummaryRow label="Status" value={`${openSeatCount} open`} /> : null}
          {step >= 2 ? <SetupSummaryRow label="Seat" value={preferredSeatId ?? "Pick one"} /> : null}
        </div>
      ) : null}
    </div>
  );
}
