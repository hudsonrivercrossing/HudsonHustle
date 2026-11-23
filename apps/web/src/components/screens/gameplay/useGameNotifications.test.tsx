import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reduceGame, startGame, type GameState } from "@hudson-hustle/game-core";
import { hudsonHustleMap } from "@hudson-hustle/game-data";
import { useGameNotifications } from "./useGameNotifications";

function mainPhaseState(): GameState {
  let state = startGame(hudsonHustleMap, { playerNames: ["Ava", "Beau"], seed: 7 });
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

function playTurn(state: GameState): GameState {
  let next = reduceGame(state, { type: "draw_card", source: "deck" }, hudsonHustleMap);
  next = reduceGame(next, { type: "draw_card", source: "deck" }, hudsonHustleMap);
  return reduceGame(next, { type: "advance_turn" }, hudsonHustleMap);
}

describe("useGameNotifications", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not replay what happened before the game was first shown", () => {
    const { result } = renderHook(() => useGameNotifications(playTurn(mainPhaseState()), hudsonHustleMap));
    expect(result.current.notifications).toEqual([]);
  });

  it("announces each finished turn, including long after the visible log is full", () => {
    let game = mainPhaseState();
    const { result, rerender } = renderHook(({ current }) => useGameNotifications(current, hudsonHustleMap), {
      initialProps: { current: game }
    });

    for (let turn = 0; turn < 25; turn += 1) {
      game = playTurn(game);
      rerender({ current: game });
      const expectedName = turn % 2 === 0 ? "Ava" : "Beau";
      expect(result.current.notifications.at(-1)?.message).toBe(`${expectedName} drew 2 cards from the deck.`);
      act(() => vi.advanceTimersByTime(4500));
      expect(result.current.notifications).toEqual([]);
    }
  });

  it("starts fresh when a new game replaces the old one", () => {
    let game = playTurn(playTurn(mainPhaseState()));
    const { result, rerender } = renderHook(({ current }) => useGameNotifications(current, hudsonHustleMap), {
      initialProps: { current: game }
    });
    game = mainPhaseState();
    rerender({ current: game });
    expect(result.current.notifications).toEqual([]);
    rerender({ current: playTurn(game) });
    expect(result.current.notifications).toHaveLength(1);
  });

  it("shows one-off messages with their tone", () => {
    const { result } = renderHook(() => useGameNotifications(null, null));
    act(() => result.current.notify("10 seconds left.", "warning"));
    expect(result.current.notifications).toMatchObject([{ message: "10 seconds left.", tone: "warning" }]);
  });
});
