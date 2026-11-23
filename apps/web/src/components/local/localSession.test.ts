// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { getCurrentPlayer, type GameState } from "@hudson-hustle/game-core";
import { hudsonHustleCurrentConfigId } from "@hudson-hustle/game-data";
import { LOCAL_SAVE_KEY, type LocalStartSetup } from "./localGame.utils";
import {
  actInSession,
  clearSavedSession,
  isBotTurn,
  passLaptop,
  playBotTurns,
  readSavedSession,
  rematchSession,
  saveSession,
  showHand,
  startSession,
  type LocalSession
} from "./localSession";

const META_KEY = "hudson-hustle-save-meta-v1";

const setup = (overrides: Partial<LocalStartSetup> = {}): LocalStartSetup => ({
  playerNames: ["Ada", "Ben"],
  botSeatIds: [],
  botDifficulty: "standard",
  configId: hudsonHustleCurrentConfigId,
  turnTimeLimitSeconds: 0,
  ...overrides
});

/** Each human keeps their first two starting tickets and takes the laptop. */
function throughStartingTickets(session: LocalSession): LocalSession {
  let next = session;
  while (next.game.phase === "initialTickets" && !isBotTurn(next)) {
    const keep = getCurrentPlayer(next.game).pendingTickets.slice(0, 2).map((ticket) => ticket.id);
    next = showHand(actInSession(next, { type: "select_initial_tickets", keptTicketIds: keep }));
  }
  return next;
}

beforeEach(() => window.localStorage.clear());

describe("a local session", () => {
  it("starts with the first player's hand on screen", () => {
    const session = startSession(setup());
    expect(session.visibility).toBe("visible");
    expect(session.game.players.map((player) => player.name)).toEqual(["Ada", "Ben"]);
    expect(isBotTurn(session)).toBe(false);
  });

  it("covers the screen when starting tickets pass to the next player", () => {
    const first = startSession(setup());
    const keep = getCurrentPlayer(first.game).pendingTickets.slice(0, 2).map((ticket) => ticket.id);
    const next = actInSession(first, { type: "select_initial_tickets", keptTicketIds: keep });
    expect(next.visibility).toBe("handoff");
    expect(getCurrentPlayer(next.game).name).toBe("Ben");
  });

  it("keeps the same player in front of the screen after a move, until they pass the laptop", () => {
    const playing = throughStartingTickets(startSession(setup()));
    const mover = getCurrentPlayer(playing.game).name;

    let turn = actInSession(playing, { type: "draw_card", source: "deck" });
    turn = actInSession(turn, { type: "draw_card", source: "deck" });
    expect(turn.visibility).toBe("visible");
    expect(getCurrentPlayer(turn.game).name).toBe(mover);
    expect(turn.game.turn.stage).toBe("awaitingHandoff");

    const passed = passLaptop(turn);
    expect(passed.visibility).toBe("handoff");
    expect(getCurrentPlayer(passed.game).name).not.toBe(mover);
    expect(passed.previousTurnSummary).toBe(turn.game.turn.summary);
  });

  it("throws on a move the rules refuse and leaves the session as it was", () => {
    const playing = throughStartingTickets(startSession(setup()));
    expect(() => actInSession(playing, { type: "claim_route", routeId: "no-such-route", color: "amber" })).toThrow();
  });

  it("plays a bot's turns and hands back to the human", () => {
    const withBot = throughStartingTickets(startSession(setup({ playerNames: ["Ada", "Bot 1"], botSeatIds: ["seat-2"] })));
    expect(withBot.botPlayerIds).toEqual(["player-2"]);
    expect(isBotTurn(withBot)).toBe(true);

    const after = playBotTurns(withBot);
    expect(isBotTurn(after)).toBe(false);
    expect(after.visibility).toBe("handoff");
    expect(after.previousTurnSummary).toBe("Bot 1 (bot) played.");
  });

  it("starts a rematch for the same table", () => {
    const first = throughStartingTickets(startSession(setup({ playerNames: ["Ada", "Bot 1"], botSeatIds: ["seat-2"], turnTimeLimitSeconds: 60 })));
    const again = rematchSession(first);
    expect(again.game.phase).toBe("initialTickets");
    expect(again.game.players.map((player) => player.name)).toEqual(["Ada", "Bot 1"]);
    expect(again.botPlayerIds).toEqual(first.botPlayerIds);
    expect(again.turnTimeLimitSeconds).toBe(60);
    expect(again.visibility).toBe("visible");
  });
});

describe("saving a local session", () => {
  it("comes back with its settings, behind a handover", () => {
    const session = throughStartingTickets(startSession(setup({ playerNames: ["Ada", "Bot 1"], botSeatIds: ["seat-2"], botDifficulty: "hard", turnTimeLimitSeconds: 45 })));
    saveSession(session);

    const restored = readSavedSession();
    expect(restored).not.toBeNull();
    expect(restored!.game).toEqual(session.game);
    expect(restored!.botPlayerIds).toEqual(["player-2"]);
    expect(restored!.botDifficulty).toBe("hard");
    expect(restored!.turnTimeLimitSeconds).toBe(45);
    expect(restored!.visibility).toBe("handoff");
  });

  it("clears the game and its settings together", () => {
    saveSession(startSession(setup()));
    clearSavedSession();
    expect(window.localStorage.getItem(LOCAL_SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(META_KEY)).toBeNull();
    expect(readSavedSession()).toBeNull();
  });

  it("resumes a save written before the settings record, the log count and the event list existed", () => {
    const game = JSON.parse(JSON.stringify(startSession(setup({ playerNames: ["Ada", "Bot 2"] })).game)) as Record<string, unknown>;
    delete game.logSequence;
    delete game.events;
    window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(game));

    const restored = readSavedSession();
    expect(restored).not.toBeNull();
    expect(restored!.game.events).toEqual([]);
    // With no settings record, a seat named like a bot is taken to be one.
    expect(restored!.botPlayerIds).toEqual(["player-2"]);
  });

  it.each([
    ["not JSON", "{oops"],
    ["another save version", JSON.stringify({ ...startSession(setup()).game, version: 2 })],
    ["a map this build does not have", JSON.stringify({ ...startSession(setup()).game, mapId: "atlantis" })],
    [
      "a claimed route that is not on the map",
      JSON.stringify({ ...startSession(setup()).game, routeClaims: [{ routeId: "no-such-route", playerId: "player-1" }] } satisfies Omit<GameState, "routeClaims"> & { routeClaims: unknown })
    ]
  ])("throws away a save that is %s", (_label, stored) => {
    window.localStorage.setItem(LOCAL_SAVE_KEY, stored);
    expect(readSavedSession()).toBeNull();
    expect(window.localStorage.getItem(LOCAL_SAVE_KEY)).toBeNull();
  });
});
