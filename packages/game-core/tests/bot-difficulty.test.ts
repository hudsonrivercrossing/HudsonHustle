import { describe, expect, it } from "vitest";
import { botDifficulties, chooseBotAction, type BotDifficulty } from "../src/bot-policy";
import { reduceGame, startGame } from "../src/game";
import { chooseBotActionForActivePlayer, runBotTurns, toPrivateState, toPublicGameState } from "../src/projection";
import type { GameAction, GameState, MapConfig, RouteDef, TicketDef, TrainCard } from "../src/types";
import { getHudsonHustleMapByConfigId, hudsonHustleMap } from "../../game-data/src";

const berlinMap = getHudsonHustleMapByConfigId("berlin");
const maps: Array<[string, MapConfig]> = [
  ["NYC", hudsonHustleMap],
  ["Berlin", berlinMap]
];

/** One bot action for the active player, with the hand-off that ends a turn. */
function step(state: GameState, config: MapConfig, difficulty: BotDifficulty): { state: GameState; action: GameAction } {
  const action = chooseBotActionForActivePlayer(state, config, difficulty);
  let next = reduceGame(state, action, config);
  if (next.turn.stage === "awaitingHandoff") {
    next = reduceGame(next, { type: "advance_turn" }, config);
  }
  return { state: next, action };
}

/** Plays a whole game. `reduceGame` throws on an illegal action, so finishing means every action was legal. */
function playToEnd(config: MapConfig, tiers: BotDifficulty[], seed: number, onStep?: (before: GameState, action: GameAction) => void): GameState {
  let state = startGame(config, { playerNames: tiers.map((tier, index) => `${tier} ${index + 1}`), seed });
  const tierOf = (playerId: string) => tiers[Number(playerId.split("-")[1]) - 1]!;
  for (let actions = 0; state.phase !== "gameOver"; actions += 1) {
    if (actions > 4000) {
      throw new Error("The game did not end.");
    }
    const next = step(state, config, tierOf(state.players[state.activePlayerIndex].id));
    onStep?.(state, next.action);
    state = next.state;
  }
  return state;
}

/** A two-player game in the main phase where player 1 holds exactly `tickets` and `hand`. */
function scenario(tickets: TicketDef[], hand: TrainCard[]): GameState {
  let state = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 7 });
  while (state.phase === "initialTickets") {
    const player = state.players[state.activePlayerIndex];
    state = reduceGame(
      state,
      { type: "select_initial_tickets", keptTicketIds: player.pendingTickets.slice(0, 2).map((ticket) => ticket.id) },
      hudsonHustleMap
    );
  }
  state.players[0].tickets = tickets;
  state.players[0].hand = hand;
  return state;
}

function claimFor(state: GameState, playerIndex: number, route: RouteDef): void {
  state.routeClaims.push({ routeId: route.id, playerId: state.players[playerIndex].id, colorUsed: "ivory", cardsSpent: [], tunnelExtraCost: 0 });
}

function cards(color: TrainCard["color"], count: number): TrainCard[] {
  return Array.from({ length: count }, (_, index) => ({ id: `test-${color}-${index}`, color }));
}

function ticket(from: string, to: string, points: number): TicketDef {
  return { id: `test-${from}-${to}`, from, to, points, bucket: "regular" };
}

function finalScoring(state: GameState): GameState {
  return reduceGame({ ...state, finalRoundRemaining: 0, turn: { ...state.turn, stage: "awaitingHandoff" } }, { type: "advance_turn" }, hudsonHustleMap);
}

