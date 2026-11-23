import { describe, expect, it } from "vitest";
import { startGame } from "@hudson-hustle/game-core";
import { getHudsonHustleMapByConfigId, hudsonHustleCurrentConfigId } from "@hudson-hustle/game-data";
import { isRestorableGame } from "./localGame.utils";

const map = getHudsonHustleMapByConfigId(hudsonHustleCurrentConfigId);
const fresh = () => JSON.parse(JSON.stringify(startGame(map, { playerNames: ["A", "B"], seed: 3 })));

describe("isRestorableGame", () => {
  it("accepts a game this build just made", () => {
    expect(isRestorableGame(fresh())).toBe(true);
  });

  it("rejects values that are not a game", () => {
    expect(isRestorableGame(null)).toBe(false);
    expect(isRestorableGame("{}")).toBe(false);
    expect(isRestorableGame({ version: 1 })).toBe(false);
  });

  it("rejects a save from another save version", () => {
    expect(isRestorableGame({ ...fresh(), version: 2 })).toBe(false);
  });

  it("rejects a save whose claimed route is not on any map this build ships", () => {
    const game = fresh();
    game.routeClaims = [{ routeId: "no-such-route", playerId: game.players[0].id }];
    expect(isRestorableGame(game)).toBe(false);
  });

  it("rejects a save for a map this build does not know", () => {
    expect(isRestorableGame({ ...fresh(), mapId: "atlantis" })).toBe(false);
  });
});
