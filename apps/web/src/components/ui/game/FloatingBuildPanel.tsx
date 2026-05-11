import type { ReactNode } from "react";
import { Button } from "../primitives/Button";

interface FloatingBuildPanelProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export function FloatingBuildPanel({ children, onClose, className = "" }: FloatingBuildPanelProps): JSX.Element {
  return (
    <div className={["floating-build-panel", className].filter(Boolean).join(" ")} role="dialog" aria-label="Build options">
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
