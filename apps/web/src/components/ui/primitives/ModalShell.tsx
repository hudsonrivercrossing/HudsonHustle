import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { useDialogFocus } from "./useDialogFocus";

type ModalVariant = "default" | "tutorial";
type ModalWidth = "md" | "lg";
type ModalAlign = "center" | "left";

interface ModalShellProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ModalVariant;
  width?: ModalWidth;
  align?: ModalAlign;
  cardClassName?: string;
  /** Called on Escape. Leave it out for a modal that must be answered, such as the pass-and-play handoff. */
  onDismiss?: () => void;
  children: ReactNode;
}

export function ModalShell({
  variant = "default",
  width = "md",
  align = "center",
  className,
  cardClassName,
  onDismiss,
  children,
  ...rest
}: ModalShellProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  useDialogFocus(cardRef, { trap: true, onEscape: onDismiss });

  const overlayClasses = ["modal-shell", `modal-shell--${variant}`, className].filter(Boolean).join(" ");
  const cardClasses = ["modal-shell__card", `modal-shell__card--${width}`, `modal-shell__card--${align}`, cardClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={overlayClasses}>
      <div ref={cardRef} className={cardClasses} role="dialog" aria-modal="true" tabIndex={-1} {...rest}>
        {children}
      </div>
    </div>
  );
}
