import { describe, expect, it } from "vitest";
import { getTicketProgress, startGame, reduceGame } from "../src/game";
import type { GameState, MapConfig } from "../src/types";
import { hudsonHustleMap } from "../../game-data/src";

function forcePlayerHand(state: GameState, colors: Array<GameState["players"][number]["hand"][number]["color"]>): GameState {
  const nextState = structuredClone(state);
  nextState.players[nextState.activePlayerIndex].hand = colors.map((color, index) => ({
    id: `forced-${index}`,
    color
  }));
  return nextState;
}

function finishInitialTickets(state: GameState, config: MapConfig = hudsonHustleMap): GameState {
  let nextState = state;
  while (nextState.phase === "initialTickets") {
    const player = nextState.players[nextState.activePlayerIndex];
    nextState = reduceGame(
      nextState,
      {
        type: "select_initial_tickets",
        keptTicketIds: player.pendingTickets.slice(0, 2).map((ticket) => ticket.id)
      },
      config
    );
  }
  return nextState;
}

const exhaustedDoubleRouteMap: MapConfig = {
  id: "exhausted-double-route-test",
  name: "Exhausted Double Route Test",
  cities: [
    { id: "alpha", name: "Alpha", x: 0, y: 0 },
    { id: "bravo", name: "Bravo", x: 100, y: 0 }
  ],
  routes: [
    {
      id: "alpha-bravo-a",
      from: "alpha",
      to: "bravo",
      length: 2,
      color: "obsidian",
      type: "normal",
      twinGroup: "alpha-bravo"
    },
    {
      id: "alpha-bravo-b",
      from: "alpha",
      to: "bravo",
      length: 2,
      color: "amber",
      type: "normal",
      twinGroup: "alpha-bravo"
    }
  ],
  tickets: [
    { id: "long-1", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-2", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-3", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "long-4", from: "alpha", to: "bravo", points: 5, bucket: "long" },
    { id: "regular-1", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-2", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-3", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-4", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-5", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-6", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-7", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-8", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-9", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-10", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-11", from: "alpha", to: "bravo", points: 3, bucket: "regular" },
    { id: "regular-12", from: "alpha", to: "bravo", points: 3, bucket: "regular" }
  ],
  settings: {
    trainsPerPlayer: 8,
    stationsPerPlayer: 3,
    longestRouteBonus: 10,
    stationValue: 4
  }
};


