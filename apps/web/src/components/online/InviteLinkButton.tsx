import { useEffect, useState } from "react";
import { routePath } from "../../app/routes";
import { Button } from "../ui/primitives/Button";

const CONFIRMATION_MS = 1500;

interface InviteLinkButtonProps {
  roomCode: string;
}

/** Copies a link that opens the join flow with this room's code filled in. */
export function InviteLinkButton({ roomCode }: InviteLinkButtonProps): JSX.Element {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const link = `${window.location.origin}${routePath({ name: "room", roomCode })}`;

  useEffect(() => {
    if (state !== "copied") {
      return;
    }
    const timeout = window.setTimeout(() => setState("idle"), CONFIRMATION_MS);
    return () => window.clearTimeout(timeout);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setState("copied");
    } catch {
      // Clipboard access can be refused (insecure origin, permissions): show the link to copy by hand.
      setState("manual");
    }
  }

  return (
    <div className="invite-link">
      <Button onClick={() => void copy()} aria-live="polite">
        {state === "copied" ? "Link copied" : "Copy invite link"}
      </Button>
      {state === "manual" ? (
        <input className="invite-link__manual" readOnly value={link} aria-label="Invite link" onFocus={(event) => event.currentTarget.select()} />
      ) : null}
    </div>
  );
}
