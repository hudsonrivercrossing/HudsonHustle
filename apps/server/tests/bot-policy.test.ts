import { describe, expect, it } from "vitest";
import type { MapConfig, PublicGameState, SeatPrivateState, TrainCard } from "@hudson-hustle/game-core";
import { chooseBotAction } from "../src/bot-policy";

const baseConfig: MapConfig = {
  id: "test-map",
  name: "Test Map",
  cities: [
    { id: "A", name: "Alpha", x: 0, y: 0 },
    { id: "B", name: "Bravo", x: 0, y: 0 },
    { id: "C", name: "Charlie", x: 0, y: 0 }
  ],
  routes: [
    { id: "A-B-red", from: "A", to: "B", length: 2, color: "crimson", type: "normal" },
    { id: "B-C-blue", from: "B", to: "C", length: 2, color: "cobalt", type: "normal" },
    { id: "A-C-tunnel", from: "A", to: "C", length: 3, color: "amber", type: "tunnel" }
  ],
  tickets: [],
  settings: {
    trainsPerPlayer: 45,
    stationsPerPlayer: 3,
    longestRouteBonus: 10,
    stationValue: 4
  }
};

function buildGame(overrides: Partial<PublicGameState> = {}): PublicGameState {
  return {
    version: 1,
    mapId: "test-map",
    players: [
      {
        id: "p1",
        name: "Bot West",
        color: "harbor-blue",
        score: 0,
        trainsLeft: 45,
        stationsLeft: 3,
        handCount: 4,
        ticketCount: 2,
        pendingTicketCount: 0
      },
      {
        id: "p2",
        name: "Ava",
        color: "signal-red",
        score: 0,
        trainsLeft: 45,
        stationsLeft: 3,
        handCount: 4,
        ticketCount: 2,
        pendingTicketCount: 0
      }
    ],
    activePlayerIndex: 0,
    phase: "main",
    routeClaims: [],
    stations: [],
    market: [
      { id: "m1", color: "cobalt" },
      { id: "m2", color: "crimson" },
      { id: "m3", color: "locomotive" },
      { id: "m4", color: "amber" },
      { id: "m5", color: "rose" }
    ],
    discardCount: 0,
    trainDeckCount: 20,
    regularTicketsCount: 10,
    longTicketsCount: 2,
    discardedTicketsCount: 0,
    turn: {
      stage: "idle",
      drawsTaken: 0,
      tookFaceUpLocomotive: false,
      summary: null,
      latestTunnelReveal: []
    },
    finalRoundRemaining: null,
    finalRoundTriggeredBy: null,
    log: [],
    ...overrides
  };
}

function buildPrivateState(overrides: Partial<SeatPrivateState> = {}): SeatPrivateState {
  return {
    seatId: "seat-1",
    playerId: "p1",
    hand: [],
    tickets: [
      { id: "ticket-1", from: "A", to: "C", points: 8, bucket: "regular" },
      { id: "ticket-2", from: "A", to: "B", points: 4, bucket: "regular" }
    ],
    pendingTickets: [],
    ...overrides
  };
}

describe("chooseBotAction", () => {
  it("keeps the top two starting tickets deterministically", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame({ phase: "initialTickets" }),
      privateState: buildPrivateState({
        pendingTickets: [
          { id: "t-low", from: "A", to: "B", points: 4, bucket: "regular" },
          { id: "t-high", from: "A", to: "C", points: 9, bucket: "regular" },
          { id: "t-mid", from: "B", to: "C", points: 6, bucket: "regular" },
          { id: "t-mid-2", from: "A", to: "C", points: 6, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "select_initial_tickets",
      keptTicketIds: ["t-high", "t-mid"]
    });
  });

  it("claims an affordable route aligned with its incomplete ticket before drawing", () => {
    const hand: TrainCard[] = [
      { id: "c1", color: "crimson" },
      { id: "c2", color: "crimson" },
      { id: "c3", color: "amber" },
      { id: "c4", color: "rose" }
    ];

    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame(),
      privateState: buildPrivateState({ hand })
    });

    expect(action).toEqual({
      type: "claim_route",
      routeId: "A-B-red",
      color: "crimson"
    });
  });

  it("draws a matching market color for its target path when no aligned claim is affordable", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame(),
      privateState: buildPrivateState({
        hand: [
          { id: "c1", color: "rose" },
          { id: "c2", color: "amber" },
          { id: "c3", color: "rose" },
          { id: "c4", color: "amber" }
        ]
      })
    });

    expect(action).toEqual({
      type: "draw_card",
      source: "market",
      marketIndex: 0
    });
  });
});
