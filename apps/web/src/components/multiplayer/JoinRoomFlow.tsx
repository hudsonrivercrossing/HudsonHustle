import type { RoomSummary } from "@hudson-hustle/game-core";
import { FormField } from "../system/FormField";
import { Button } from "../system/Button";
import { MapThumbnail, SetupActions, SetupStepPanel, TokenButton } from "../setup";
import type { SetupFlowStep } from "./multiplayerSetup.types";

const ROOM_CODE_LENGTH = 6;

interface OpenSeat {
  seatId: string;
  playerName: string | null;
}

interface JoinRoomFlowProps {
  step: SetupFlowStep;
  roomPreview: RoomSummary | null;
  openSeats: OpenSeat[];
  joinRoomCode: string;
  joinPlayerName: string;
  preferredSeatId: string | undefined;
  onChangeStep: (step: SetupFlowStep) => void;
  onChangeJoinRoomCode: (v: string) => void;
  onChangeJoinPlayerName: (v: string) => void;
  onChangePreferredSeatId: (v: string | undefined) => void;
  onPreviewRoom: (code: string) => void;
  onJoinRoom: (form: { roomCode: string; playerName: string; preferredSeatId?: string }) => void;
}

export function JoinRoomFlow({
  step,
  roomPreview,
  openSeats,
  joinRoomCode,
  joinPlayerName,
  preferredSeatId,
  onChangeStep,
  onChangeJoinRoomCode,
  onChangeJoinPlayerName,
  onChangePreferredSeatId,
  onPreviewRoom,
  onJoinRoom
}: JoinRoomFlowProps): JSX.Element {
  return (
    <div className="setup-flow-grid setup-flow-grid--join" data-testid="join-room-panel">
      {step === 0 ? (
        <SetupStepPanel eyebrow="Now" title="Room code" meta="Check the table before choosing a seat">
          <div className="setup-field-grid setup-field-grid--launch">
            <FormField label="Room code" helper={`${ROOM_CODE_LENGTH}-character code`}>
              <input
                value={joinRoomCode}
                onChange={(e) => onChangeJoinRoomCode(e.target.value)}
                maxLength={ROOM_CODE_LENGTH}
                placeholder="------"
              />
            </FormField>
            <Button
              className="join-preview-button"
              disabled={joinRoomCode.length < ROOM_CODE_LENGTH}
              onClick={() => onPreviewRoom(joinRoomCode)}
            >
              Preview
            </Button>
          </div>
          {roomPreview ? (
            <div className="room-preview room-preview--ticket">
              <MapThumbnail configId={roomPreview.configId} mapName={roomPreview.mapName} version={roomPreview.configVersion} />
              <p className="muted-copy">
                {roomPreview.turnTimeLimitSeconds === 0 ? "Untimed" : `${roomPreview.turnTimeLimitSeconds}s`} · {openSeats.length} open
              </p>
            </div>
          ) : null}
        </SetupStepPanel>
      ) : null}

      {step === 1 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Seat"
          meta={roomPreview ? `${openSeats.length} open` : "Preview a room to reveal seats."}
          actions={
            <SetupActions>
              <Button onClick={() => onChangeStep(0)}>Back</Button>
              <Button
                variant="primary"
                disabled={!roomPreview || !preferredSeatId || !openSeats.some((s) => s.seatId === preferredSeatId)}
                onClick={() => onChangeStep(2)}
              >
                Enter table
              </Button>
            </SetupActions>
          }
        >
          {roomPreview ? (
            <div className="seat-choice-row">
              {openSeats.map((seat) => (
                <TokenButton
                  key={seat.seatId}
                  label={seat.seatId}
                  tone="open"
                  selected={preferredSeatId === seat.seatId}
                  onClick={() => onChangePreferredSeatId(seat.seatId)}
                />
              ))}
            </div>
          ) : null}
          {roomPreview && openSeats.length === 0 ? (
            <p className="muted-copy room-preview__empty">No open human seats left in this room.</p>
          ) : null}
        </SetupStepPanel>
      ) : null}

      {step === 2 ? (
        <SetupStepPanel
          eyebrow="Now"
          title="Enter room"
          meta="Name the seat and enter"
          actions={
            <SetupActions>
              <Button onClick={() => onChangeStep(1)}>Back</Button>
              <Button
                variant="primary"
                onClick={() =>
                  onJoinRoom({
                    roomCode: joinRoomCode,
                    playerName: joinPlayerName.trim() || "Player",
                    preferredSeatId
                  })
                }
              >
                Join room
              </Button>
            </SetupActions>
          }
        >
          <FormField label="Your name">
            <input value={joinPlayerName} maxLength={24} onChange={(e) => onChangeJoinPlayerName(e.target.value)} />
          </FormField>
        </SetupStepPanel>
      ) : null}
    </div>
  );
}
