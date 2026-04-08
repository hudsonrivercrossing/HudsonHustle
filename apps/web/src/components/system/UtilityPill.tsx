interface UtilityPillProps {
  value: string;
  label?: string;
  tone?: "neutral" | "accent";
  interactive?: boolean;
  className?: string;
  testId?: string;
}

export function UtilityPill({
  value,
  label,
  tone = "neutral",
  interactive = false,
  className,
  testId
}: UtilityPillProps): JSX.Element {
  const classes = [
    "utility-pill",
    label ? "utility-pill--stacked" : "utility-pill--single",
    `utility-pill--${tone}`,
    interactive ? "utility-pill--interactive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} data-testid={testId}>
      {label ? <span className="utility-pill__label">{label}</span> : null}
      <span className="utility-pill__value">{value}</span>
    </span>
  );
}
