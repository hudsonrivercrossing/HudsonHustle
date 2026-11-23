import { describe, expect, it } from "vitest";
import { TRACK_CELLS, TRACK_MARGIN, placeTokens, trackCell } from "./scoreTrack";

const W = 1200;
const H = 900;

describe("trackCell", () => {
  it("starts in the top-left corner and runs clockwise", () => {
    expect(trackCell(0, W, H)).toMatchObject({ x: -TRACK_MARGIN, y: -TRACK_MARGIN });
    expect(trackCell(31, W, H).y).toBe(-TRACK_MARGIN);
    expect(trackCell(32, W, H)).toMatchObject({ x: W, y: 0 });
    expect(trackCell(50, W, H).y).toBe(H);
    expect(trackCell(99, W, H)).toMatchObject({ x: -TRACK_MARGIN, y: 0 });
  });

  it("keeps every square outside the map and inside the frame", () => {
    for (let index = 0; index < TRACK_CELLS; index += 1) {
      const cell = trackCell(index, W, H);
      const insideMap = cell.x >= 0 && cell.x + cell.width <= W && cell.y >= 0 && cell.y + cell.height <= H;
      expect(insideMap).toBe(false);
      expect(cell.x).toBeGreaterThanOrEqual(-TRACK_MARGIN - 0.001);
      expect(cell.x + cell.width).toBeLessThanOrEqual(W + TRACK_MARGIN + 0.001);
      expect(cell.y).toBeGreaterThanOrEqual(-TRACK_MARGIN - 0.001);
      expect(cell.y + cell.height).toBeLessThanOrEqual(H + TRACK_MARGIN + 0.001);
    }
  });

  it("wraps past 100", () => {
    expect(trackCell(104, W, H)).toEqual(trackCell(4, W, H));
  });
});

describe("placeTokens", () => {
  it("fans out players who share a square", () => {
    const [first, second] = placeTokens(
      [
        { playerId: "a", score: 12 },
        { playerId: "b", score: 12 }
      ],
      W,
      H
    );
    expect(first.x === second.x && first.y === second.y).toBe(false);
  });

  it("counts laps and never goes below zero", () => {
    const [high, low] = placeTokens(
      [
        { playerId: "a", score: 123 },
        { playerId: "b", score: -6 }
      ],
      W,
      H
    );
    expect(high.laps).toBe(1);
    expect(low.laps).toBe(0);
    expect(low).toMatchObject(placeTokens([{ playerId: "b", score: 0 }], W, H)[0]);
  });
});
