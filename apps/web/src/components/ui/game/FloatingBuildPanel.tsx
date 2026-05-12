import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface FloatingBuildPanelProps {
  children: ReactNode;
  onClose: () => void;
  anchor?: { x: number; y: number } | null;
  className?: string;
}

const PANEL_WIDTH = 340;
const PANEL_OFFSET = 16;
const VIEWPORT_PAD = 12;

export function FloatingBuildPanel({ children, onClose, anchor = null, className = "" }: FloatingBuildPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !ref.current) {
      setPos(null);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const w = rect.width || PANEL_WIDTH;
    const h = rect.height || 200;
    let left = anchor.x + PANEL_OFFSET;
    let top = anchor.y + PANEL_OFFSET;
    if (left + w + VIEWPORT_PAD > window.innerWidth) {
      left = anchor.x - w - PANEL_OFFSET;
    }
    if (top + h + VIEWPORT_PAD > window.innerHeight) {
      top = anchor.y - h - PANEL_OFFSET;
    }
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - w - VIEWPORT_PAD));
    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - h - VIEWPORT_PAD));
    setPos({ top, left });
  }, [anchor?.x, anchor?.y]);

  const style: React.CSSProperties = pos
    ? { position: "fixed", top: pos.top, left: pos.left, width: PANEL_WIDTH }
    : {};

  return (
    <div
      ref={ref}
      className={["floating-build-panel", className].filter(Boolean).join(" ")}
      role="dialog"
      aria-label="Build options"
      style={style}
    >
      <button
        type="button"
        className="floating-build-panel__close"
        aria-label="Close build panel"
        onClick={onClose}
      >
        ✕
      </button>
      <div className="floating-build-panel__body">
        {children}
      </div>
    </div>
  );
}
