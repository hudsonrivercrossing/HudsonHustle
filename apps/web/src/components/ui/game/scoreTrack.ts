/** Geometry of the score track: 100 squares running clockwise around the board, starting at the top-left corner. */
export const TRACK_MARGIN = 46;
export const TRACK_CELLS = 100;
const LONG_SIDE = 32;
const SHORT_SIDE = 18;

export interface TrackCell {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The square for a score, as a rectangle in board units. The board itself spans 0..width by 0..height. */
export function trackCell(index: number, boardWidth: number, boardHeight: number): TrackCell {
  const cell = ((index % TRACK_CELLS) + TRACK_CELLS) % TRACK_CELLS;
  const longStep = (boardWidth + TRACK_MARGIN * 2) / LONG_SIDE;
  const shortStep = boardHeight / SHORT_SIDE;
  if (cell < LONG_SIDE) {
    return { index: cell, x: -TRACK_MARGIN + cell * longStep, y: -TRACK_MARGIN, width: longStep, height: TRACK_MARGIN };
  }
  if (cell < LONG_SIDE + SHORT_SIDE) {
    const step = cell - LONG_SIDE;
    return { index: cell, x: boardWidth, y: step * shortStep, width: TRACK_MARGIN, height: shortStep };
  }
  if (cell < LONG_SIDE * 2 + SHORT_SIDE) {
    const step = cell - LONG_SIDE - SHORT_SIDE;
    return { index: cell, x: boardWidth + TRACK_MARGIN - (step + 1) * longStep, y: boardHeight, width: longStep, height: TRACK_MARGIN };
  }
  const step = cell - LONG_SIDE * 2 - SHORT_SIDE;
  return { index: cell, x: -TRACK_MARGIN, y: boardHeight - (step + 1) * shortStep, width: TRACK_MARGIN, height: shortStep };
}

export interface TrackToken {
  playerId: string;
  x: number;
  y: number;
  /** How many times this player has passed 100. */
  laps: number;
}

/**
 * Where each player's marker sits. Players on the same square are fanned out so none hides another.
 * A score below zero stays on square 0.
 */
export function placeTokens(scores: Array<{ playerId: string; score: number }>, boardWidth: number, boardHeight: number): TrackToken[] {
  const sharing = new Map<number, number>();
  return scores.map(({ playerId, score }) => {
    const clamped = Math.max(0, Math.floor(score));
    const cellIndex = clamped % TRACK_CELLS;
    const cell = trackCell(cellIndex, boardWidth, boardHeight);
    const stackIndex = sharing.get(cellIndex) ?? 0;
    sharing.set(cellIndex, stackIndex + 1);
    const horizontal = cell.height === TRACK_MARGIN;
    const spread = (stackIndex - 0) * 9;
    return {
      playerId,
      x: cell.x + cell.width / 2 + (horizontal ? 0 : spread - 9),
      y: cell.y + cell.height / 2 + (horizontal ? spread - 9 : 0),
      laps: Math.floor(clamped / TRACK_CELLS)
    };
  });
}
