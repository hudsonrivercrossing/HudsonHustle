import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChoiceChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function ChoiceChipButton({ className, children, type = "button", ...rest }: ChoiceChipButtonProps): JSX.Element {
  const classes = ["choice-chip-button", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} {...rest}>
      <span className="choice-chip-button__content">{children}</span>
    </button>
  );
}
