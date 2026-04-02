import { Button } from "./system/Button";
import { UtilityPill } from "./system/UtilityPill";

interface IdentityChipProps {
  reconnectToken: string;
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function IdentityChip({ reconnectToken }: IdentityChipProps): JSX.Element {
  return (
    <div className="identity-chip">
      <UtilityPill value="Reconnect token" interactive className="identity-chip__pill" />
      <div className="identity-chip__panel">
        <p className="identity-chip__label">Copy this token if you need to reconnect manually from another browser or device.</p>
        <div className="identity-chip__token-row">
          <code className="identity-chip__token">{reconnectToken}</code>
          <Button className="identity-chip__copy" onClick={() => void copyText(reconnectToken)}>
            Copy token
          </Button>
        </div>
      </div>
    </div>
  );
}
