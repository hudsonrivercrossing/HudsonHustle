import type { HTMLAttributes, ReactNode } from "react";

type SurfaceCardVariant = "detail" | "summary";

interface SurfaceCardProps extends HTMLAttributes<HTMLElement> {
  variant?: SurfaceCardVariant;
  eyebrow?: string;
  title: string;
  meta?: string;
  as?: "article" | "section" | "div";
  children: ReactNode;
}

export function SurfaceCard({
  variant = "detail",
  eyebrow,
  title,
  meta,
  as = "section",
  className,
  children,
  ...rest
}: SurfaceCardProps): JSX.Element {
  const Component = as;
  const classes = ["surface-card", `surface-card--${variant}`, className].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...rest}>
      <div className="surface-card__header">
        {eyebrow ? <span className="surface-card__eyebrow">{eyebrow}</span> : null}
        <div className="surface-card__row">
          <h3 className="surface-card__title">{title}</h3>
          {meta ? <span className="surface-card__meta">{meta}</span> : null}
        </div>
      </div>
      <div className="surface-card__body">{children}</div>
    </Component>
  );
}
