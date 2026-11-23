import type { ReactNode } from "react";
import { Button } from "../ui/primitives/Button";

interface SetupShellProps {
  eyebrow: string;
  title: string;
  lead: string;
  backgroundImageUrl: string;
  modeSwitch?: ReactNode;
  backAction?: ReactNode;
  identitySlot?: ReactNode;
  preflight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SetupShell({
  eyebrow,
  title,
  lead,
  backgroundImageUrl,
  modeSwitch,
  backAction,
  identitySlot,
  preflight,
  children,
  className
}: SetupShellProps): JSX.Element {
  return (
    <main
      className={["setup-board-shell", className].filter(Boolean).join(" ")}
      style={{
        ["--setup-gateway-image" as string]: `url("${backgroundImageUrl}")`
      }}
    >
      <section className="setup-board">
        <aside className="setup-guide">
          <div className="setup-guide__copy">
            <p className="setup-guide__eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          {identitySlot ? <div className="setup-guide__identity">{identitySlot}</div> : null}
        </aside>

        <section className="setup-counter">
          {modeSwitch || backAction ? (
            <header className="setup-counter__header">
              {modeSwitch ? <div className="setup-counter__modes">{modeSwitch}</div> : <span />}
              {backAction ? <div className="setup-counter__back">{backAction}</div> : null}
            </header>
          ) : null}
          <div className="setup-counter__body">{children}</div>
        </section>

        {preflight ? <aside className="setup-preflight">{preflight}</aside> : null}
      </section>
    </main>
  );
}

/** One labelled group of fields inside a setup panel: seats, board, pace. */
export function SetupSection({ title, meta, children }: { title: string; meta?: string; children: ReactNode }): JSX.Element {
  return (
    <section className="setup-section">
      <header className="setup-section__header">
        <h3>{title}</h3>
        {meta ? <p>{meta}</p> : null}
      </header>
      {children}
    </section>
  );
}

interface SetupStepPanelProps {
  eyebrow: string;
  title: string;
  meta?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SetupStepPanel({ eyebrow, title, meta, children, actions, className }: SetupStepPanelProps): JSX.Element {
  return (
    <StationPlate eyebrow={eyebrow} title={title} meta={meta} actions={actions} className={className}>
      {children}
    </StationPlate>
  );
}

interface StationPlateProps {
  eyebrow: string;
  title: string;
  meta?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: "setup" | "lobby";
}

export function StationPlate({ eyebrow, title, meta, children, actions, className, variant = "setup" }: StationPlateProps): JSX.Element {
  return (
    <section className={["station-plate", `station-plate--${variant}`, "setup-step-panel", className].filter(Boolean).join(" ")}>
      <header className="setup-step-panel__header">
        <span>{eyebrow}</span>
        <div>
          <h2>{title}</h2>
          {meta ? <p>{meta}</p> : null}
        </div>
      </header>
      <div className="setup-step-panel__body">{children}</div>
      {actions ? <footer className="setup-step-panel__actions">{actions}</footer> : null}
    </section>
  );
}

interface DepartureBoardTileProps {
  kicker: string;
  code: string;
  copy: string;
  status: string;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel: string;
  testId?: string;
  className?: string;
}

export function DepartureBoardTile({
  kicker,
  code,
  copy,
  status,
  disabled = false,
  onClick,
  ariaLabel,
  testId,
  className
}: DepartureBoardTileProps): JSX.Element {
  const cells = Array.from(code.padEnd(6, " ").slice(0, 6));
  return (
    <button
      type="button"
      className={["departure-board-tile", "setup-entry-artifact", className].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <span className="departure-board-tile__kicker setup-entry-artifact__kicker">{kicker}</span>
      <span className="departure-board-tile__code setup-entry-artifact__split" aria-hidden="true">
        {cells.map((cell, index) => (
          <span key={`${cell}-${index}`}>{cell === "_" || cell === " " ? "\u00A0" : cell}</span>
        ))}
      </span>
      <span className="departure-board-tile__copy setup-entry-artifact__copy">{copy}</span>
      <em>{status}</em>
    </button>
  );
}

interface ModeSwitchProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function ModeSwitch<T extends string>({ options, value, onChange, label = "Setup mode" }: ModeSwitchProps<T>): JSX.Element {
  return (
    <div className="setup-mode-selector" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? "setup-mode-selector__button setup-mode-selector__button--active" : "setup-mode-selector__button"}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SetupSummaryRowProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function SetupSummaryRow({ label, value, detail }: SetupSummaryRowProps): JSX.Element {
  return (
    <div className="setup-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <em>{detail}</em> : null}
    </div>
  );
}

interface SetupTicketSlipProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "disabled" | "active";
  className?: string;
  ariaLabel?: string;
}

export function SetupTicketSlip({ label, value, detail, tone = "neutral", className, ariaLabel }: SetupTicketSlipProps): JSX.Element {
  return (
    <div
      className={["ticket-slip", `ticket-slip--${tone}`, "setup-room-code-plate", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <em>{detail}</em> : null}
    </div>
  );
}

interface TokenButtonProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  tone?: "human" | "bot" | "open" | "host";
  onClick?: () => void;
  testId?: string;
  className?: string;
}

export function TokenButton({
  label,
  selected = false,
  disabled = false,
  tone = "open",
  onClick,
  testId,
  className
}: TokenButtonProps): JSX.Element {
  const classes = [
    "token-button",
    `token-button--${tone}`,
    selected ? "token-button--selected chip-button--selected" : "",
    "chip-button",
    className
  ].filter(Boolean).join(" ");

  if (!onClick) {
    return <span className={classes}>{label}</span>;
  }

  return (
    <button type="button" className={classes} disabled={disabled} aria-pressed={selected} data-testid={testId} onClick={onClick}>
      {label}
    </button>
  );
}

interface MapThumbnailProps {
  configId: string;
  mapName: string;
  version?: string;
}

/** The picture and short name the map picker shows for each board. */
const mapThumbnails = {
  hudson: {
    shortLabel: "NYC / NJ",
    water: "M122 0 C104 36 109 72 96 104 C84 132 58 150 45 180 L0 180 L0 0 Z",
    routes: ["M42 132 C93 102 132 83 177 92 C220 101 248 74 286 41", "M70 39 C113 54 132 92 163 116 C199 144 233 134 279 128", "M109 158 C125 118 145 84 171 53 C194 26 238 25 279 54"]
  },
  berlin: {
    shortLabel: "Berlin",
    water: "M0 94 C62 74 112 126 173 103 C218 86 244 75 320 94 L320 180 L0 180 Z",
    routes: ["M38 128 C86 82 133 70 185 92 C225 108 248 83 286 48", "M54 48 C92 73 109 112 158 124 C204 136 235 122 286 137", "M89 151 C119 116 125 71 158 43 C188 18 226 28 265 63"]
  },
  henan: {
    shortLabel: "河南",
    water: "M0 60 C48 70 96 58 150 62 C204 66 238 58 270 40 C290 28 304 14 320 6 L320 30 C300 44 284 58 262 68 C226 82 190 80 150 78 C100 76 52 86 0 78 Z",
    routes: ["M42 132 C93 112 132 96 177 92 C220 88 250 104 279 128", "M158 43 C166 62 172 78 177 92 C182 118 186 140 190 160", "M89 151 C120 128 150 108 177 92 C204 76 240 60 286 41"]
  }
} as const;

function mapThumbnailKind(configId: string, mapName: string): keyof typeof mapThumbnails {
  const text = `${configId} ${mapName}`.toLowerCase();
  if (text.includes("berlin")) return "berlin";
  if (text.includes("henan") || text.includes("河南")) return "henan";
  return "hudson";
}

export function MapThumbnail({ configId, mapName, version }: MapThumbnailProps): JSX.Element {
  const kind = mapThumbnailKind(configId, mapName);
  const { shortLabel, water, routes } = mapThumbnails[kind];
  return (
    <div className={`map-thumbnail map-thumbnail--${kind}`} aria-label={`${mapName} map preview`}>
      <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
        <path className="map-thumbnail__water" d={water} />
        <path className="map-thumbnail__route map-thumbnail__route--a" d={routes[0]} />
        <path className="map-thumbnail__route map-thumbnail__route--b" d={routes[1]} />
        <path className="map-thumbnail__route map-thumbnail__route--c" d={routes[2]} />
        <g className="map-thumbnail__nodes">
          <circle cx="42" cy="132" r="7" />
          <circle cx="89" cy="151" r="6" />
          <circle cx="158" cy="43" r="6" />
          <circle cx="177" cy="92" r="7" />
          <circle cx="286" cy="41" r="6" />
          <circle cx="279" cy="128" r="7" />
        </g>
      </svg>
      <div className="map-thumbnail__plate">
        <span>{version ?? "Map"}</span>
        <strong>{shortLabel}</strong>
      </div>
    </div>
  );
}

export function SetupActions({ children }: { children: ReactNode }): JSX.Element {
  return <div className="setup-actions setup-actions--station">{children}</div>;
}

export function SetupBackButton({ onClick, children = "Back" }: { onClick: () => void; children?: ReactNode }): JSX.Element {
  return (
    <Button className="setup-back-button" onClick={onClick}>
      {children}
    </Button>
  );
}
