import { describe, expect, it } from "vitest";
import { getEventsSince, reduceGame, startGame } from "../src/game";
import { fromPlayerView, runBotTurns, toPrivateState, toPublicGameState } from "../src/projection";
import type { GameEvent, GameState } from "../src/types";
import { hudsonHustleMap } from "../../game-data/src";

function mainPhaseState(seed = 7): GameState {
  let state = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed });
  while (state.phase === "initialTickets") {
    const player = state.players[state.activePlayerIndex];
    state = reduceGame(
      state,
      { type: "select_initial_tickets", keptTicketIds: player.pendingTickets.slice(0, 2).map((ticket) => ticket.id) },
      hudsonHustleMap
    );
  }
  return state;
}

function lastSeq(state: GameState): number {
  return state.events?.at(-1)?.seq ?? 0;
}

function typesSince(state: GameState, seq: number): GameEvent["type"][] {
  return getEventsSince(state, seq).map((event) => event.type);
}

describe("game events", () => {
  it("records ticket choices during setup", () => {
    const state = mainPhaseState();
    expect(state.events?.map((event) => event.type)).toEqual(["tickets_kept", "tickets_kept"]);
    expect(state.events?.[0]).toMatchObject({ seq: 1, playerId: state.players[0].id, count: 2, initial: true });
  });

  it("records each drawn card with its source, then the next turn", () => {
    let state = mainPhaseState();
    const seen = lastSeq(state);
    state.market[0] = { id: "m-cobalt", color: "cobalt" };
    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 0 }, hudsonHustleMap);
    state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);

    const events = getEventsSince(state, seen);
    expect(events.map((event) => event.type)).toEqual(["card_drawn", "card_drawn", "turn_started"]);
    expect(events[0]).toMatchObject({ playerId: "player-1", source: "market", color: "cobalt" });
    expect(events[1]).toEqual({ type: "card_drawn", playerId: "player-1", source: "deck", seq: seen + 2 });
    expect(events[2]).toMatchObject({ playerId: "player-2" });
    expect(events.map((event) => event.seq)).toEqual([seen + 1, seen + 2, seen + 3]);
  });

  it("keeps the color of a blind deck draw out of everything other players can read", () => {
    let state = mainPhaseState();
    state.trainDeck[0] = { id: "secret", color: "violet" };
    state.market = state.market.map((card, index) => ({ id: `m${index}`, color: "amber" as const }));
    const seen = lastSeq(state);
    state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);

    expect(state.players[0].hand.at(-1)?.color).toBe("violet");
    expect(state.log.at(-1)).toBe("A drew a card from the deck.");
    expect(state.turn.summary).toBe("A drew a card from the deck.");
    const publicState = toPublicGameState(state);
    expect(JSON.stringify([publicState.log, publicState.turn, getEventsSince(publicState, seen)])).not.toContain("violet");
  });

  it("still says which face-up card was taken, since everyone saw it", () => {
    let state = mainPhaseState();
    state.market[2] = { id: "open", color: "rose" };
    state = reduceGame(state, { type: "draw_card", source: "market", marketIndex: 2 }, hudsonHustleMap);
    expect(state.log.at(-1)).toBe("A took a face-up rose card.");
    expect(state.turn.summary).toBe("A took a face-up rose card.");
    expect(state.events?.at(-1)).toMatchObject({ type: "card_drawn", source: "market", color: "rose" });
  });

  it("records a route claim with its score", () => {
    let state = mainPhaseState();
    const route = hudsonHustleMap.routes.find((candidate) => candidate.type === "normal" && candidate.color !== "gray" && !candidate.locomotiveCost)!;
    state.players[0].hand = Array.from({ length: route.length }, (_, index) => ({ id: `pay-${index}`, color: route.color as never }));
    const seen = lastSeq(state);
    state = reduceGame(state, { type: "claim_route", routeId: route.id, color: route.color as never }, hudsonHustleMap);

    const [claimed] = getEventsSince(state, seen);
    expect(claimed).toMatchObject({ type: "route_claimed", playerId: "player-1", routeId: route.id });
    expect((claimed as Extract<GameEvent, { type: "route_claimed" }>).points).toBe(state.players[0].score);
  });

  it("records stations and ticket draws", () => {
    let state = mainPhaseState();
    state.players[0].hand = [{ id: "s1", color: "ivory" }];
    let seen = lastSeq(state);
    state = reduceGame(state, { type: "build_station", cityId: hudsonHustleMap.cities[0].id, color: "ivory" }, hudsonHustleMap);
    expect(getEventsSince(state, seen)[0]).toMatchObject({ type: "station_built", cityId: hudsonHustleMap.cities[0].id });

    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    seen = lastSeq(state);
    state = reduceGame(state, { type: "draw_tickets" }, hudsonHustleMap);
    const pending = state.players[1].pendingTickets;
    state = reduceGame(state, { type: "keep_drawn_tickets", keptTicketIds: [pending[0].id] }, hudsonHustleMap);
    expect(typesSince(state, seen)).toEqual(["tickets_drawn", "tickets_kept"]);
    expect(getEventsSince(state, seen)[1]).toMatchObject({ count: 1, initial: false });
  });

  it("announces the final round and the end of the game", () => {
    let state = mainPhaseState();
    const route = hudsonHustleMap.routes.find((candidate) => candidate.type === "normal" && candidate.color !== "gray" && !candidate.locomotiveCost)!;
    state.players[0].hand = Array.from({ length: route.length }, (_, index) => ({ id: `pay-${index}`, color: route.color as never }));
    state.players[0].trainsLeft = route.length + 1;
    const seen = lastSeq(state);
    state = reduceGame(state, { type: "claim_route", routeId: route.id, color: route.color as never }, hudsonHustleMap);
    expect(typesSince(state, seen)).toEqual(["final_round_triggered", "route_claimed"]);

    state.finalRoundRemaining = 0;
    const beforeEnd = lastSeq(state);
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(typesSince(state, beforeEnd)).toEqual(["game_over"]);
  });

  it("keeps sequence numbers growing after old events are trimmed", () => {
    let state = mainPhaseState();
    for (let draw = 0; draw < 60; draw += 1) {
      state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
      if (state.turn.stage === "awaitingHandoff") {
        state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
      }
    }
    expect(state.events!.length).toBeLessThanOrEqual(32);
    expect(lastSeq(state)).toBe(2 + 60 + 30);
    expect(getEventsSince(state, lastSeq(state) - 3)).toHaveLength(3);
  });

  it("gives spent cards unique ids for the whole game", () => {
    let state = mainPhaseState();
    for (let turn = 0; turn < 30; turn += 1) {
      state.players[state.activePlayerIndex].hand = [{ id: `fresh-${turn}`, color: "ivory" }];
      state.stations = [];
      state.players[state.activePlayerIndex].stationsLeft = 3;
      state = reduceGame(state, { type: "build_station", cityId: hudsonHustleMap.cities[0].id, color: "ivory" }, hudsonHustleMap);
      state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    }
    const ids = [...state.discardPile, ...state.trainDeck, ...state.market].map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("treats a state saved before events existed as having none", () => {
    const legacy = mainPhaseState();
    delete (legacy as Partial<GameState>).events;
    expect(getEventsSince(legacy, 0)).toEqual([]);
    const next = reduceGame(legacy, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(next.events).toHaveLength(1);
  });
});

describe("projection", () => {
  it("hides hands and tickets in the public state", () => {
    const state = mainPhaseState();
    const publicState = toPublicGameState(state);
    expect(JSON.stringify(publicState)).not.toContain(state.players[1].tickets[0].id);
    expect(publicState.players[1]).toMatchObject({ handCount: state.players[1].hand.length, ticketCount: 2 });
    expect(publicState.trainDeckCount).toBe(state.trainDeck.length);
    expect(publicState.events).toEqual(state.events);
  });

  it("round-trips one player's view", () => {
    const state = mainPhaseState();
    const view = fromPlayerView(toPublicGameState(state), toPrivateState(state, "player-1", "seat-1"));
    expect(view.players[0].hand).toEqual(state.players[0].hand);
    expect(view.players[0].tickets).toEqual(state.players[0].tickets);
    expect(view.players[1].hand).toHaveLength(state.players[1].hand.length);
    expect(view.players[1].tickets.every((ticket) => ticket.from === "hidden")).toBe(true);
    expect(view.trainDeck).toHaveLength(state.trainDeck.length);
    expect(view.discardPile).toHaveLength(state.discardPile.length);
    expect(toPrivateState(state, "nobody", "seat-9")).toBeNull();
  });
});

describe("runBotTurns", () => {
  it("plays bot seats until a human is up", () => {
    const state = startGame(hudsonHustleMap, { playerNames: ["Human", "Bot 1"], seed: 11 });
    const afterHuman = reduceGame(
      state,
      { type: "select_initial_tickets", keptTicketIds: state.players[0].pendingTickets.slice(0, 2).map((ticket) => ticket.id) },
      hudsonHustleMap
    );
    const result = runBotTurns(afterHuman, hudsonHustleMap, (playerId) => playerId === "player-2");
    expect(result.state.phase).toBe("main");
    expect(result.state.players[result.state.activePlayerIndex].id).toBe("player-1");
    expect(result.actions.map((action) => action.type)).toEqual(["select_initial_tickets"]);
  });

  it("does nothing when a human is active or the game is over", () => {
    const state = mainPhaseState();
    expect(runBotTurns(state, hudsonHustleMap, (playerId) => playerId === "player-2")).toEqual({ state, actions: [] });
    const finished = { ...state, phase: "gameOver" as const };
    expect(runBotTurns(finished, hudsonHustleMap, () => true).actions).toEqual([]);
  });

  it("stops after the step limit when every seat is a bot", () => {
    const state = mainPhaseState();
    const result = runBotTurns(state, hudsonHustleMap, () => true, 3);
    expect(result.actions).toHaveLength(3);
  });
});

describe("tunnels when the deck runs dry", () => {
  const tunnel = hudsonHustleMap.routes.find((candidate) => candidate.type === "tunnel" && candidate.color !== "gray" && !candidate.locomotiveCost)!;

  function readyToClaim(deck: GameState["trainDeck"], discard: GameState["discardPile"]): GameState {
    const state = mainPhaseState();
    state.players[0].hand = Array.from({ length: tunnel.length }, (_, index) => ({ id: `pay-${index}`, color: tunnel.color as never }));
    state.trainDeck = deck;
    state.discardPile = discard;
    return state;
  }

  it("claims the tunnel at face value when there are no cards left to reveal", () => {
    const state = reduceGame(readyToClaim([], []), { type: "claim_route", routeId: tunnel.id, color: tunnel.color as never }, hudsonHustleMap);
    expect(state.routeClaims).toMatchObject([{ routeId: tunnel.id, tunnelExtraCost: 0 }]);
    expect(state.turn.latestTunnelReveal).toEqual([]);
  });

  it("reveals only as many cards as exist", () => {
    const other = tunnel.color === "ivory" ? "rose" : "ivory";
    const state = reduceGame(
      readyToClaim([{ id: "last", color: other }], []),
      { type: "claim_route", routeId: tunnel.id, color: tunnel.color as never },
      hudsonHustleMap
    );
    expect(state.turn.latestTunnelReveal).toEqual([other]);
    expect(state.routeClaims).toHaveLength(1);
  });

  it("puts the reveal on the claim event so every screen can show it", () => {
    const other = tunnel.color === "ivory" ? "rose" : "ivory";
    const state = reduceGame(
      readyToClaim([{ id: "last", color: other }], []),
      { type: "claim_route", routeId: tunnel.id, color: tunnel.color as never },
      hudsonHustleMap
    );
    expect(state.events?.find((event) => event.type === "route_claimed")).toMatchObject({ routeId: tunnel.id, tunnel: { cards: [other], extraCost: 0 } });
  });

  it("puts the reveal on the failure event when the surcharge cannot be paid", () => {
    const matching = [1, 2, 3].map((index) => ({ id: `m${index}`, color: tunnel.color as never }));
    const state = reduceGame(readyToClaim(matching, []), { type: "claim_route", routeId: tunnel.id, color: tunnel.color as never }, hudsonHustleMap);
    expect(state.routeClaims).toHaveLength(0);
    expect(state.events?.find((event) => event.type === "tunnel_failed")).toMatchObject({ routeId: tunnel.id, tunnel: { extraCost: 3 } });
  });

  it("still reshuffles the discard pile to reveal three when it can", () => {
    const other = tunnel.color === "ivory" ? "rose" : "ivory";
    const discard = [1, 2, 3, 4].map((index) => ({ id: `d${index}`, color: other as never }));
    const state = reduceGame(readyToClaim([], discard), { type: "claim_route", routeId: tunnel.id, color: tunnel.color as never }, hudsonHustleMap);
    expect(state.turn.latestTunnelReveal).toHaveLength(3);
  });
});

describe("drawing when cards run out", () => {
  it("ends the draw after one card when no second card exists", () => {
    let state = mainPhaseState();
    state.trainDeck = [{ id: "last", color: "ivory" }];
    state.discardPile = [];
    state.market = [];
    state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(state.players[0].hand.at(-1)?.id).toBe("last");
    expect(state.turn.stage).toBe("awaitingHandoff");
  });

  it("ends the draw when only face-up locomotives are left for the second card", () => {
    let state = mainPhaseState();
    state.trainDeck = [{ id: "last", color: "ivory" }];
    state.discardPile = [];
    state.market = [{ id: "loco", color: "locomotive" }];
    state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(state.turn.stage).toBe("awaitingHandoff");
  });

  it("still asks for a second card while one is available", () => {
    let state = mainPhaseState();
    state.trainDeck = [{ id: "a", color: "ivory" }];
    state.discardPile = [];
    state.market = [{ id: "b", color: "rose" }];
    state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(state.turn.stage).toBe("drawing");
  });
});

describe("bot with nothing to draw", () => {
  it("draws tickets instead of failing when no card can be taken", () => {
    const state = mainPhaseState();
    state.trainDeck = [];
    state.discardPile = [];
    state.market = [];
    state.players[0].hand = [];
    const result = runBotTurns(state, hudsonHustleMap, (playerId) => playerId === "player-1", 1);
    expect(result.actions).toEqual([{ type: "draw_tickets" }]);
  });
});

describe("players with no legal move", () => {
  /** Nothing to draw, no tickets to take, no stations left, no cards to pay with. */
  function strand(state: GameState, playerIndex: number): void {
    state.players[playerIndex].hand = [];
    state.players[playerIndex].stationsLeft = 0;
  }

  function emptyTable(): GameState {
    let state = mainPhaseState();
    state.trainDeck = [];
    state.discardPile = [];
    state.market = [];
    state.regularTickets = [];
    state.longTickets = [];
    state.players[0].hand = [{ id: "s", color: "ivory" }];
    state = reduceGame(state, { type: "build_station", cityId: hudsonHustleMap.cities[0].id, color: "ivory" }, hudsonHustleMap);
    state.discardPile = [];
    return state;
  }

  it("ends the game when nobody can do anything", () => {
    const state = emptyTable();
    strand(state, 0);
    strand(state, 1);
    const next = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(next.phase).toBe("gameOver");
    expect(next.log).toContain("No player has a legal move left.");
  });

  it("passes over a stranded player to one who can still move", () => {
    const state = emptyTable();
    strand(state, 1);
    state.players[0].hand = [
      { id: "a", color: "rose" },
      { id: "b", color: "rose" }
    ];
    const next = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(next.phase).toBe("main");
    expect(next.players[next.activePlayerIndex].id).toBe("player-1");
    expect(next.log).toContain("B has no legal move and passes.");
  });

  it("does not pass over a player who can still draw", () => {
    const state = emptyTable();
    strand(state, 1);
    state.trainDeck = [{ id: "d", color: "amber" }];
    const next = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    expect(next.players[next.activePlayerIndex].id).toBe("player-2");
  });

  it("lets a bot build a station when that is the only move left", () => {
    const state = emptyTable();
    state.players[1].hand = [{ id: "x", color: "cobalt" }];
    state.players[1].trainsLeft = 0;
    const next = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    const result = runBotTurns(next, hudsonHustleMap, (playerId) => playerId === "player-2", 1);
    expect(result.actions[0]).toMatchObject({ type: "build_station", color: "cobalt" });
  });
});
