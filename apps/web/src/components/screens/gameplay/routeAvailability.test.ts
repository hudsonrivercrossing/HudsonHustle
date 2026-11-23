import { describe, expect, it } from "vitest";
import { reduceGame, startGame, type GameState } from "@hudson-hustle/game-core";
import { hudsonHustleMap } from "@hudson-hustle/game-data";
import { canDrawCards, describeRouteCost, getRouteUnavailableReason } from "./routeAvailability";

function mainPhaseState(playerNames = ["Ava", "Beau"]): GameState {
  let state = startGame(hudsonHustleMap, { playerNames, seed: 7 });
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

const route = hudsonHustleMap.routes.find((candidate) => !candidate.twinGroup)!;
const twin = hudsonHustleMap.routes.find((candidate) => candidate.twinGroup)!;
const twinPartner = hudsonHustleMap.routes.find((candidate) => candidate.twinGroup === twin.twinGroup && candidate.id !== twin.id)!;

describe("getRouteUnavailableReason", () => {
  it("asks a waiting player to wait", () => {
    const game = mainPhaseState();
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: route.id, canAct: false })).toBe("Wait for your turn to claim a route.");
  });

  it("names the owner of a claimed route", () => {
    const game = mainPhaseState();
    game.routeClaims.push({ routeId: route.id, playerId: "player-2", colorUsed: "ivory", cardsSpent: [], tunnelExtraCost: 0 });
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: route.id, canAct: true })).toBe("Already claimed by Beau.");
  });

  it("explains a blocked parallel route in a small game", () => {
    const game = mainPhaseState();
    game.routeClaims.push({ routeId: twinPartner.id, playerId: "player-2", colorUsed: "ivory", cardsSpent: [], tunnelExtraCost: 0 });
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: twin.id, canAct: true })).toBe(
      "This parallel route is closed in a 2-player game because Beau claimed its twin."
    );
  });

  it("says a draw must be finished first", () => {
    let game = mainPhaseState();
    game = reduceGame(game, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: route.id, canAct: true })).toBe("Finish drawing before claiming a route.");
  });

  it("says what the player holds when they cannot pay", () => {
    const game = mainPhaseState();
    const colored = hudsonHustleMap.routes.find((candidate) => candidate.color !== "gray" && candidate.type === "normal" && !candidate.locomotiveCost)!;
    game.players[0].hand = colored.length > 1 ? [{ id: "a", color: "locomotive" }] : [];
    const held = colored.length > 1 ? "1 locomotive" : "0 locomotives";
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: colored.id, canAct: true })).toBe(
      `Not enough cards yet. You hold 0 ${colored.color} and ${held}.`
    );
  });

  it("says when the player is out of trains", () => {
    const game = mainPhaseState();
    game.players[0].trainsLeft = 0;
    expect(getRouteUnavailableReason({ game, config: hudsonHustleMap, routeId: route.id, canAct: true })).toBe(
      `This route needs ${route.length} trains and you have 0 left.`
    );
  });

  it("returns null for an unknown route", () => {
    expect(getRouteUnavailableReason({ game: mainPhaseState(), config: hudsonHustleMap, routeId: "nope", canAct: true })).toBeNull();
  });
});

describe("canDrawCards", () => {
  it("allows a second draw but not a third", () => {
    let game = mainPhaseState();
    expect(canDrawCards(game, true)).toBe(true);
    expect(canDrawCards(game, false)).toBe(false);
    game = reduceGame(game, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(canDrawCards(game, true)).toBe(true);
    game = reduceGame(game, { type: "draw_card", source: "deck" }, hudsonHustleMap);
    expect(canDrawCards(game, true)).toBe(false);
  });

  it("stops drawing while tickets are being chosen", () => {
    const game = reduceGame(mainPhaseState(), { type: "draw_tickets" }, hudsonHustleMap);
    expect(canDrawCards(game, true)).toBe(false);
  });
});

describe("describeRouteCost", () => {
  const base = { id: "r", from: "a", to: "b" } as const;

  it("covers colored, gray, ferry and tunnel routes", () => {
    expect(describeRouteCost({ ...base, length: 3, color: "cobalt", type: "normal" })).toBe("Costs 3 cards cobalt. Locomotives count as any color.");
    expect(describeRouteCost({ ...base, length: 1, color: "gray", type: "normal" })).toBe("Costs 1 card of any one color. Locomotives count as any color.");
    expect(describeRouteCost({ ...base, length: 4, color: "gray", type: "ferry", locomotiveCost: 1 })).toBe(
      "Costs 4 cards of any one color, at least 1 locomotive among them."
    );
    expect(describeRouteCost({ ...base, length: 2, color: "rose", type: "tunnel" })).toBe(
      "Costs 2 cards rose. Locomotives count as any color. A tunnel can cost up to 3 more."
    );
  });
});
