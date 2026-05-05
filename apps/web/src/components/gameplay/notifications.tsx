import type { ReactNode } from "react";
import { GameOverPanel, NotificationStack, type GameplayNotification } from "../system/game";

interface NotificationPipeProps {
  notifications: GameplayNotification[];
}

export function NotificationPipe({ notifications }: NotificationPipeProps): JSX.Element {
  return <NotificationStack notifications={notifications} />;
}

interface GameOverLayerProps {
  title: string;
  subtitle: string;
  actions: ReactNode;
  children: ReactNode;
}

export function GameOverLayer({ title, subtitle, actions, children }: GameOverLayerProps): JSX.Element {
  return <GameOverPanel title={title} subtitle={subtitle} actions={actions}>{children}</GameOverPanel>;
}
