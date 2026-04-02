import type { HTMLAttributes, ReactNode } from "react";

type ModalTone = "default" | "tutorial";
type ModalWidth = "md" | "lg";
type ModalAlign = "center" | "left";

interface ModalShellProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ModalTone;
  width?: ModalWidth;
  align?: ModalAlign;
  cardClassName?: string;
  children: ReactNode;
}

export function ModalShell({
  tone = "default",
  width = "md",
  align = "center",
  className,
  cardClassName,
  children,
  ...rest
}: ModalShellProps): JSX.Element {
  const overlayClasses = ["modal-shell", `modal-shell--${tone}`, className].filter(Boolean).join(" ");
  const cardClasses = ["modal-shell__card", `modal-shell__card--${width}`, `modal-shell__card--${align}`, cardClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={overlayClasses}>
      <div className={cardClasses} {...rest}>
        {children}
      </div>
    </div>
  );
}
