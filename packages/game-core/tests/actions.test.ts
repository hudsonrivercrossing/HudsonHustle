import { describe, expect, it } from "vitest";
import { parseGameAction } from "../src/actions";
import { getLogEntriesSince, reduceGame, startGame } from "../src/game";
import { gameFitsMap, restoreGameState } from "../src/restore";
import type { GameAction, GameState } from "../src/types";
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

describe("parseGameAction", () => {
  it("returns well-formed actions unchanged", () => {
    const actions: GameAction[] = [
      { type: "select_initial_tickets", keptTicketIds: ["a", "b"] },
      { type: "draw_card", source: "deck" },
      { type: "draw_card", source: "market", marketIndex: 2 },
      { type: "claim_route", routeId: "r1", color: "cobalt" },
      { type: "draw_tickets" },
      { type: "cancel_ticket_draw" },
      { type: "keep_drawn_tickets", keptTicketIds: ["a"] },
      { type: "build_station", cityId: "c1", color: "ivory" },
      { type: "advance_turn" }
    ];
    for (const action of actions) {
      expect(parseGameAction(action)).toEqual(action);
    }
  });

  it("drops fields the action does not define", () => {
    expect(parseGameAction({ type: "draw_tickets", extra: 1 })).toEqual({ type: "draw_tickets" });
  });

  it.each([
    ["null", null],
    ["a string", "draw_card"],
    ["an unknown type", { type: "teleport" }],
    ["a draw with an unknown source", { type: "draw_card", source: "bogus", marketIndex: 0 }],
    ["a market draw without an index", { type: "draw_card", source: "market" }],
    ["a market draw with a fractional index", { type: "draw_card", source: "market", marketIndex: 1.5 }],
    ["a market draw with a negative index", { type: "draw_card", source: "market", marketIndex: -1 }],
    ["a claim with an unknown color", { type: "claim_route", routeId: "r1", color: "teal" }],
    ["a claim paid in the locomotive color", { type: "claim_route", routeId: "r1", color: "locomotive" }],
    ["a claim without a route", { type: "claim_route", color: "cobalt" }],
    ["a station with a numeric city", { type: "build_station", cityId: 3, color: "cobalt" }],
    ["ticket ids that are not strings", { type: "keep_drawn_tickets", keptTicketIds: [1, 2] }],
    ["ticket ids that are not a list", { type: "select_initial_tickets", keptTicketIds: "a" }],
    ["duplicate ticket ids", { type: "keep_drawn_tickets", keptTicketIds: ["a", "a"] }]
  ])("rejects %s", (_label, input) => {
    expect(() => parseGameAction(input)).toThrow(/Invalid action/);
  });
});

describe("reduceGame with malformed actions", () => {
  it("does not let an unknown draw source take a face-up locomotive without ending the draw", () => {
    const state = mainPhaseState();
    state.market[0] = { id: "loco-a", color: "locomotive" };
    state.market[1] = { id: "loco-b", color: "locomotive" };

    const cheat = { type: "draw_card", source: "bogus", marketIndex: 0 } as unknown as GameAction;
    expect(() => reduceGame(state, cheat, hudsonHustleMap)).toThrow(/Invalid action/);
  });

  it("throws on an unknown action type instead of returning undefined", () => {
    const state = mainPhaseState();
    expect(() => reduceGame(state, { type: "teleport" } as unknown as GameAction, hudsonHustleMap)).toThrow(/Invalid action/);
  });
});

describe("log sequence", () => {
  it("keeps reporting new log entries after the visible log is full", () => {
    let state = mainPhaseState();
    let seen = state.logSequence;
    const reported: string[] = [];

    for (let draw = 0; draw < 40; draw += 1) {
      state = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
      if (state.turn.stage === "awaitingHandoff") {
        state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
      }
      reported.push(...getLogEntriesSince(state, seen));
      seen = state.logSequence;
    }

    expect(state.log).toHaveLength(18);
    expect(reported.filter((entry) => entry.endsWith("drew a card from the deck."))).toHaveLength(40);
    expect(reported.filter((entry) => entry.endsWith("turn started."))).toHaveLength(20);
  });

  it("reports at most the visible log when more entries were added than it holds", () => {
    const state = mainPhaseState();
    expect(getLogEntriesSince(state, state.logSequence - 100)).toEqual(state.log);
    expect(getLogEntriesSince(state, state.logSequence)).toEqual([]);
    expect(getLogEntriesSince(state, state.logSequence + 5)).toEqual([]);
  });

  it("restores a state saved before log sequences and events existed, and plays on from it", () => {
    const legacy = JSON.parse(JSON.stringify(mainPhaseState())) as Record<string, unknown>;
    delete legacy.logSequence;
    delete legacy.events;

    const restored = restoreGameState(legacy);
    expect(restored).not.toBeNull();
    expect(restored!.logSequence).toBe(restored!.log.length);
    expect(restored!.events).toEqual([]);
    expect(getLogEntriesSince(restored!, restored!.log.length)).toEqual([]);

    const next = reduceGame(restored!, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(next.logSequence).toBe(restored!.log.length + 1);
  });

  it("refuses stored values that are not a game this build can continue", () => {
    const good = JSON.parse(JSON.stringify(mainPhaseState()));
    expect(restoreGameState(good)).not.toBeNull();
    expect(restoreGameState(null)).toBeNull();
    expect(restoreGameState("{}")).toBeNull();
    expect(restoreGameState({ ...good, version: 2 })).toBeNull();
    expect(restoreGameState({ ...good, players: [] })).toBeNull();
    expect(restoreGameState({ ...good, activePlayerIndex: 9 })).toBeNull();
    expect(restoreGameState({ ...good, market: undefined })).toBeNull();
  });

  it("tells whether a game's routes and stations exist on a map", () => {
    const state = mainPhaseState();
    expect(gameFitsMap(state, hudsonHustleMap)).toBe(true);
    expect(gameFitsMap({ ...state, routeClaims: [{ ...({} as GameState["routeClaims"][number]), routeId: "no-such-route", playerId: state.players[0].id }] }, hudsonHustleMap)).toBe(false);
    expect(gameFitsMap({ ...state, mapId: "atlantis" }, hudsonHustleMap)).toBe(false);
  });
});
