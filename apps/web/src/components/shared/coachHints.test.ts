import { beforeEach, describe, expect, it } from "vitest";
import { coachHints, markMomentSeen, pickCoachMoment, readSeenMoments, resetTips, turnOffTips, type CoachContext } from "./coachHints";

const idle: CoachContext = {
  phase: "main",
  canAct: true,
  privateInfoHidden: false,
  choosingTickets: false,
  turnStage: "idle",
  routeSelected: false,
  citySelected: false,
  finalRound: false
};

describe("pickCoachMoment", () => {
  it("explains tickets while the player is choosing them, before anything else", () => {
    expect(pickCoachMoment({ ...idle, phase: "initialTickets", choosingTickets: true })).toBe("choose-tickets");
    expect(pickCoachMoment({ ...idle, choosingTickets: true, routeSelected: true })).toBe("choose-tickets");
  });

  it("follows what the player is doing on their turn", () => {
    expect(pickCoachMoment(idle)).toBe("your-turn");
    expect(pickCoachMoment({ ...idle, routeSelected: true })).toBe("route-selected");
    expect(pickCoachMoment({ ...idle, citySelected: true })).toBe("city-selected");
    expect(pickCoachMoment({ ...idle, turnStage: "drawing" })).toBe("second-card");
    expect(pickCoachMoment({ ...idle, finalRound: true })).toBe("final-round");
  });

  it("stays quiet when the player cannot act or cannot see their hand", () => {
    expect(pickCoachMoment({ ...idle, canAct: false })).toBeNull();
    expect(pickCoachMoment({ ...idle, privateInfoHidden: true, choosingTickets: true })).toBeNull();
    expect(pickCoachMoment({ ...idle, turnStage: "awaitingHandoff" })).toBeNull();
    expect(pickCoachMoment({ ...idle, phase: "gameOver" })).toBeNull();
  });

  it("has copy for every moment it can pick", () => {
    for (const hint of Object.values(coachHints)) {
      expect(hint.title.length).toBeGreaterThan(0);
      expect(hint.body.length).toBeGreaterThan(0);
    }
  });
});

describe("seen tips", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts with nothing seen and remembers each tip once dismissed", () => {
    expect(readSeenMoments().size).toBe(0);
    markMomentSeen("your-turn");
    expect([...readSeenMoments()]).toEqual(["your-turn"]);
  });

  it("treats a player who finished the old tour as already taught", () => {
    window.localStorage.setItem("hh-tour-seen-v2", "1");
    expect(readSeenMoments().size).toBe(Object.keys(coachHints).length);
  });

  it("turns every tip off, and back on from the guide", () => {
    turnOffTips();
    expect(readSeenMoments().size).toBe(Object.keys(coachHints).length);
    window.localStorage.setItem("hh-tour-seen-v2", "1");
    resetTips();
    expect(readSeenMoments().size).toBe(0);
  });

  it("ignores a corrupted record", () => {
    window.localStorage.setItem("hh-coach-seen-v1", "{not json");
    expect(readSeenMoments().size).toBe(0);
  });
});
