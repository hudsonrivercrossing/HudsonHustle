interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: string;
  className?: string;
}

export function SectionHeader({ eyebrow, title, meta, className }: SectionHeaderProps): JSX.Element {
  const classes = ["section-header", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {eyebrow ? <span className="section-header__eyebrow">{eyebrow}</span> : null}
      <div className="section-header__row">
        <h2 className="section-header__title">{title}</h2>
        {meta ? <span className="section-header__meta">{meta}</span> : null}
      </div>
    </div>
  );
}
