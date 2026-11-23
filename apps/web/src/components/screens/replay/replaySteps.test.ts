import { describe, expect, it } from "vitest";
import { reduceGame, startGame, type GameState } from "@hudson-hustle/game-core";
import { hudsonHustleMap } from "@hudson-hustle/game-data";
import { buildReplaySteps } from "./replaySteps";

const config = hudsonHustleMap;
const plainRoutes = config.routes.filter((route) => route.type === "normal" && route.color !== "gray" && !route.locomotiveCost && !route.twinGroup);

function mainPhaseState(): GameState {
  let state = startGame(config, { playerNames: ["Ava", "Beau"], seed: 7 });
  while (state.phase === "initialTickets") {
    const player = state.players[state.activePlayerIndex];
    state = reduceGame(state, { type: "select_initial_tickets", keptTicketIds: player.pendingTickets.slice(0, 2).map((ticket) => ticket.id) }, config);
  }
  return state;
}

function claim(state: GameState, routeIndex: number): GameState {
  const route = plainRoutes[routeIndex];
  const next = structuredClone(state);
  next.players[next.activePlayerIndex].hand = Array.from({ length: route.length }, (_, index) => ({ id: `pay-${routeIndex}-${index}`, color: route.color as never }));
  return reduceGame(reduceGame(next, { type: "claim_route", routeId: route.id, color: route.color as never }, config), { type: "advance_turn" }, config);
}

function station(state: GameState, cityIndex: number): GameState {
  const next = structuredClone(state);
  next.players[next.activePlayerIndex].hand = [{ id: `station-${cityIndex}`, color: "ivory" }];
  return reduceGame(reduceGame(next, { type: "build_station", cityId: config.cities[cityIndex].id, color: "ivory" }, config), { type: "advance_turn" }, config);
}

describe("buildReplaySteps", () => {
  it("starts from an empty board", () => {
    const steps = buildReplaySteps(mainPhaseState(), config);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ routeClaims: [], stations: [], playerId: null });
  });

  it("replays routes and stations in the order they happened, with running route points", () => {
    let state = mainPhaseState();
    state = claim(state, 0); // Ava
    state = station(state, 3); // Beau
    state = claim(state, 1); // Ava
    const steps = buildReplaySteps(state, config);

    expect(steps.map((step) => [step.routeClaims.length, step.stations.length])).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1]
    ]);
    expect(steps.map((step) => step.playerId)).toEqual([null, "player-1", "player-2", "player-1"]);
    expect(steps[2].caption).toBe(`Beau built a station in ${config.cities[3].name}.`);
    expect(steps[1].caption).toMatch(/^Ava claimed .+ → .+ for \d+\.$/);
    expect(steps.at(-1)!.routePoints).toEqual({ "player-1": state.players[0].score, "player-2": 0 });
  });

  it("still replays a game saved before moves were recorded", () => {
    let state = mainPhaseState();
    state = claim(state, 0);
    state = station(state, 3);
    delete (state as Partial<GameState>).moves;
    const steps = buildReplaySteps(state, config);
    expect(steps).toHaveLength(3);
    expect(steps.at(-1)).toMatchObject({ routeClaims: [{ routeId: plainRoutes[0].id }], stations: [{ cityId: config.cities[3].id }] });
  });
});
