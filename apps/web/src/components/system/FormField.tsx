import type { LabelHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children, className, ...rest }: FormFieldProps): JSX.Element {
  const classes = ["field", "form-field", className].filter(Boolean).join(" ");

  return (
    <label className={classes} {...rest}>
      <span className="field__label form-field__label">{label}</span>
      <span className="field__control form-field__control">{children}</span>
    </label>
  );
}
