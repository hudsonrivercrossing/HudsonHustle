import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps): JSX.Element {
  const classes = ["system-chip", `system-chip--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes} data-tone={tone} {...rest}>
      {children}
    </span>
  );
}
