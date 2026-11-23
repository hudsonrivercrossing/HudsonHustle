import { beforeEach, describe, expect, it } from "vitest";
import { readLastLocalSetup, readLocalSaveMeta, saveLastLocalSetup, saveLocalSaveMeta, type LastLocalSetup } from "./localSetupStorage";

const setup: LastLocalSetup = {
  playerCount: 3,
  names: ["Ava", "Beau", "Cy", "Player 4"],
  botSeatIds: ["seat-3"],
  botDifficulty: "hard",
  configId: "berlin",
  turnTimeLimitSeconds: 45
};

describe("last local setup", () => {
  beforeEach(() => window.localStorage.clear());

  it("returns what was saved", () => {
    saveLastLocalSetup(setup);
    expect(readLastLocalSetup(["berlin", "nyc"])).toEqual(setup);
  });

  it("returns nothing when no setup was saved", () => {
    expect(readLastLocalSetup(["berlin"])).toBeNull();
  });

  it("ignores a setup whose map is no longer offered", () => {
    saveLastLocalSetup(setup);
    expect(readLastLocalSetup(["nyc"])).toBeNull();
  });

  it.each([
    ["not JSON", "{oops"],
    ["a wrong player count", JSON.stringify({ ...setup, playerCount: 7 })],
    ["too few names", JSON.stringify({ ...setup, names: ["Ava"] })],
    ["an overlong name", JSON.stringify({ ...setup, names: ["x".repeat(80), "b", "c", "d"] })],
    ["a negative timer", JSON.stringify({ ...setup, turnTimeLimitSeconds: -5 })],
    ["bot seats that are not a list", JSON.stringify({ ...setup, botSeatIds: "seat-2" })]
  ])("ignores %s", (_label, raw) => {
    window.localStorage.setItem("hudson-hustle-local-setup-v1", raw);
    expect(readLastLocalSetup(["berlin"])).toBeNull();
  });
});

describe("local save meta", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips and clears", () => {
    const meta = { configId: "berlin", botPlayerIds: ["player-2"], botDifficulty: "easy" as const, turnTimeLimitSeconds: 30 };
    saveLocalSaveMeta(meta);
    expect(readLocalSaveMeta()).toEqual(meta);
    saveLocalSaveMeta(null);
    expect(readLocalSaveMeta()).toBeNull();
  });

  it("treats a record from before difficulty existed as standard", () => {
    window.localStorage.setItem("hudson-hustle-save-meta-v1", JSON.stringify({ configId: "berlin", botPlayerIds: [], turnTimeLimitSeconds: 0 }));
    expect(readLocalSaveMeta()?.botDifficulty).toBe("standard");
  });

  it("ignores a malformed record", () => {
    window.localStorage.setItem("hudson-hustle-save-meta-v1", JSON.stringify({ configId: 3 }));
    expect(readLocalSaveMeta()).toBeNull();
  });
});
