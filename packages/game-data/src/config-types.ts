import type { MapConfig } from "@hudson-hustle/game-core";
import type { BoardPoint } from "./cartography.js";

export interface BoardBackdropArea {
  id: string;
  points: BoardPoint[];
  opacity?: number;
}

export interface BoardBackdropLine {
  id: string;
  points: BoardPoint[];
}

export interface BoardBackdropLabel {
  id: string;
  text: string;
  point: BoardPoint;
  vertical?: boolean;
}

export interface BoardBackdrop {
  landAreas: BoardBackdropArea[];
  waterAreas: BoardBackdropArea[];
  shorelines: BoardBackdropLine[];
  regionLabels: BoardBackdropLabel[];
}

export interface StationAuthorityRef {
  source:
    | "mta-subway-complexes"
    | "mta-lirr-gtfs"
    | "panynj-path-official"
    | "nj-transit-official"
    | "nj-transit-hblr-map"
    | "station-proxy";
  reference: string;
  sourceUrl?: string;
  notes?: string;
}

export interface CurrentConfigPointer {
  schemaVersion: number;
  gameId: string;
  activeConfigId: string;
  activeConfigPath: string;
  mode: "draft" | "release";
}

export interface SnapshotMeta {
  schemaVersion: number;
  id: string;
  gameId: string;
  version: string;
  status: "draft" | "playtest" | "released" | "deprecated";
  basedOn: string | null;
  createdAt: string;
  updatedAt: string;
  sourceSync?: {
    method: string;
    sourceModule: string;
    sourceBuildPath?: string;
    sourceExport: string;
    syncedAt: string;
  };
  summary: string;
  designGoals: string[];
  changeSummary: string[];
  playtestFocus: string[];
  releaseNotes?: string[];
}

export interface SnapshotMapStation {
  id: string;
  name: string;
  label?: string;
  active: boolean;
  tier: "anchor" | "first-ring" | "other";
  lat: number;
  lon: number;
  boardX: number;
  boardY: number;
  labelPreset?: string;
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: "start" | "middle" | "end";
  authorityRef: StationAuthorityRef | null;
  notes?: string[];
}

export interface SnapshotMapRoute {
  id: string;
  from: string;
  to: string;
  length: number;
  color: MapConfig["routes"][number]["color"];
  type: MapConfig["routes"][number]["type"];
  locomotiveCost?: number;
  twinGroup?: string;
  waypoints?: Array<{ x: number; y: number }>;
  notes?: string[];
}

export interface SnapshotMap {
  schemaVersion: number;
  mapId: string;
  name: string;
  board: {
    width: number;
    height: number;
    padX: number;
    padY: number;
  };
  stations: SnapshotMapStation[];
  routes: SnapshotMapRoute[];
}

export interface SnapshotTicket {
  id: string;
  from: string;
  to: string;
  points: number;
  notes?: string[];
}

export interface SnapshotTickets {
  schemaVersion: number;
  ticketSetId: string;
  long: SnapshotTicket[];
  regular: SnapshotTicket[];
}

export interface SnapshotRules {
  schemaVersion: number;
  rulesetId: string;
  trainsPerPlayer: number;
  stationsPerPlayer: number;
  stationValue: number;
  longestRouteBonus: number;
  routeScoreTable: Record<string, number>;
  notes?: string[];
}

export interface SnapshotVisuals {
  schemaVersion: number;
  visualSetId: string;
  boardStyle: string;
  theme: string;
  backdropMode: "full" | "muted" | "minimal" | "none";
  boardLabelMode: "full-region-labels" | "station-only" | "minimal-region-labels";
  backdrop: BoardBackdrop;
  palettes: {
    cards: Record<string, string>;
    players: Record<string, string>;
  };
  notes?: string[];
}

export interface RegisteredConfigBundle {
  configId: string;
  configPath: string;
  mode: "draft" | "release";
  meta: SnapshotMeta;
  map: SnapshotMap;
  tickets: SnapshotTickets;
  rules: SnapshotRules;
  visuals: SnapshotVisuals;
}