describe("bot difficulty", () => {
  it("offers easy, standard and hard", () => {
    expect(botDifficulties).toEqual(["easy", "standard", "hard"]);
  });

  it("plays standard when no difficulty is given", () => {
    for (const [, config] of maps) {
      playToEnd(config, ["standard", "standard", "standard"], 5, (before, action) => {
        const player = before.players[before.activePlayerIndex];
        const context = { config, game: toPublicGameState(before), privateState: toPrivateState(before, player.id, "seat")! };
        expect(chooseBotAction(context)).toEqual(action);
        expect(chooseBotAction({ ...context, difficulty: "standard" })).toEqual(action);
        expect(chooseBotActionForActivePlayer(before, config)).toEqual(action);
      });
    }
  });

  it("hands each bot seat the tier difficultyOf names", () => {
    const start = startGame(hudsonHustleMap, { playerNames: ["A", "B"], seed: 21 });
    const tierOf = (playerId: string): BotDifficulty => (playerId === "player-1" ? "hard" : "easy");
    const viaRunner = runBotTurns(start, hudsonHustleMap, () => true, 40, tierOf);

    let state = start;
    const expected: GameAction[] = [];
    while (expected.length < 40) {
      const next = step(state, hudsonHustleMap, tierOf(state.players[state.activePlayerIndex].id));
      expected.push(next.action);
      state = next.state;
    }
    expect(viaRunner.actions).toEqual(expected);
    expect(viaRunner.state).toEqual(state);
    expect(runBotTurns(start, hudsonHustleMap, () => true, 40).actions).not.toEqual(expected);
  });
});

describe.each(botDifficulties)("%s bot", (tier) => {
  it.each(maps)("plays whole 2- and 4-player games on %s with only legal actions", (_name, config) => {
    for (const seed of [1, 2, 3]) {
      expect(playToEnd(config, [tier, tier], seed).phase).toBe("gameOver");
      expect(playToEnd(config, [tier, tier, tier, tier], seed).phase).toBe("gameOver");
    }
  });

  it("stays legal against the other tiers", () => {
    const others = botDifficulties.filter((other) => other !== tier);
    expect(playToEnd(hudsonHustleMap, [tier, others[0]!, others[1]!], 9).phase).toBe("gameOver");
    expect(playToEnd(berlinMap, [others[0]!, tier, others[1]!, tier], 9).phase).toBe("gameOver");
  });

  it("decides the same way every time, and only from what its seat can see", () => {
    playToEnd(hudsonHustleMap, [tier, tier, tier], 13, (before, action) => {
      expect(chooseBotActionForActivePlayer(before, hudsonHustleMap, tier)).toEqual(action);

      // Rearranging everything the active seat cannot see must not change its decision.
      const hidden = structuredClone(before);
      hidden.trainDeck.reverse();
      hidden.regularTickets.reverse();
      hidden.players.forEach((player, index) => {
        if (index !== hidden.activePlayerIndex) {
          player.hand = player.hand.map((card, cardIndex) => ({ id: card.id, color: cardIndex % 2 === 0 ? "locomotive" : "rose" }));
          player.tickets = [...player.tickets].reverse();
        }
      });
      expect(chooseBotActionForActivePlayer(hidden, hudsonHustleMap, tier)).toEqual(action);
    });
  });
});

describe("easy bot", () => {
  it("keeps three opening tickets and takes cards only from the deck", () => {
    const final = playToEnd(hudsonHustleMap, ["easy", "easy"], 4, (before, action) => {
      if (action.type === "select_initial_tickets") {
        const offered = before.players[before.activePlayerIndex].pendingTickets;
        const dearest = [...offered].sort((left, right) => right.points - left.points || left.id.localeCompare(right.id)).slice(0, 3);
        expect([...action.keptTicketIds].sort()).toEqual(dearest.map((entry) => entry.id).sort());
      }
      if (action.type === "draw_card" && before.trainDeck.length + before.discardPile.length > 0) {
        expect(action.source).toBe("deck");
      }
    });
    expect(final.phase).toBe("gameOver");
  });

  it("claims a route when no card can be drawn instead of running out of moves", () => {
    const route = hudsonHustleMap.routes.find((candidate) => candidate.color !== "gray" && !candidate.locomotiveCost && candidate.type === "normal")!;
    const state = scenario([ticket(route.from, route.to, 5)], cards(route.color as TrainCard["color"], route.length));
    state.trainDeck = [];
    state.discardPile = [];
    state.market = [];
    state.regularTickets = [];
    expect(chooseBotActionForActivePlayer(state, hudsonHustleMap, "easy")).toMatchObject({ type: "claim_route" });
  });
});

