import { describe, expect, it } from "vitest";
import type { MapConfig, PublicGameState, SeatPrivateState, TrainCard } from "@hudson-hustle/game-core";
import { chooseBotAction } from "../src/bot-policy";

const baseConfig: MapConfig = {
  id: "test-map",
  name: "Test Map",
  cities: [
    { id: "A", name: "Alpha", x: 0, y: 0 },
    { id: "B", name: "Bravo", x: 0, y: 0 },
    { id: "C", name: "Charlie", x: 0, y: 0 },
    { id: "D", name: "Delta", x: 0, y: 0 },
    { id: "E", name: "Echo", x: 0, y: 0 }
  ],
  routes: [
    { id: "A-B-red", from: "A", to: "B", length: 2, color: "crimson", type: "normal" },
    { id: "B-C-blue", from: "B", to: "C", length: 2, color: "cobalt", type: "normal" },
    { id: "A-C-tunnel", from: "A", to: "C", length: 3, color: "amber", type: "tunnel" },
    { id: "C-D-green", from: "C", to: "D", length: 2, color: "emerald", type: "normal" },
    { id: "D-E-black", from: "D", to: "E", length: 2, color: "obsidian", type: "normal" }
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
      keptTicketIds: ["t-high", "t-mid-2"]
    });
  });

  it("prefers a more coherent starting ticket pair over a disconnected higher-point mix", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame({ phase: "initialTickets" }),
      privateState: buildPrivateState({
        pendingTickets: [
          { id: "t-ac", from: "A", to: "C", points: 7, bucket: "regular" },
          { id: "t-ab", from: "A", to: "B", points: 6, bucket: "regular" },
          { id: "t-de", from: "D", to: "E", points: 8, bucket: "regular" },
          { id: "t-cd", from: "C", to: "D", points: 4, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "select_initial_tickets",
      keptTicketIds: ["t-ab", "t-ac"]
    });
  });

  it("uses only currently available routes when choosing which drawn ticket to keep", () => {
    const ticketChoiceConfig: MapConfig = {
      id: "ticket-choice-map",
      name: "Ticket Choice Map",
      cities: [
        { id: "A", name: "Alpha", x: 0, y: 0 },
        { id: "B", name: "Bravo", x: 0, y: 0 },
        { id: "C", name: "Charlie", x: 0, y: 0 }
      ],
      routes: [
        { id: "A-C-direct", from: "A", to: "C", length: 2, color: "crimson", type: "normal" },
        { id: "B-C-open", from: "B", to: "C", length: 2, color: "cobalt", type: "normal" }
      ],
      tickets: [],
      settings: {
        trainsPerPlayer: 45,
        stationsPerPlayer: 3,
        longestRouteBonus: 10,
        stationValue: 4
      }
    };

    const action = chooseBotAction({
      config: ticketChoiceConfig,
      game: buildGame({
        phase: "ticketChoice",
        routeClaims: [{ routeId: "A-C-direct", playerId: "p2", colorUsed: "crimson", cardsSpent: ["crimson", "crimson"], tunnelExtraCost: 0 }]
      }),
      privateState: buildPrivateState({
        pendingTickets: [
          { id: "blocked-high", from: "A", to: "C", points: 10, bucket: "regular" },
          { id: "open-low", from: "B", to: "C", points: 5, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "keep_drawn_tickets",
      keptTicketIds: ["open-low"]
    });
  });

  it("keeps a drawn ticket that is already completed by the bot's claimed routes", () => {
    const ticketChoiceConfig: MapConfig = {
      id: "ticket-choice-owned-route-map",
      name: "Ticket Choice Owned Route Map",
      cities: [
        { id: "A", name: "Alpha", x: 0, y: 0 },
        { id: "B", name: "Bravo", x: 0, y: 0 },
        { id: "C", name: "Charlie", x: 0, y: 0 }
      ],
      routes: [
        { id: "A-B-owned", from: "A", to: "B", length: 2, color: "crimson", type: "normal" },
        { id: "B-C-open", from: "B", to: "C", length: 2, color: "cobalt", type: "normal" }
      ],
      tickets: [],
      settings: {
        trainsPerPlayer: 45,
        stationsPerPlayer: 3,
        longestRouteBonus: 10,
        stationValue: 4
      }
    };

    const action = chooseBotAction({
      config: ticketChoiceConfig,
      game: buildGame({
        phase: "ticketChoice",
        routeClaims: [{ routeId: "A-B-owned", playerId: "p1", colorUsed: "crimson", cardsSpent: ["crimson", "crimson"], tunnelExtraCost: 0 }]
      }),
      privateState: buildPrivateState({
        pendingTickets: [
          { id: "completed-high", from: "A", to: "B", points: 10, bucket: "regular" },
          { id: "open-low", from: "B", to: "C", points: 5, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "keep_drawn_tickets",
      keptTicketIds: ["completed-high"]
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

  it("prefers a claim that advances multiple incomplete tickets over the first path edge of the highest-point ticket", () => {
    const hand: TrainCard[] = [
      { id: "c1", color: "crimson" },
      { id: "c2", color: "crimson" },
      { id: "c3", color: "cobalt" },
      { id: "c4", color: "cobalt" }
    ];

    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame(),
      privateState: buildPrivateState({
        hand,
        tickets: [
          { id: "ticket-ac", from: "A", to: "C", points: 8, bucket: "regular" },
          { id: "ticket-bc", from: "B", to: "C", points: 7, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "claim_route",
      routeId: "B-C-blue",
      color: "cobalt"
    });
  });

  it("claims an affordable tunnel when it is the useful legal route for the current ticket", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame(),
      privateState: buildPrivateState({
        hand: [
          { id: "c1", color: "amber" },
          { id: "c2", color: "amber" },
          { id: "c3", color: "amber" },
          { id: "c4", color: "rose" }
        ],
        tickets: [{ id: "ticket-ac", from: "A", to: "C", points: 8, bucket: "regular" }]
      })
    });

    expect(action).toEqual({
      type: "claim_route",
      routeId: "A-C-tunnel",
      color: "amber"
    });
  });

  it("does not choose a route claim longer than its remaining trains", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame({
        players: [
          {
            ...buildGame().players[0],
            trainsLeft: 1
          },
          buildGame().players[1]
        ]
      }),
      privateState: buildPrivateState({
        hand: [
          { id: "c1", color: "crimson" },
          { id: "c2", color: "crimson" },
          { id: "c3", color: "amber" },
          { id: "c4", color: "rose" }
        ]
      })
    });

    expect(action).toEqual({
      type: "draw_card",
      source: "market",
      marketIndex: 1
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
      marketIndex: 1
    });
  });

  it("prefers a market color that supports the stronger shared claim over an earlier but weaker match", () => {
    const action = chooseBotAction({
      config: baseConfig,
      game: buildGame({
        market: [
          { id: "m1", color: "crimson" },
          { id: "m2", color: "cobalt" },
          { id: "m3", color: "locomotive" },
          { id: "m4", color: "amber" },
          { id: "m5", color: "rose" }
        ]
      }),
      privateState: buildPrivateState({
        hand: [
          { id: "c1", color: "rose" },
          { id: "c2", color: "amber" },
          { id: "c3", color: "rose" },
          { id: "c4", color: "amber" }
        ],
        tickets: [
          { id: "ticket-ac", from: "A", to: "C", points: 8, bucket: "regular" },
          { id: "ticket-bc", from: "B", to: "C", points: 7, bucket: "regular" }
        ]
      })
    });

    expect(action).toEqual({
      type: "draw_card",
      source: "market",
      marketIndex: 1
    });
  });
});
