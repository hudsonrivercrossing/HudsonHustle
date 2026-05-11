import type { MapConfig, TrainCardColor } from "@hudson-hustle/game-core";
import { ChoiceChipButton } from "../ui/primitives/ChoiceChipButton";
import { SurfaceCard } from "../ui/primitives/SurfaceCard";
import { formatCardLabel } from "../GameplayHud";

interface CityDef {
  id: string;
  name: string;
}

interface StationBuildPanelProps {
  city: CityDef;
  config: MapConfig;
  options: TrainCardColor[];
  cityOccupied: boolean;
  stationCost: number;
  cardPalette: Record<string, string>;
  disabled: boolean;
  turnStage: string;
  onBuild: (color: TrainCardColor) => void;
  onPaymentPreviewEnter: (preview: { color: TrainCardColor; totalCost: number }) => void;
  onPaymentPreviewLeave: () => void;
}

export function StationBuildPanel({
  city,
  options,
  cityOccupied,
  stationCost,
  cardPalette,
  disabled,
  turnStage,
  onBuild,
  onPaymentPreviewEnter,
  onPaymentPreviewLeave
}: StationBuildPanelProps): JSX.Element {
  return (
    <SurfaceCard variant="detail" className="detail-card" title={city.name}>
      <div className="detail-card__summary">
        <div className="detail-card__facts">
          <span className="detail-card__fact">Station</span>
        </div>
        <p className="detail-card__prompt">Choose payment color.</p>
      </div>
      <div className="detail-card__decision-shelf chip-row">
        {cityOccupied ? (
          <span className="muted-copy">A station is already built in this city.</span>
        ) : options.length > 0 ? (
          options.map((color) => (
            <ChoiceChipButton
              key={color}
              style={{ ["--choice-chip-accent" as string]: cardPalette[color] }}
              disabled={disabled}
              onMouseEnter={() => onPaymentPreviewEnter({ color, totalCost: stationCost })}
              onMouseLeave={onPaymentPreviewLeave}
              onFocus={() => onPaymentPreviewEnter({ color, totalCost: stationCost })}
              onBlur={onPaymentPreviewLeave}
              onClick={() => onBuild(color)}
            >
              Build {formatCardLabel(color)}
            </ChoiceChipButton>
          ))
        ) : (
          <span className="muted-copy">
            {turnStage === "idle"
              ? "No affordable station payment colors right now."
              : "Finish the current draw before building a station."}
          </span>
        )}
      </div>
    </SurfaceCard>
  );
}
