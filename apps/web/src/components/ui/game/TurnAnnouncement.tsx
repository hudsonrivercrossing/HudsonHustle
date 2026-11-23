import { useEffect, useRef, useState } from "react";

interface TurnAnnouncementProps {
  /** True while the person at this screen may act. */
  active: boolean;
  /** Changes whenever a new turn starts, so two turns in a row for the same player both announce. */
  turnKey: string;
  color: string;
  label?: string;
}

const SHOWN_MS = 1200;

/**
 * A banner that crosses the table when the turn comes to the player at this screen.
 * It never takes clicks and it is not announced: the turn indicator is the live region.
 */
export function TurnAnnouncement({ active, turnKey, color, label = "Your turn" }: TurnAnnouncementProps): JSX.Element | null {
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const current = active ? turnKey : null;
    const before = previous.current;
    previous.current = current;
    // The first pass is the page appearing, not a turn arriving.
    if (before === undefined || !current || current === before) {
      return;
    }
    setVisibleKey(current);
    const timeout = window.setTimeout(() => setVisibleKey(null), SHOWN_MS);
    return () => window.clearTimeout(timeout);
  }, [active, turnKey]);

  if (!visibleKey) {
    return null;
  }
  return (
    <div key={visibleKey} className="turn-announcement" style={{ ["--seat-color" as string]: color }} aria-hidden="true">
      <span className="turn-announcement__label">{label}</span>
    </div>
  );
}
