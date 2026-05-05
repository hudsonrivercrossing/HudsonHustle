interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: string;
  variant?: "compact" | "standard" | "ceremony";
  level?: 2 | 3;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  meta,
  variant = "standard",
  level,
  className
}: SectionHeaderProps): JSX.Element {
  const headingLevel = level ?? (variant === "compact" ? 3 : 2);
  const TitleTag = headingLevel === 3 ? "h3" : "h2";
  const classes = ["section-header", `section-header--${variant}`, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {eyebrow ? <span className="section-header__eyebrow">{eyebrow}</span> : null}
      <div className="section-header__row">
        <TitleTag className="section-header__title">{title}</TitleTag>
        {meta ? <span className="section-header__meta">{meta}</span> : null}
      </div>
    </div>
  );
}
