import type { ReactNode } from "react";

export interface SeatRow {
  id: string;
  title: string;
  meta: string;
  isBot?: boolean;
  input?: ReactNode;
  action: ReactNode;
  testId?: string;
  rowClassName?: string;
}

interface SeatPlanProps {
  seats: SeatRow[];
  className?: string;
}

export function SeatPlan({ seats, className }: SeatPlanProps): JSX.Element {
  return (
    <div className={["seat-plan", className].filter(Boolean).join(" ")}>
      {seats.map(({ id, title, meta, isBot, input, action, testId, rowClassName }) => (
        <div
          key={id}
          className={["seat-plan__row", isBot ? "seat-plan__row--bot" : "", rowClassName].filter(Boolean).join(" ")}
          data-testid={testId}
        >
          <div className="seat-plan__copy">
            <strong className="seat-plan__title">{title}</strong>
            <span className="seat-plan__meta">{meta}</span>
          </div>
          {input}
          <div className="seat-choice-row">{action}</div>
        </div>
      ))}
    </div>
  );
}
