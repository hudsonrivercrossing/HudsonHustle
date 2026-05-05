import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "secondary", className, children, type = "button", ...rest }: ButtonProps): JSX.Element {
  const classes = ["system-button", `${variant}-button`, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} data-variant={variant} {...rest}>
      <span className="system-button__content">{children}</span>
    </button>
  );
}
