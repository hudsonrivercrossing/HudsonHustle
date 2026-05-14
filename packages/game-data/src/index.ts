import type { MapConfig } from "@hudson-hustle/game-core";
import { projectGeoDiagramCities } from "./cartography.js";
import type { BoardPoint, GeoDiagramCitySeed } from "./cartography.js";
import { activeHudsonHustleConfig, hudsonHustleConfigRegistry, hudsonHustleCurrentPointer } from "./config-registry.js";
import type { BoardBackdrop, SnapshotMeta, StationAuthorityRef } from "./config-types.js";

export interface HudsonHustleReleasedConfigSummary {
  configId: string;
  version: string;
  summary: string;
  mapName: string;
  cityCount: number;
  routeCount: number;
}

function buildHudsonHustleMap(bundle: typeof activeHudsonHustleConfig): MapConfig {
  const activeStations = bundle.map.stations.filter((station) => station.active);
  const boardFrame = {
    width: bundle.map.board.width,
    height: bundle.map.board.height,
    padX: bundle.map.board.padX,
    padY: bundle.map.board.padY
  } as const;
  const geoCities: GeoDiagramCitySeed[] = activeStations.map((station) => ({
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
  const { cities } = projectGeoDiagramCities(geoCities, boardFrame);

  return {
    id: bundle.map.mapId,
    name: bundle.map.name,
    settings: {
      trainsPerPlayer: bundle.rules.trainsPerPlayer,
      stationsPerPlayer: bundle.rules.stationsPerPlayer,
      longestRouteBonus: bundle.rules.longestRouteBonus,
      stationValue: bundle.rules.stationValue
    },
    cities,
    routes: bundle.map.routes.map((route) => ({
      id: route.id,
      from: route.from,
      to: route.to,
      length: route.length,
      color: route.color,
      type: route.type,
      ...(route.locomotiveCost !== undefined ? { locomotiveCost: route.locomotiveCost } : {}),
      ...(route.twinGroup ? { twinGroup: route.twinGroup } : {}),
      ...(route.waypoints ? { waypoints: route.waypoints } : {})
    })),
    tickets: [
      ...bundle.tickets.long.map((ticket) => ({
        id: ticket.id,
        from: ticket.from,
        to: ticket.to,
        points: ticket.points,
        bucket: "long" as const
      })),
      ...bundle.tickets.regular.map((ticket) => ({
        id: ticket.id,
        from: ticket.from,
        to: ticket.to,
        points: ticket.points,
        bucket: "regular" as const
      }))
    ]
  };
}

export function getHudsonHustleRegisteredConfig(configId: string) {
  return hudsonHustleConfigRegistry[configId];
}

export function getHudsonHustleReleasedConfigBundle(configId: string) {
  const bundle = hudsonHustleConfigRegistry[configId];
  if (!bundle || bundle.mode !== "release") {
    return null;
  }
  return bundle;
}

export const hudsonHustleReleasedConfigs: HudsonHustleReleasedConfigSummary[] = Object.values(hudsonHustleConfigRegistry)
  .filter((bundle) => bundle.mode === "release")
  .map((bundle) => ({
    configId: bundle.configId,
    version: bundle.meta.version,
    summary: bundle.meta.summary,
    mapName: bundle.map.name,
    cityCount: bundle.map.stations.filter((s) => s.active).length,
    routeCount: bundle.map.routes.length
  }));

export function getHudsonHustleMapByConfigId(configId: string): MapConfig {
  const bundle = getHudsonHustleRegisteredConfig(configId);
  if (!bundle) {
    throw new Error(`Unknown Hudson Hustle config: ${configId}`);
  }
  return buildHudsonHustleMap(bundle);
}

export function getHudsonHustleVisualsByConfigId(configId: string) {
  const bundle = getHudsonHustleRegisteredConfig(configId);
  if (!bundle) {
    throw new Error(`Unknown Hudson Hustle config: ${configId}`);
  }
  return bundle.visuals;
}

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

export const hudsonHustleMap: MapConfig = buildHudsonHustleMap(activeHudsonHustleConfig);

export const cardColorPalette: Record<string, string> = activeHudsonHustleConfig.visuals.palettes.cards;

export const playerColorPalette: Record<string, string> = activeHudsonHustleConfig.visuals.palettes.players;

// ghost and blocked are reserved for future use (tutorial highlights, double-route locks)
export type RouteDisplayState = "unclaimed" | "mine" | "opponent" | "ghost" | "blocked";

export function resolveRouteDisplayState(
  routeId: string,
  viewerPlayerId: string | null,
  routeClaims: ReadonlyArray<{ routeId: string; playerId: string }>
): RouteDisplayState {
  const claim = routeClaims.find((c) => c.routeId === routeId);
  if (!claim) return "unclaimed";
  if (!viewerPlayerId) return "opponent";
  return claim.playerId === viewerPlayerId ? "mine" : "opponent";
}

export { createGeoProjector, projectGeoDiagramCities } from "./cartography.js";
export { buildBasemapProtectedZones } from "./basemap-protection.js";
export { activeHudsonHustleConfig, hudsonHustleConfigRegistry, hudsonHustleCurrentPointer } from "./config-registry.js";
export type {
  BasemapBoardFrame,
  BasemapBounds,
  BasemapProtectedZone,
  BasemapProtectedZones
} from "./basemap-protection.js";
export type {
  BoardBackdrop,
  BoardBackdropArea,
  BoardBackdropGenerationMetadata,
  BoardBackdropImage,
  BoardBackdropLabel,
  BoardBackdropLandmark,
  BoardBackdropLine,
  BoardBackdropThemeLine,
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
} from "./config-types.js";
export type { BoardPoint, GeoDiagramCitySeed, GeoPoint, GeoProjectionBounds, GeoProjectionOptions, GeoProjectionResult } from "./cartography.js";
