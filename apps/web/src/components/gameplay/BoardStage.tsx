import type { ReactNode } from "react";
import { Panel } from "../system/Panel";

interface BoardStageProps {
  className?: string;
  isMyTurn?: boolean;
  children: ReactNode;
}

export function BoardStage({ className = "", isMyTurn = false, children }: BoardStageProps): JSX.Element {
  return (
    <Panel variant="neutral" className={["board-stage", isMyTurn ? "board-stage--my-turn" : "", className].filter(Boolean).join(" ")}>
      <div className="board-stage__map">{children}</div>
    </Panel>
  );
}