describe("game-core", () => {
  it("creates a deterministic setup with the same seed", () => {
    const first = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    const second = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    expect(first.players[0].hand.map((card) => card.color)).toEqual(second.players[0].hand.map((card) => card.color));
    expect(first.market.map((card) => card.color)).toEqual(second.market.map((card) => card.color));
  });

  it("requires each player to keep at least two starting tickets", () => {
    const state = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
    expect(() =>
      reduceGame(
        state,
        {
          type: "select_initial_tickets",
          keptTicketIds: [state.players[0].pendingTickets[0].id]
        },
        hudsonHustleMap
      )
    ).toThrow(/Keep at least two tickets/);
  });

  it("allows a player to draw two cards unless the first is a face-up locomotive", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 }));
    state.market[0] = { id: "loco", color: "locomotive" };
    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 0 }, hudsonHustleMap);
    expect(state.turn.stage).toBe("awaitingHandoff");
    expect(state.players[0].hand.at(-1)?.color).toBe("locomotive");
  });

  it("refreshes the full face-up market when three locomotives are showing", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 8 }));
    state.market = [
      { id: "m1", color: "locomotive" },
      { id: "m2", color: "locomotive" },
      { id: "m3", color: "locomotive" },
      { id: "m4", color: "obsidian" },
      { id: "m5", color: "amber" }
    ];
    state.trainDeck = [
      { id: "d1", color: "cobalt" },
      { id: "d2", color: "rose" },
      { id: "d3", color: "emerald" },
      { id: "d4", color: "violet" },
      { id: "d5", color: "amber" },
      { id: "d6", color: "obsidian" }
    ];
    state.discardPile = [];

    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 3 }, hudsonHustleMap);

    expect(state.players[0].hand.at(-1)?.color).toBe("obsidian");
    expect(state.market.map((card) => card.color)).toEqual(["rose", "emerald", "violet", "amber", "obsidian"]);
    expect(state.discardPile.map((card) => card.color)).toEqual([
      "locomotive",
      "locomotive",
      "locomotive",
      "amber",
      "cobalt"
    ]);
  });

  it("claims a standard route and deducts trains", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 9 }));
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);
    state = reduceGame(
      state,
      { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
      hudsonHustleMap
    );
    expect(state.routeClaims).toHaveLength(1);
    expect(state.players[0].trainsLeft).toBe(hudsonHustleMap.settings.trainsPerPlayer - 2);
    expect(state.finalRoundRemaining).toBeNull();
    expect(state.turn.stage).toBe("awaitingHandoff");
  });

  it("does not let a player claim a route longer than their remaining trains", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 9 }));
    state.players[0].trainsLeft = 1;
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);

    expect(() =>
      reduceGame(
        state,
        { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
        hudsonHustleMap
      )
    ).toThrow("You do not have enough trains left for that route.");
  });

  it("triggers the final round when no route remains open", () => {
    let state = finishInitialTickets(
      startGame(exhaustedDoubleRouteMap, { playerNames: ["A", "B"], seed: 9 }),
      exhaustedDoubleRouteMap
    );
    state = forcePlayerHand(state, ["obsidian", "obsidian"]);

    state = reduceGame(
      state,
      { type: "claim_route", routeId: "alpha-bravo-a", color: "obsidian" },
      exhaustedDoubleRouteMap
    );

    expect(state.players[0].trainsLeft).toBe(6);
    expect(state.finalRoundRemaining).toBe(1);
    expect(state.finalRoundTriggeredBy).toBe("player-1");
  });

  it("does not trigger route-exhaustion endgame while a 4-player double route twin remains open", () => {
    let state = finishInitialTickets(
      startGame(exhaustedDoubleRouteMap, { playerNames: ["A", "B", "C", "D"], seed: 9 }),
      exhaustedDoubleRouteMap
    );
    state = forcePlayerHand(state, ["obsidian", "obsidian"]);

    state = reduceGame(
      state,
      { type: "claim_route", routeId: "alpha-bravo-a", color: "obsidian" },
      exhaustedDoubleRouteMap
    );

    expect(state.players[0].trainsLeft).toBe(6);
    expect(state.finalRoundRemaining).toBeNull();
    expect(state.finalRoundTriggeredBy).toBeNull();
  });

  it("builds a station and consumes cards", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 11 }));
    state = forcePlayerHand(state, ["rose", "amber", "cobalt"]);
    state = reduceGame(state, { type: "build_station", cityId: "jamaica", color: "rose" }, hudsonHustleMap);
    expect(state.stations).toHaveLength(1);
    expect(state.players[0].stationsLeft).toBe(2);
  });

  it("reports live ticket progress from the player's current network", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 14 }));
    state.players[0].tickets = [
      { id: "custom-ticket", from: "newark-penn", to: "grove-st", points: 5, bucket: "regular" }
    ];
    state = forcePlayerHand(state, ["obsidian", "obsidian", "amber", "amber"]);
    state = reduceGame(
      state,
      { type: "claim_route", routeId: "newark-penn-grove-st", color: "obsidian" },
      hudsonHustleMap
    );
    const progress = getTicketProgress(state, hudsonHustleMap, state.players[0].id);
    expect(progress).toEqual([
      {
        ticket: { id: "custom-ticket", from: "newark-penn", to: "grove-st", points: 5, bucket: "regular" },
        completed: true
      }
    ]);
  });

  it("counts a rival route borrowed through a station as ticket progress, as the final scoring does", () => {
    const state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 14 }));
    const [first, second] = state.players;
    first.tickets = [{ id: "custom-ticket", from: "newark-penn", to: "grove-st", points: 5, bucket: "regular" }];
    state.routeClaims = [{ routeId: "newark-penn-grove-st", playerId: second.id, colorUsed: "obsidian", cardsSpent: [], tunnelExtraCost: 0 }];

    expect(getTicketProgress(state, hudsonHustleMap, first.id)[0].completed).toBe(false);

    state.stations = [{ cityId: "grove-st", playerId: first.id }];
    expect(getTicketProgress(state, hudsonHustleMap, first.id)[0].completed).toBe(true);
  });

  it("lets a player cancel a freshly drawn ticket choice and restore the deck order", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 21 }));
    const nextThreeTicketIds = state.regularTickets.slice(0, 3).map((ticket) => ticket.id);
    state = reduceGame(state, { type: "draw_tickets" }, hudsonHustleMap);
    expect(state.players[0].pendingTickets.map((ticket) => ticket.id)).toEqual(nextThreeTicketIds);
    state = reduceGame(state, { type: "cancel_ticket_draw" }, hudsonHustleMap);
    expect(state.phase).toBe("main");
    expect(state.players[0].pendingTickets).toEqual([]);
    expect(state.regularTickets.slice(0, 3).map((ticket) => ticket.id)).toEqual(nextThreeTicketIds);
  });

  it("advances to game over after the final round count is exhausted", () => {
    let state = finishInitialTickets(startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 12 }));
    state.players[0].trainsLeft = 2;
    state.turn.stage = "awaitingHandoff";
    state.finalRoundRemaining = 0;
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(state.phase).toBe("gameOver");
    expect(state.players[0].endgame).toBeDefined();
  });
});
