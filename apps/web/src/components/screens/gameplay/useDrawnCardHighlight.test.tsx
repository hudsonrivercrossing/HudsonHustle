import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrainCard } from "@hudson-hustle/game-core";
import { useDrawnCardHighlight } from "./useDrawnCardHighlight";

const card = (id: string, color: TrainCard["color"]): TrainCard => ({ id, color });

describe("useDrawnCardHighlight", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("points at the card that just arrived, then lets go", () => {
    const hand = [card("a", "amber")];
    const { result, rerender } = renderHook(({ viewer, cards }) => useDrawnCardHighlight(viewer, cards), {
      initialProps: { viewer: "p1", cards: hand }
    });
    expect(result.current).toBeNull();

    rerender({ viewer: "p1", cards: [...hand, card("b", "locomotive")] });
    expect(result.current).toBe("locomotive");

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBeNull();
  });

  it("ignores payments and a change of player", () => {
    const hand = [card("a", "amber"), card("b", "amber"), card("c", "rose")];
    const { result, rerender } = renderHook(({ viewer, cards }) => useDrawnCardHighlight(viewer, cards), {
      initialProps: { viewer: "p1", cards: hand }
    });
    rerender({ viewer: "p1", cards: [card("c", "rose")] });
    expect(result.current).toBeNull();

    rerender({ viewer: "p2", cards: [card("x", "ivory"), card("y", "ivory")] });
    expect(result.current).toBeNull();
  });

  it("drops the highlight when the laptop changes hands", () => {
    const { result, rerender } = renderHook(({ viewer, cards }) => useDrawnCardHighlight(viewer, cards), {
      initialProps: { viewer: "p1", cards: [card("a", "amber")] }
    });
    rerender({ viewer: "p1", cards: [card("a", "amber"), card("b", "cobalt")] });
    expect(result.current).toBe("cobalt");
    rerender({ viewer: "p2", cards: [card("z", "rose")] });
    expect(result.current).toBeNull();
  });
});
