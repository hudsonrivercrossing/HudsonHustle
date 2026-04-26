import type { ReactNode } from "react";
import { Button } from "../system/Button";

export type SetupStepStatus = "current" | "complete" | "upcoming";

export interface SetupStep {
  label: string;
  meta: string;
  status: SetupStepStatus;
}

interface SetupShellProps {
  eyebrow: string;
  title: string;
  lead: string;
  backgroundImageUrl: string;
  steps: SetupStep[];
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
  steps,
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

export function SetupStepper({ steps }: { steps: SetupStep[] }): JSX.Element {
  return (
    <ol className="setup-stepper" aria-label="Setup progress">
      {steps.map((step, index) => (
        <li key={step.label} className={`setup-stepper__item setup-stepper__item--${step.status}`}>
          <span className="setup-stepper__marker">{step.status === "complete" ? "OK" : `0${index + 1}`}</span>
          <span className="setup-stepper__line" aria-hidden="true" />
          <span className="setup-stepper__copy">
            <strong>{step.label}</strong>
            <span>{step.meta}</span>
          </span>
          <em>{step.status === "current" ? "Now" : step.status === "complete" ? "Done" : "Next"}</em>
        </li>
      ))}
    </ol>
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

interface TicketSlipProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "disabled" | "active";
  className?: string;
  ariaLabel?: string;
}

export function TicketSlip({ label, value, detail, tone = "neutral", className, ariaLabel }: TicketSlipProps): JSX.Element {
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
    <button type="button" className={classes} disabled={disabled} data-testid={testId} onClick={onClick}>
      {label}
    </button>
  );
}

interface MapThumbnailProps {
  configId: string;
  mapName: string;
  version?: string;
}

export function MapThumbnail({ configId, mapName, version }: MapThumbnailProps): JSX.Element {
  const isBerlin = configId.toLowerCase().includes("berlin") || mapName.toLowerCase().includes("berlin");
  const shortLabel = isBerlin ? "Berlin" : "NYC / NJ";
  return (
    <div className={`map-thumbnail ${isBerlin ? "map-thumbnail--berlin" : "map-thumbnail--hudson"}`} aria-label={`${mapName} map preview`}>
      <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
        <path className="map-thumbnail__water" d={isBerlin ? "M0 94 C62 74 112 126 173 103 C218 86 244 75 320 94 L320 180 L0 180 Z" : "M122 0 C104 36 109 72 96 104 C84 132 58 150 45 180 L0 180 L0 0 Z"} />
        <path className="map-thumbnail__route map-thumbnail__route--a" d={isBerlin ? "M38 128 C86 82 133 70 185 92 C225 108 248 83 286 48" : "M42 132 C93 102 132 83 177 92 C220 101 248 74 286 41"} />
        <path className="map-thumbnail__route map-thumbnail__route--b" d={isBerlin ? "M54 48 C92 73 109 112 158 124 C204 136 235 122 286 137" : "M70 39 C113 54 132 92 163 116 C199 144 233 134 279 128"} />
        <path className="map-thumbnail__route map-thumbnail__route--c" d={isBerlin ? "M89 151 C119 116 125 71 158 43 C188 18 226 28 265 63" : "M109 158 C125 118 145 84 171 53 C194 26 238 25 279 54"} />
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
