import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "secondary", loading = false, className, children, type = "button", disabled, ...rest }: ButtonProps): JSX.Element {
  const classes = ["system-button", `${variant}-button`, loading ? "system-button--loading" : "", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} data-variant={variant} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="system-button__spinner" aria-hidden="true" />}
      <span className="system-button__content">{children}</span>
    </button>
  );
}
