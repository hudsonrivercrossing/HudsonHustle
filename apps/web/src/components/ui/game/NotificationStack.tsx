export type GameplayNotification = {
  id: string;
  message: string;
  tone?: "neutral" | "success" | "warning";
};

interface NotificationStackProps {
  notifications: GameplayNotification[];
}

export function NotificationStack({ notifications }: NotificationStackProps): JSX.Element {
  return (
    <div className="notification-pipe" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={[
            "notification-pipe__item",
            notification.tone ? `notification-pipe__item--${notification.tone}` : ""
          ].filter(Boolean).join(" ")}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}
