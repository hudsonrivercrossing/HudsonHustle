import { DepartureBoardTile } from "../setup";

interface OnlineGatewayProps {
  onStartGame: () => void;
  onJoinRoom: () => void;
}

export function OnlineGateway({ onStartGame, onJoinRoom }: OnlineGatewayProps): JSX.Element {
  return (
    <div className="setup-entry-grid setup-entry-grid--artifacts" data-testid="online-mode-gateway">
      <DepartureBoardTile
        onClick={onStartGame}
        testId="online-start-game"
        ariaLabel="Start an online room"
        kicker="Host flow"
        code="START_"
        copy="Seat the table, pick the board, then share the code."
        status="Room board"
      />
      <DepartureBoardTile
        onClick={onJoinRoom}
        testId="online-join-room"
        ariaLabel="Join an online room"
        kicker="Guest flow"
        code="JOIN__"
        copy="Preview the table, claim a seat, and board."
        status="Code ticket"
      />
    </div>
  );
}
