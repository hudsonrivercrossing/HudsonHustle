import { describe, expect, it } from "vitest";
import { createRateLimiter, createServerApp } from "../src/app";

describe("createRateLimiter", () => {
  it("allows the limit within a window, then refuses until the window passes", () => {
    const limiter = createRateLimiter(3, 1000);
    expect([limiter.allow("a", 0), limiter.allow("a", 10), limiter.allow("a", 20), limiter.allow("a", 30)]).toEqual([true, true, true, false]);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("counts each key separately and can forget one", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(false);
    limiter.forget("a");
    expect(limiter.allow("a", 2)).toBe(true);
  });
});

describe("server limits", () => {
  it("refuses a burst of room creation from one address", async () => {
    const { app, close } = await createServerApp();
    try {
      const create = () =>
        app.inject({
          method: "POST",
          url: "/rooms",
          payload: { hostName: "Ava", playerCount: 2, configId: "v0.4-flushing-newark-airport", turnTimeLimitSeconds: 0 }
        });
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 12; attempt += 1) {
        statuses.push((await create()).statusCode);
      }
      expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true);
      expect(statuses.slice(10)).toEqual([429, 429]);
    } finally {
      await close();
    }
  });

  it("refuses an oversized request body", async () => {
    const { app, close } = await createServerApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/rooms",
        payload: { hostName: "x".repeat(20_000), playerCount: 2, configId: "v0.4-flushing-newark-airport", turnTimeLimitSeconds: 0 }
      });
      expect(response.statusCode).toBe(413);
    } finally {
      await close();
    }
  });
});
