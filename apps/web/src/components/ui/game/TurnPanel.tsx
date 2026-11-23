import { Button } from "../primitives/Button";

export type TurnPanelState =
  | { kind: "tickets"; minimumKeep: number }
  | { kind: "idle" }
  | { kind: "drawing" }
  | { kind: "finished"; summary: string | null; nextPlayerName: string; onPass: () => void }
  | { kind: "waiting"; activePlayerName: string };

interface TurnPanelProps {
  state: TurnPanelState;
  className?: string;
}

/** Tells the player at the screen what they can do right now, and ends their turn when it is over. */
export function TurnPanel({ state, className = "" }: TurnPanelProps): JSX.Element {
  return (
    <div className={["turn-panel", className].filter(Boolean).join(" ")}>
      <div className="turn-panel__body" aria-live="polite">
        {state.kind === "idle" ? (
          <p className="turn-panel__note">Draw cards, claim a route, build a station, or draw tickets.</p>
        ) : null}
        {state.kind === "drawing" ? (
          <>
            <p className="turn-panel__lead">Draw one more card.</p>
            <p className="turn-panel__note">A face-up locomotive cannot be your second card.</p>
          </>
        ) : null}
        {state.kind === "waiting" ? <p className="turn-panel__note">{state.activePlayerName} is playing. The board updates as they move.</p> : null}
        {state.kind === "finished" ? (
          <>
            <p className="turn-panel__lead">{state.summary ?? "Your action is locked in."}</p>
            <p className="turn-panel__note">Check your hand, then hand the screen over.</p>
          </>
        ) : null}
      </div>
      {state.kind === "finished" ? (
        <Button variant="primary" className="turn-panel__pass" onClick={state.onPass}>
          End turn — pass to {state.nextPlayerName}
        </Button>
      ) : null}
    </div>
  );
}
