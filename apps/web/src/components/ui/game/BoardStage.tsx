import type { HTMLAttributes, ReactNode } from "react";
import { Panel } from "../primitives/Panel";

interface BoardStageProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  isMyTurn?: boolean;
  children: ReactNode;
}

export function BoardStage({ className = "", isMyTurn = false, children, ...rest }: BoardStageProps): JSX.Element {
  return (
    <Panel variant="neutral" className={["board-stage", isMyTurn ? "board-stage--my-turn" : "", className].filter(Boolean).join(" ")} {...rest}>
      <div className="board-stage__map">{children}</div>
    </Panel>
  );
}
