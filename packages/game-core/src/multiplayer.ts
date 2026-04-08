import type { EndgameBreakdown, GameAction, GamePhase, GameState, PlayerColor, RouteClaim, StationPlacement, TicketDef, TrainCard, TurnState } from "./types.js";

export type ControllerType = "human" | "bot" | "agent" | "human+agent";
export type RoomStatus = "lobby" | "active" | "finished";
export type ReconnectState = "fresh" | "attempting-reconnect" | "reconnected" | "reconnect-failed" | "manual-rejoin";

export interface RoomSeatSummary {
  seatId: string;
  playerId: string | null;
  playerName: string | null;
  controllerType: ControllerType;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoomSummary {
  roomCode: string;
  status: RoomStatus;
  hostSeatId: string;
  playerCount: number;
  configId: string;
  configVersion: string;
  configSummary: string;
  mapName: string;
  turnTimeLimitSeconds: number;
  createdAt: string;
  updatedAt: string;
  activeSeatId: string | null;
  seats: RoomSeatSummary[];
}

export interface PublicPlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  score: number;
  trainsLeft: number;
  stationsLeft: number;
  handCount: number;
  ticketCount: number;
  pendingTicketCount: number;
  endgame?: EndgameBreakdown;
}

export interface PublicGameState {
  version: GameState["version"];
  mapId: string;
  players: PublicPlayerState[];
  activePlayerIndex: number;
  phase: GamePhase;
  routeClaims: RouteClaim[];
  stations: StationPlacement[];
  market: TrainCard[];
  discardCount: number;
  trainDeckCount: number;
  regularTicketsCount: number;
  longTicketsCount: number;
  discardedTicketsCount: number;
  turn: TurnState;
  finalRoundRemaining: number | null;
  finalRoundTriggeredBy: string | null;
  log: string[];
}

export interface SeatPrivateState {
  seatId: string;
  playerId: string | null;
  hand: TrainCard[];
  tickets: TicketDef[];
  pendingTickets: TicketDef[];
}

export interface RoomSnapshot {
  room: RoomSummary;
  game: PublicGameState | null;
  privateState: SeatPrivateState | null;
}

export interface CreateRoomRequest {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds?: string[];
}

export interface CreateRoomResponse {
  roomCode: string;
  seatId: string;
  playerSecret: string;
  snapshot: RoomSnapshot;
}

export interface JoinRoomRequest {
  playerName: string;
  preferredSeatId?: string;
}

export interface JoinRoomResponse {
  roomCode: string;
  seatId: string;
  playerSecret: string;
  snapshot: RoomSnapshot;
}

export interface RejoinRoomRequest {
  seatId: string;
  playerSecret: string;
}

export interface RejoinRoomResponse {
  roomCode: string;
  seatId: string;
  playerSecret: string;
  snapshot: RoomSnapshot;
}

export interface StartRoomRequest {
  playerSecret: string;
}

export interface StartRoomResponse {
  snapshot: RoomSnapshot;
}

export interface RoomSubscribePayload {
  roomCode: string;
  seatId: string;
  playerSecret: string;
}

export interface ReadyPayload extends RoomSubscribePayload {
  ready: boolean;
}

export interface GameActionPayload extends RoomSubscribePayload {
  action: GameAction;
}

export interface TimerUpdate {
  activeSeatId: string | null;
  deadlineAt: number | null;
  secondsRemaining: number | null;
}

export interface ClientToServerEvents {
  "room:subscribe": (payload: RoomSubscribePayload) => void;
  "player:ready": (payload: ReadyPayload) => void;
  "game:action": (payload: GameActionPayload) => void;
}

export interface ServerToClientEvents {
  "room:update": (room: RoomSummary) => void;
  "game:update:public": (game: PublicGameState) => void;
  "game:update:private": (state: SeatPrivateState | null) => void;
  "game:error": (payload: { message: string }) => void;
  "game:timer": (payload: TimerUpdate) => void;
  "game:reconnected": (snapshot: RoomSnapshot) => void;
}
