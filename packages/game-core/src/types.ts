export const trainCardColors = [
  "crimson",
  "amber",
  "emerald",
  "cobalt",
  "violet",
  "obsidian",
  "ivory",
  "rose"
] as const;

export type TrainCardColor = (typeof trainCardColors)[number];
export type TrainCardFace = TrainCardColor | "locomotive";
export type RouteColor = TrainCardColor | "gray";
export type RouteType = "normal" | "tunnel" | "ferry";
export type TicketBucket = "regular" | "long";
export type GamePhase = "initialTickets" | "main" | "ticketChoice" | "gameOver";
export type TurnStage = "idle" | "drawing" | "awaitingHandoff";
export type PlayerColor = "harbor-blue" | "signal-red" | "path-green" | "ferry-gold";

export interface CityDef {
  id: string;
  name: string;
  label?: string;
  lat?: number;
  lon?: number;
  x: number;
  y: number;
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: "start" | "middle" | "end";
}

export interface RouteDef {
  id: string;
  from: string;
  to: string;
  length: number;
  color: RouteColor;
  type: RouteType;
  locomotiveCost?: number;
  twinGroup?: string;
  offset?: number;
  waypoints?: Array<{ x: number; y: number }>;
}

export interface TicketDef {
  id: string;
  from: string;
  to: string;
  points: number;
  bucket: TicketBucket;
}

export interface MapConfig {
  id: string;
  name: string;
  cities: CityDef[];
  routes: RouteDef[];
  tickets: TicketDef[];
  settings: {
    trainsPerPlayer: number;
    stationsPerPlayer: number;
    longestRouteBonus: number;
    stationValue: number;
  };
  typeLabelOverrides?: Record<string, string>;
}

export interface TrainCard {
  id: string;
  color: TrainCardFace;
}

export interface RouteClaim {
  routeId: string;
  playerId: string;
  colorUsed: TrainCardColor;
  cardsSpent: TrainCardFace[];
  tunnelExtraCost: number;
}

export interface StationPlacement {
  cityId: string;
  playerId: string;
}

export interface EndgameBreakdown {
  ticketDelta: number;
  completedTicketIds: string[];
  failedTicketIds: string[];
  stationBonus: number;
  longestRouteLength: number;
  longestRouteBonus: number;
}

export interface TicketProgress {
  ticket: TicketDef;
  completed: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  hand: TrainCard[];
  tickets: TicketDef[];
  pendingTickets: TicketDef[];
  score: number;
  trainsLeft: number;
  stationsLeft: number;
  endgame?: EndgameBreakdown;
}

export interface TurnState {
  stage: TurnStage;
  drawsTaken: number;
  tookFaceUpLocomotive: boolean;
  summary: string | null;
  latestTunnelReveal: TrainCardFace[];
}

export interface GameState {
  version: 1;
  mapId: string;
  players: PlayerState[];
  activePlayerIndex: number;
  phase: GamePhase;
  routeClaims: RouteClaim[];
  stations: StationPlacement[];
  trainDeck: TrainCard[];
  discardPile: TrainCard[];
  market: TrainCard[];
  regularTickets: TicketDef[];
  longTickets: TicketDef[];
  discardedTickets: TicketDef[];
  turn: TurnState;
  rngState: number;
  finalRoundRemaining: number | null;
  finalRoundTriggeredBy: string | null;
  log: string[];
}

export interface GameSetup {
  playerNames: string[];
  seed?: number;
}

export type GameAction =
  | { type: "select_initial_tickets"; keptTicketIds: string[] }
  | { type: "draw_card"; source: "deck" | "market"; marketIndex?: number }
  | { type: "claim_route"; routeId: string; color: TrainCardColor }
  | { type: "draw_tickets" }
  | { type: "cancel_ticket_draw" }
  | { type: "keep_drawn_tickets"; keptTicketIds: string[] }
  | { type: "build_station"; cityId: string; color: TrainCardColor }
  | { type: "advance_turn" };
