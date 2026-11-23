/**
 * The turn timers, one per room. The room service says when a room's turn runs out and what to do
 * then; this keeps the timers themselves, so they can be replaced in a test and counted from outside.
 */
export interface TurnClock {
  now(): number;
  /** Starts (or restarts) a room's timer. `onExpire` runs once, at or after `deadlineAt`. */
  arm(roomCode: string, deadlineAt: number, onExpire: () => void): void;
  cancel(roomCode: string): void;
  /** How many rooms have a timer running. */
  readonly pending: number;
}

export class SystemTurnClock implements TurnClock {
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  now(): number {
    return Date.now();
  }

  arm(roomCode: string, deadlineAt: number, onExpire: () => void): void {
    this.cancel(roomCode);
    this.timeouts.set(
      roomCode,
      setTimeout(() => {
        this.timeouts.delete(roomCode);
        onExpire();
      }, Math.max(0, deadlineAt - Date.now()))
    );
  }

  cancel(roomCode: string): void {
    const existing = this.timeouts.get(roomCode);
    if (existing) {
      clearTimeout(existing);
      this.timeouts.delete(roomCode);
    }
  }

  get pending(): number {
    return this.timeouts.size;
  }
}
