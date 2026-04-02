import type { HTMLAttributes, ReactNode } from "react";
import type { PanelVariant } from "../../design/tokens";

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "aside";
  variant?: PanelVariant;
  children: ReactNode;
}

export function Panel({
  as = "section",
  variant = "neutral",
  className,
  children,
  ...rest
}: PanelProps): JSX.Element {
  const Component = as;
  const classes = ["panel", `panel--${variant}`, className].filter(Boolean).join(" ");
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
