import type { HTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends HTMLAttributes<HTMLElement> {
  as?: "label" | "div";
  label: string;
  children: ReactNode;
  helper?: ReactNode;
}

export function FormField({ as = "label", label, children, helper, className, ...rest }: FormFieldProps): JSX.Element {
  const classes = ["field", "form-field", className].filter(Boolean).join(" ");
  const Component = as;

  return (
    <Component className={classes} {...rest}>
      <span className="field__label form-field__label">{label}</span>
      <span className="field__control form-field__control">{children}</span>
      {helper ? <span className="field__hint form-field__hint">{helper}</span> : null}
    </Component>
  );
}
