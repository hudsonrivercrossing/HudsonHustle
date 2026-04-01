import type { MapConfig } from "@hudson-hustle/game-core";
import { projectGeoDiagramCities } from "./cartography";
import type { BoardPoint, GeoDiagramCitySeed } from "./cartography";
import { activeHudsonHustleConfig, hudsonHustleConfigRegistry, hudsonHustleCurrentPointer } from "./config-registry";
import type { BoardBackdrop, SnapshotMeta, StationAuthorityRef } from "./config-types";

const activeStations = activeHudsonHustleConfig.map.stations.filter((station) => station.active);

export const hudsonHustleCurrentConfigId = hudsonHustleCurrentPointer.activeConfigId;
export const hudsonHustleCurrentConfigPath = hudsonHustleCurrentPointer.activeConfigPath;
export const hudsonHustleAvailableConfigIds = Object.keys(hudsonHustleConfigRegistry);
export const hudsonHustleCurrentConfigMeta: SnapshotMeta = activeHudsonHustleConfig.meta;
export const hudsonHustleCurrentTheme = activeHudsonHustleConfig.visuals.theme;
export const hudsonHustleCurrentBackdropMode = activeHudsonHustleConfig.visuals.backdropMode;
export const hudsonHustleCurrentBoardLabelMode = activeHudsonHustleConfig.visuals.boardLabelMode;

export const hudsonHustleBoardFrame = {
  width: activeHudsonHustleConfig.map.board.width,
  height: activeHudsonHustleConfig.map.board.height,
  padX: activeHudsonHustleConfig.map.board.padX,
  padY: activeHudsonHustleConfig.map.board.padY
} as const;

export const hudsonHustleAnchorWaveCityIds = activeStations
  .filter((station) => station.tier === "anchor")
  .map((station) => station.id);

export const hudsonHustleFirstRingCityIds = activeStations
  .filter((station) => station.tier === "first-ring")
  .map((station) => station.id);

export const hudsonHustleStationReferences: Record<string, StationAuthorityRef> = Object.fromEntries(
  activeStations.map((station) => [
    station.id,
    station.authorityRef ?? {
      source: "station-proxy",
      reference: station.name
    }
  ])
);

export const hudsonHustleGeoCities: GeoDiagramCitySeed[] = activeStations.map((station) => ({
  id: station.id,
  name: station.name,
  label: station.label,
  lat: station.lat,
  lon: station.lon,
  boardX: station.boardX,
  boardY: station.boardY,
  labelDx: station.labelDx,
  labelDy: station.labelDy,
  labelAnchor: station.labelAnchor
}));

const { cities: hudsonHustleCities, bounds: hudsonHustleGeoBounds } = projectGeoDiagramCities(
  hudsonHustleGeoCities,
  hudsonHustleBoardFrame
);

export { hudsonHustleGeoBounds };
export const hudsonHustleBackdrop: BoardBackdrop = activeHudsonHustleConfig.visuals.backdrop;

const hudsonHustleRoutes: MapConfig["routes"] = activeHudsonHustleConfig.map.routes.map((route) => ({
  id: route.id,
  from: route.from,
  to: route.to,
  length: route.length,
  color: route.color,
  type: route.type,
  ...(route.locomotiveCost !== undefined ? { locomotiveCost: route.locomotiveCost } : {}),
  ...(route.twinGroup ? { twinGroup: route.twinGroup } : {}),
  ...(route.waypoints ? { waypoints: route.waypoints } : {})
}));

const hudsonHustleTickets: MapConfig["tickets"] = [
  ...activeHudsonHustleConfig.tickets.long.map((ticket) => ({
    id: ticket.id,
    from: ticket.from,
    to: ticket.to,
    points: ticket.points,
    bucket: "long" as const
  })),
  ...activeHudsonHustleConfig.tickets.regular.map((ticket) => ({
    id: ticket.id,
    from: ticket.from,
    to: ticket.to,
    points: ticket.points,
    bucket: "regular" as const
  }))
];

export const hudsonHustleMap: MapConfig = {
  id: activeHudsonHustleConfig.map.mapId,
  name: activeHudsonHustleConfig.map.name,
  settings: {
    trainsPerPlayer: activeHudsonHustleConfig.rules.trainsPerPlayer,
    stationsPerPlayer: activeHudsonHustleConfig.rules.stationsPerPlayer,
    longestRouteBonus: activeHudsonHustleConfig.rules.longestRouteBonus,
    stationValue: activeHudsonHustleConfig.rules.stationValue
  },
  cities: hudsonHustleCities,
  routes: hudsonHustleRoutes,
  tickets: hudsonHustleTickets
};

export const cardColorPalette: Record<string, string> = activeHudsonHustleConfig.visuals.palettes.cards;

export const playerColorPalette: Record<string, string> = activeHudsonHustleConfig.visuals.palettes.players;

export { createGeoProjector, projectGeoDiagramCities } from "./cartography";
export { activeHudsonHustleConfig, hudsonHustleConfigRegistry, hudsonHustleCurrentPointer } from "./config-registry";
export type {
  BoardBackdrop,
  BoardBackdropArea,
  BoardBackdropLabel,
  BoardBackdropLine,
  CurrentConfigPointer,
  RegisteredConfigBundle,
  SnapshotMap,
  SnapshotMapRoute,
  SnapshotMapStation,
  SnapshotMeta,
  SnapshotRules,
  SnapshotTicket,
  SnapshotTickets,
  SnapshotVisuals,
  StationAuthorityRef
} from "./config-types";
export type { BoardPoint, GeoDiagramCitySeed, GeoPoint, GeoProjectionBounds, GeoProjectionOptions, GeoProjectionResult } from "./cartography";
