import { Button } from "../primitives/Button";
import { Panel } from "../primitives/Panel";
import { SectionHeader } from "../primitives/SectionHeader";

export type TurnPanelState =
  | { kind: "tickets"; minimumKeep: number }
  | { kind: "idle" }
  | { kind: "drawing" }
  | { kind: "finished"; summary: string | null; nextPlayerName: string; onPass: () => void }
  | { kind: "waiting"; activePlayerName: string };

interface TurnPanelProps {
  playerName: string;
  state: TurnPanelState;
  className?: string;
}

const idleOptions = ["Draw two cards", "Claim a route", "Build a station", "Draw new tickets"];

/** Tells the player at the screen what they can do right now, and ends their turn when it is over. */
export function TurnPanel({ playerName, state, className = "" }: TurnPanelProps): JSX.Element {
  return (
    <Panel variant="private" className={["chat-panel-dock", "turn-panel", className].filter(Boolean).join(" ")}>
      <SectionHeader title={state.kind === "waiting" ? `${state.activePlayerName} is playing` : `${playerName}'s turn`} variant="compact" />
      <div className="turn-panel__body" aria-live="polite">
        {state.kind === "tickets" ? (
          <p className="turn-panel__lead">
            Choose at least {state.minimumKeep === 1 ? "one ticket" : `${state.minimumKeep} tickets`} to keep.
          </p>
        ) : null}
        {state.kind === "idle" ? (
          <>
            <p className="turn-panel__lead">Take one action:</p>
            <ul className="turn-panel__options">
              {idleOptions.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </>
        ) : null}
        {state.kind === "drawing" ? (
          <>
            <p className="turn-panel__lead">Draw one more card.</p>
            <p className="turn-panel__note">A face-up locomotive cannot be your second card.</p>
          </>
        ) : null}
        {state.kind === "waiting" ? <p className="turn-panel__lead">The board updates as they move.</p> : null}
        {state.kind === "finished" ? (
          <>
            <p className="turn-panel__lead">{state.summary ?? "Your action is locked in."}</p>
            <p className="turn-panel__note">Check your hand, then hand the laptop over.</p>
          </>
        ) : null}
      </div>
      {state.kind === "finished" ? (
        <Button variant="primary" className="turn-panel__pass" onClick={state.onPass}>
          End turn — pass to {state.nextPlayerName}
        </Button>
      ) : null}
    </Panel>
  );
}
