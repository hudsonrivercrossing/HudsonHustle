import type { HTMLAttributes, ReactNode } from "react";

type ChipTone = "neutral" | "info" | "success" | "warning" | "danger";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  children: ReactNode;
}

export function Chip({ tone = "neutral", className, children, ...rest }: ChipProps): JSX.Element {
  const classes = ["system-chip", `system-chip--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
