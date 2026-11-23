import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useDialogFocus } from "../primitives/useDialogFocus";

interface FloatingBuildPanelProps {
  children: ReactNode;
  onClose: () => void;
  anchor?: { x: number; y: number } | null;
  /** On a phone: a sheet along the bottom edge that can be dragged down to close, instead of a card by the tap. */
  sheet?: boolean;
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

export function FloatingBuildPanel({ children, onClose, anchor = null, sheet = false, className = "" }: FloatingBuildPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor || sheet || !ref.current) {
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
  }, [anchor?.x, anchor?.y, sheet]);

  // Focus goes into the panel when it opens and back to the route or station that opened it when it closes.
  useDialogFocus(ref, { onEscape: onClose });

  // Dragging the sheet down follows the finger; past a third of its height, or a quick flick, lets it go.
  const drag = useRef<{ startY: number; startTime: number } | null>(null);
  const [pull, setPull] = useState<number | null>(null);
  const grip = sheet
    ? {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          drag.current = { startY: event.clientY, startTime: event.timeStamp };
          event.currentTarget.setPointerCapture(event.pointerId);
          setPull(0);
        },
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          if (drag.current) setPull(Math.max(0, event.clientY - drag.current.startY));
        },
        onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
          const start = drag.current;
          drag.current = null;
          if (!start) return;
          const distance = Math.max(0, event.clientY - start.startY);
          const speed = distance / Math.max(1, event.timeStamp - start.startTime);
          const height = ref.current?.offsetHeight ?? 240;
          setPull(null);
          if (distance > height / 3 || speed > 0.6) onClose();
        },
        onPointerCancel: () => {
          drag.current = null;
          setPull(null);
        }
      }
    : null;

  const style: React.CSSProperties = sheet
    ? pull === null
      ? {}
      : { transform: `translateY(${pull}px)`, transition: "none" }
    : pos
    ? { position: "fixed", top: pos.top, left: pos.left }
    : {};

  return (
    <div
      ref={ref}
      className={["floating-build-panel", sheet ? "floating-build-panel--sheet" : "", className].filter(Boolean).join(" ")}
      role="dialog"
      aria-label="Build options"
      style={style}
    >
      {grip ? <div className="floating-build-panel__grip" aria-hidden="true" {...grip} /> : null}
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
