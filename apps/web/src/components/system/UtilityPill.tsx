interface UtilityPillProps {
  value: string;
  label?: string;
  tone?: "neutral" | "accent";
  interactive?: boolean;
  className?: string;
}

export function UtilityPill({
  value,
  label,
  tone = "neutral",
  interactive = false,
  className
}: UtilityPillProps): JSX.Element {
  const classes = [
    "utility-pill",
    `utility-pill--${tone}`,
    interactive ? "utility-pill--interactive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {label ? <span className="utility-pill__label">{label}</span> : null}
      <span className="utility-pill__value">{value}</span>
    </span>
  );
}
