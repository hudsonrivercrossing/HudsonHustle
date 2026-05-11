import type { MapConfig, TrainCardColor } from "@hudson-hustle/game-core";
import { getCityName } from "@hudson-hustle/game-core";
import { ChoiceChipButton } from "../ui/primitives/ChoiceChipButton";
import { SurfaceCard } from "../ui/primitives/SurfaceCard";
import { formatCardLabel } from "../GameplayHud";

interface RouteDef {
  id: string;
  from: string;
  to: string;
  length: number;
  type: string;
  color: string;
  locomotiveCost?: number;
  twinGroup?: string;
}

interface RouteBuildPanelProps {
  route: RouteDef;
  config: MapConfig;
  options: TrainCardColor[];
  unavailableReason: string | null;
  cardPalette: Record<string, string>;
  disabled: boolean;
  onClaim: (color: TrainCardColor) => void;
  onPaymentPreviewEnter: (preview: { color: TrainCardColor; totalCost: number; minimumLocomotives?: number }) => void;
  onPaymentPreviewLeave: () => void;
  claimedByName?: string | null;
}

export function RouteBuildPanel({
  route,
  config,
  options,
  unavailableReason,
  cardPalette,
  disabled,
  onClaim,
  onPaymentPreviewEnter,
  onPaymentPreviewLeave,
  claimedByName
}: RouteBuildPanelProps): JSX.Element {
  return (
    <SurfaceCard
      variant="detail"
      className="detail-card"
      data-detail-kind="route"
      title={`${getCityName(config, route.from)} → ${getCityName(config, route.to)}`}
    >
      <div className="detail-card__summary">
        <div className="detail-card__facts">
          <span className="detail-card__fact">{route.length} train{route.length === 1 ? "" : "s"}</span>
          <span className="detail-card__fact">{config.typeLabelOverrides?.[route.type] ?? route.type}</span>
          <span className="detail-card__fact">{route.color === "gray" ? "gray route" : route.color}</span>
          {route.locomotiveCost ? (
            <span className="detail-card__fact">{route.locomotiveCost} locomotive{route.locomotiveCost === 1 ? "" : "s"}</span>
          ) : null}
        </div>
        <p className="detail-card__prompt">
          {claimedByName ? `Claimed by ${claimedByName}.` : "Choose payment color."}
        </p>
      </div>
      <div className="detail-card__decision-shelf chip-row">
        {options.length > 0 ? (
          options.map((color) => (
            <ChoiceChipButton
              key={color}
              style={{ ["--choice-chip-accent" as string]: cardPalette[color] }}
              disabled={disabled}
              onMouseEnter={() => onPaymentPreviewEnter({ color, totalCost: route.length, minimumLocomotives: route.locomotiveCost ?? 0 })}
              onMouseLeave={onPaymentPreviewLeave}
              onFocus={() => onPaymentPreviewEnter({ color, totalCost: route.length, minimumLocomotives: route.locomotiveCost ?? 0 })}
              onBlur={onPaymentPreviewLeave}
              onClick={() => onClaim(color)}
            >
              Claim {formatCardLabel(color)}
            </ChoiceChipButton>
          ))
        ) : (
          <span className="muted-copy">{unavailableReason}</span>
        )}
      </div>
    </SurfaceCard>
  );
}
