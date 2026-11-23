import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useDialogFocus } from "../primitives/useDialogFocus";

interface FloatingBuildPanelProps {
  children: ReactNode;
  onClose: () => void;
  anchor?: { x: number; y: number } | null;
  className?: string;
}

const PANEL_WIDTH = 340;
const PANEL_OFFSET = 16;
const VIEWPORT_PAD = 12;

/**
 * The height that is on screen for certain. iOS Safari can report the taller height it would have
 * with its toolbar tucked away while the toolbar is showing; the small viewport never includes it.
 */
function visibleHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const small = probe.offsetHeight;
  probe.remove();
  return small > 0 ? Math.min(small, window.innerHeight) : window.innerHeight;
}

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
    const viewHeight = visibleHeight();
    let left = anchor.x + PANEL_OFFSET;
    let top = anchor.y + PANEL_OFFSET;
    if (left + w + VIEWPORT_PAD > window.innerWidth) {
      left = anchor.x - w - PANEL_OFFSET;
    }
    if (top + h + VIEWPORT_PAD > viewHeight) {
      top = anchor.y - h - PANEL_OFFSET;
    }
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - w - VIEWPORT_PAD));
    top = Math.max(VIEWPORT_PAD, Math.min(top, viewHeight - h - VIEWPORT_PAD));
    setPos({ top, left });
  }, [anchor?.x, anchor?.y]);

  // Focus goes into the panel when it opens and back to the route or station that opened it when it closes.
  useDialogFocus(ref, { onEscape: onClose });

  const style: React.CSSProperties = pos
    ? { position: "fixed", top: pos.top, left: pos.left }
    : {};

  return (
    <div
      ref={ref}
      className={["floating-build-panel", className].filter(Boolean).join(" ")}
      role="dialog"
      aria-label="Build options"
      style={style}
    >
      <div className="floating-build-panel__body">
        {children}
      </div>
      {/* Last in the tab order: the actions come first. It is placed in the corner by CSS. */}
      <button
        type="button"
        className="floating-build-panel__close"
        aria-label="Close build panel"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}
