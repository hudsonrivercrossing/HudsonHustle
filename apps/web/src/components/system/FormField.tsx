import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps): JSX.Element {
  return (
    <label className="field form-field">
      <span className="field__label form-field__label">{label}</span>
      <span className="field__control form-field__control">{children}</span>
    </label>
  );
}