describe("hard bot", () => {
  const map = hudsonHustleMap;
  // A–B is the bot's own route; every way into C belongs to the rival, so only a station finishes A–C.
  const owned = map.routes.find((route) => map.routes.some((other) => other.id !== route.id && (other.from === route.to || other.to === route.to)))!;
  const cityB = owned.to;
  const borrowed = map.routes.find(
    (route) => route.id !== owned.id && (route.from === cityB || route.to === cityB) && ![route.from, route.to].includes(owned.from)
  )!;
  const cityC = borrowed.from === cityB ? borrowed.to : borrowed.from;

  function blockedTicketState(hand: TrainCard[]): GameState {
    const state = scenario([ticket(owned.from, cityC, 9)], hand);
    claimFor(state, 0, owned);
    map.routes.filter((route) => route.from === cityC || route.to === cityC).forEach((route) => claimFor(state, 1, route));
    return state;
  }

  it("builds a station when borrowing a rival's link completes a ticket", () => {
    const state = blockedTicketState(cards("ivory", 1));
    const action = chooseBotActionForActivePlayer(state, map, "hard");
    expect(action).toMatchObject({ type: "build_station", color: "ivory" });
    expect([cityB, cityC]).toContain((action as { cityId: string }).cityId);

    const scored = finalScoring(reduceGame(state, action, map));
    expect(scored.players[0].endgame?.completedTicketIds).toEqual([state.players[0].tickets[0].id]);
    expect(finalScoring(state).players[0].endgame?.completedTicketIds).toEqual([]);
  });

  it("does not spend a station on a ticket worth less than the station", () => {
    const state = blockedTicketState(cards("ivory", 1));
    state.players[0].tickets = [ticket(owned.from, cityC, 2)];
    expect(chooseBotActionForActivePlayer(state, map, "hard").type).not.toBe("build_station");
  });

  it("uses its last turn on the station when that is worth more than any route", () => {
    const state = blockedTicketState([...cards("ivory", 1), ...cards("rose", 2)]);
    state.finalRoundRemaining = 0;
    state.finalRoundTriggeredBy = "player-2";
    expect(chooseBotActionForActivePlayer(state, map, "hard").type).toBe("build_station");
  });

  it("uses its last turn on the claim that completes a ticket rather than a longer route", () => {
    const short = map.routes.find((route) => route.length === 2 && route.type === "normal" && route.color !== "gray" && !route.locomotiveCost && !route.twinGroup)!;
    const long = map.routes.find((route) => route.length >= 3 && route.type === "normal" && route.color !== "gray" && route.color !== short.color && !route.locomotiveCost)!;
    const hand = [...cards(short.color as TrainCard["color"], short.length), ...cards(long.color as TrainCard["color"], long.length)];
    const state = scenario([ticket(short.from, short.to, 8)], hand);
    state.finalRoundRemaining = 0;
    state.finalRoundTriggeredBy = "player-2";
    expect(chooseBotActionForActivePlayer(state, map, "hard")).toEqual({ type: "claim_route", routeId: short.id, color: short.color });
    // Without the ticket the longer route is simply worth more points.
    state.players[0].tickets = [];
    expect(chooseBotActionForActivePlayer(state, map, "hard")).toMatchObject({ type: "claim_route", routeId: long.id });
  });

  it("routes a ticket through the network it already owns", () => {
    // With A–B owned, the ticket A–C needs only B–C; the bot saves for that route and claims it once it can pay.
    const state = scenario([ticket(owned.from, cityC, 9)], cards("locomotive", borrowed.length + 1));
    claimFor(state, 0, owned);
    expect(chooseBotActionForActivePlayer(state, map, "hard")).toMatchObject({ type: "claim_route", routeId: borrowed.id });
  });

  it("finishes most of its tickets over a run of games, where the standard bot does not", () => {
    const done = { hard: 0, standard: 0 };
    const held = { hard: 0, standard: 0 };
    for (let seed = 1; seed <= 6; seed += 1) {
      const tiers: BotDifficulty[] = seed % 2 === 0 ? ["hard", "standard"] : ["standard", "hard"];
      playToEnd(map, tiers, seed).players.forEach((player, index) => {
        const tier = tiers[index] as "hard" | "standard";
        done[tier] += player.endgame?.completedTicketIds.length ?? 0;
        held[tier] += player.tickets.length;
      });
    }
    expect(done.hard / held.hard).toBeGreaterThan(0.6);
    expect(done.hard / held.hard).toBeGreaterThan(done.standard / held.standard);
  });
});
