interface IdentityChipProps {
  roomCode: string;
  seatId: string;
  playerSecret: string;
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function IdentityChip({ roomCode, seatId, playerSecret }: IdentityChipProps): JSX.Element {
  const copyAll = `${roomCode}\n${seatId}\n${playerSecret}`;

  return (
    <div className="identity-chip">
      <span className="identity-chip__pill">Session</span>
      <div className="identity-chip__panel">
        <div className="identity-chip__row">
          <span>Room</span>
          <code>{roomCode}</code>
          <button className="secondary-button identity-chip__copy" onClick={() => void copyText(roomCode)}>
            Copy
          </button>
        </div>
        <div className="identity-chip__row">
          <span>Seat</span>
          <code>{seatId}</code>
          <button className="secondary-button identity-chip__copy" onClick={() => void copyText(seatId)}>
            Copy
          </button>
        </div>
        <div className="identity-chip__row">
          <span>Secret</span>
          <code>{playerSecret}</code>
          <button className="secondary-button identity-chip__copy" onClick={() => void copyText(playerSecret)}>
            Copy
          </button>
        </div>
        <button className="secondary-button identity-chip__copy-all" onClick={() => void copyText(copyAll)}>
          Copy all
        </button>
      </div>
    </div>
  );
}
