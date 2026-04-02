import { describe, expect, it } from "vitest";
import { createCorsOriginMatcher, createSocketIoCorsOriginMatcher } from "../src/app.js";

describe("createCorsOriginMatcher", () => {
  it("allows exact local origins and wildcard vercel origins", async () => {
    const matcher = createCorsOriginMatcher(["https://*.vercel.app", "http://127.0.0.1:5173"]);

    const allowPreview = await resolveOriginCheck(matcher, "https://hudson-hustle-git-develop-djfan1s-projects.vercel.app");
    const allowLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5173");
    const blockOther = await resolveOriginCheck(matcher, "https://example.com");

    expect(allowPreview).toBe(true);
    expect(allowLocal).toBe(true);
    expect(blockOther).toBe(false);
  });
});

describe("createSocketIoCorsOriginMatcher", () => {
  it("allows exact local origins and wildcard vercel origins via callback", async () => {
    const matcher = createSocketIoCorsOriginMatcher(["https://*.vercel.app", "http://127.0.0.1:5173"]);

    const allowPreview = await resolveOriginCheck(matcher, "https://hudson-hustle-git-develop-djfan1s-projects.vercel.app");
    const allowLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5173");
    const allowNoOrigin = await resolveOriginCheck(matcher, undefined);
    const blockOther = await resolveOriginCheck(matcher, "https://example.com");

    expect(allowPreview).toBe(true);
    expect(allowLocal).toBe(true);
    expect(allowNoOrigin).toBe(true);
    expect(blockOther).toBe(false);
  });
});

function resolveOriginCheck(
  matcher:
    | true
    | ((origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void)
    | ((origin: string | undefined) => Promise<string | boolean>),
  origin: string | undefined
) {
  if (matcher === true) {
    return Promise.resolve(true);
  }

  if (matcher.length <= 1) {
    return Promise.resolve(matcher(origin)).then((result) => Boolean(result));
  }

  return new Promise<boolean>((resolve, reject) => {
    matcher(origin, (error, allow) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Boolean(allow));
    });
  });
}
