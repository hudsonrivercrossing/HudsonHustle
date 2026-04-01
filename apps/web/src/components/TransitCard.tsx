import type { CSSProperties, JSX } from "react";
import { cardColorPalette } from "@hudson-hustle/game-data";

export type TransitCardColor = keyof typeof cardColorPalette;

type TransitCardProps = {
  color: TransitCardColor;
  context: "hand" | "market";
  faceLabel?: string;
  kicker?: string;
  footer?: string;
  serial?: string;
  tag?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

type CardTokenSet = {
  route: string;
  routeDark: string;
  routeLight: string;
  watermark: string;
  watermarkOpacity: number;
  fieldInk: string;
  metal?: string;
  smoke?: string;
};

const transitCardTokens: Record<TransitCardColor, CardTokenSet> = {
  crimson: {
    route: "#b4636b",
    routeDark: "#8b444e",
    routeLight: "#cf8a95",
    watermark: "signal-seal",
    watermarkOpacity: 0.03,
    fieldInk: "#fff7ef"
  },
  amber: {
    route: "#c89a49",
    routeDark: "#926927",
    routeLight: "#dbb46a",
    watermark: "ticket-punch",
    watermarkOpacity: 0.024,
    fieldInk: "#342717"
  },
  emerald: {
    route: "#3e887d",
    routeDark: "#2c6259",
    routeLight: "#71a99f",
    watermark: "harbor-grid",
    watermarkOpacity: 0.028,
    fieldInk: "#fff7ef"
  },
  cobalt: {
    route: "#586ec0",
    routeDark: "#3e4f8d",
    routeLight: "#8394d5",
    watermark: "river-crossing",
    watermarkOpacity: 0.032,
    fieldInk: "#fff7ef"
  },
  violet: {
    route: "#8167b2",
    routeDark: "#604b8b",
    routeLight: "#a38dcb",
    watermark: "express-medallion",
    watermarkOpacity: 0.03,
    fieldInk: "#fff7ef"
  },
  obsidian: {
    route: "#55606b",
    routeDark: "#39424c",
    routeLight: "#7f8894",
    watermark: "rail-rule",
    watermarkOpacity: 0.026,
    fieldInk: "#fff7ef"
  },
  ivory: {
    route: "#ddd2bb",
    routeDark: "#c3b394",
    routeLight: "#f3ecde",
    watermark: "cancellation-stamp",
    watermarkOpacity: 0.02,
    fieldInk: "#2d251d"
  },
  rose: {
    route: "#c9839f",
    routeDark: "#a1627f",
    routeLight: "#dca6bb",
    watermark: "destination-rosette",
    watermarkOpacity: 0.024,
    fieldInk: "#fff7ef"
  },
  locomotive: {
    route: "#e2cfaa",
    routeDark: "#b9975e",
    routeLight: "#f4ead0",
    watermark: "locomotive-pass",
    watermarkOpacity: 0.065,
    fieldInk: "#2d251d",
    metal: "#b08a43",
    smoke: "#5b5752"
  }
};

function formatFaceLabel(face: string): string {
  return face
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSerial(color: TransitCardColor, context: TransitCardProps["context"]): string {
  void color;
  void context;
  return "";
}

function buildWatermarkGlyph(color: TransitCardColor): JSX.Element {
  if (color === "locomotive") {
    return (
      <g>
        <circle cx="90" cy="90" r="42" className="transit-card__seal-ring transit-card__seal-ring--outer" />
        <circle cx="90" cy="90" r="30" className="transit-card__seal-ring transit-card__seal-ring--inner" />
        <circle cx="90" cy="90" r="16" className="transit-card__seal-core" />
        <path d="M90 34v22M90 124v22M34 90h22M124 90h22M50 50l16 16M114 114l16 16M130 50l-16 16M66 114l-16 16" className="transit-card__seal-mark" />
        <path d="M77 90h26M90 77v26" className="transit-card__seal-cross" />
      </g>
    );
  }

  switch (color) {
    case "cobalt":
      return (
        <g>
          <path d="M18 132L84 76L186 30" className="transit-card__watermark-stroke" />
          <path d="M18 148L92 92L186 50" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <path d="M18 116L76 64L148 34" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <circle cx="84" cy="76" r="7" className="transit-card__watermark-dot" />
          <circle cx="132" cy="54" r="5" className="transit-card__watermark-dot" />
        </g>
      );
    case "emerald":
      return (
        <g>
          <circle cx="118" cy="82" r="36" className="transit-card__watermark-ring" />
          <circle cx="118" cy="82" r="22" className="transit-card__watermark-ring transit-card__watermark-stroke--thin" />
          <path d="M82 82h72M118 46v72" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <circle cx="118" cy="82" r="6" className="transit-card__watermark-dot" />
        </g>
      );
    case "amber":
      return (
        <g>
          <path d="M28 50h136M28 78h136M28 106h112" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <circle cx="154" cy="106" r="18" className="transit-card__watermark-ring" />
          <circle cx="154" cy="106" r="8" className="transit-card__watermark-dot" />
          <path d="M138 106h32M154 90v32" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
        </g>
      );
    case "rose":
      return (
        <g>
          <circle cx="146" cy="84" r="28" className="transit-card__watermark-ring" />
          <path d="M38 128C70 102 98 90 118 86C134 82 148 84 174 96" className="transit-card__watermark-stroke" />
          <path d="M62 144C88 118 110 102 132 94C146 88 160 88 178 94" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <circle cx="146" cy="84" r="8" className="transit-card__watermark-dot" />
        </g>
      );
    case "obsidian":
      return (
        <g>
          <path d="M30 138L88 34M52 146L110 42M74 150L132 46M96 150L154 54M118 146L176 62" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <path d="M32 118h118" className="transit-card__watermark-stroke" />
          <circle cx="128" cy="118" r="6" className="transit-card__watermark-dot" />
        </g>
      );
    case "violet":
      return (
        <g>
          <circle cx="132" cy="78" r="34" className="transit-card__watermark-ring" />
          <circle cx="132" cy="78" r="20" className="transit-card__watermark-ring transit-card__watermark-stroke--thin" />
          <path d="M132 32v18M132 106v18M86 78h18M160 78h18" className="transit-card__watermark-stroke" />
          <path d="M102 48l60 60M162 48l-60 60" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
        </g>
      );
    case "ivory":
      return (
        <g>
          <path d="M24 132L86 34M48 142L110 44M72 148L134 52M96 148L158 60M120 142L182 68" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <path d="M28 118h96" className="transit-card__watermark-stroke" />
          <circle cx="126" cy="118" r="5" className="transit-card__watermark-dot" />
        </g>
      );
    case "crimson":
      return (
        <g>
          <circle cx="142" cy="72" r="30" className="transit-card__watermark-ring" />
          <circle cx="142" cy="72" r="14" className="transit-card__watermark-ring transit-card__watermark-stroke--thin" />
          <path d="M142 30v84M100 72h84" className="transit-card__watermark-stroke" />
          <path d="M112 42l60 60M172 42l-60 60" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M18 118C34 82 56 56 84 36C110 20 136 18 162 22" className="transit-card__watermark-stroke" />
          <path d="M28 144C58 114 86 94 112 84C142 72 166 70 186 72" className="transit-card__watermark-stroke transit-card__watermark-stroke--thin" />
          <circle cx="56" cy="102" r="6" className="transit-card__watermark-dot" />
          <circle cx="102" cy="66" r="6" className="transit-card__watermark-dot" />
          <circle cx="154" cy="48" r="6" className="transit-card__watermark-dot" />
        </g>
      );
  }
}

function buildCardStyle(color: TransitCardColor): CSSProperties {
  const token = transitCardTokens[color];
  return {
    "--transit-card-route": token.route,
    "--transit-card-route-dark": token.routeDark,
    "--transit-card-route-light": token.routeLight,
    "--transit-card-watermark-opacity": String(token.watermarkOpacity),
    "--transit-card-ink": "#3e3128",
    "--transit-card-field-ink": token.fieldInk,
    "--transit-card-metal": token.metal ?? "#b08a43",
    "--transit-card-smoke": token.smoke ?? "#5b5752"
  } as CSSProperties;
}

export function TransitCard({
  color,
  context,
  faceLabel,
  kicker,
  footer,
  serial,
  tag,
  disabled = false,
  className = "",
  onClick
}: TransitCardProps): JSX.Element {
  const resolvedFaceLabel = faceLabel ?? (color === "locomotive" ? "Locomotive" : formatFaceLabel(color));
  const resolvedKicker = kicker ?? (color === "locomotive" ? "Wildcard" : "");
  const resolvedFooter = footer ?? "";
  const resolvedSerial = serial ?? buildSerial(color, context);
  const resolvedStamp = "";
  const interactive = typeof onClick === "function";
  const titleSizeClass =
    resolvedFaceLabel.length >= 13 ? "transit-card__title--compact" : resolvedFaceLabel.length >= 10 ? "transit-card__title--medium" : "";
  const classes = [
    "transit-card",
    `transit-card--${context}`,
    color === "locomotive" ? "transit-card--locomotive" : "",
    interactive ? "transit-card--interactive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="transit-card__frame" aria-hidden="true" />
      <div className="transit-card__top-band">
        <span className="transit-card__kicker">{resolvedKicker}</span>
        <span className="transit-card__serial">{resolvedSerial}</span>
      </div>
      <div className="transit-card__field">
        <svg className="transit-card__watermark" viewBox="0 0 200 160" aria-hidden="true">
          {buildWatermarkGlyph(color)}
        </svg>
        <div className="transit-card__title-stack">
          <strong className={["transit-card__title", titleSizeClass].filter(Boolean).join(" ")}>{resolvedFaceLabel}</strong>
        </div>
      </div>
      <div className="transit-card__bottom-band">
        <span className="transit-card__footer">{resolvedFooter}</span>
        <span className="transit-card__stamp">{resolvedStamp}</span>
      </div>
      {tag ? <span className="transit-card__tag">{tag}</span> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={classes}
        style={buildCardStyle(color)}
        data-color={color}
        data-watermark={transitCardTokens[color].watermark}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={classes} style={buildCardStyle(color)} data-color={color} data-watermark={transitCardTokens[color].watermark}>
      {content}
    </div>
  );
}
