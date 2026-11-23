import { describe, expect, it } from "vitest";
import { createCorsOriginMatcher, createSocketIoCorsOriginMatcher } from "../src/app.js";

describe("createCorsOriginMatcher", () => {
  it("allows exact local origins and wildcard vercel origins", async () => {
    const matcher = createCorsOriginMatcher(["https://*.vercel.app", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]);

    const allowPreview = await resolveOriginCheck(matcher, "https://hudson-hustle-git-develop-djfan1s-projects.vercel.app");
    const allowLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5173");
    const allowFallbackLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5174");
    const blockOther = await resolveOriginCheck(matcher, "https://example.com");

    expect(allowPreview).toBe(true);
    expect(allowLocal).toBe(true);
    expect(allowFallbackLocal).toBe(true);
    expect(blockOther).toBe(false);
  });
});

describe("createSocketIoCorsOriginMatcher", () => {
  it("allows exact local origins and wildcard vercel origins via callback", async () => {
    const matcher = createSocketIoCorsOriginMatcher(["https://*.vercel.app", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]);

    const allowPreview = await resolveOriginCheck(matcher, "https://hudson-hustle-git-develop-djfan1s-projects.vercel.app");
    const allowLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5173");
    const allowFallbackLocal = await resolveOriginCheck(matcher, "http://127.0.0.1:5174");
    const allowNoOrigin = await resolveOriginCheck(matcher, undefined);
    const blockOther = await resolveOriginCheck(matcher, "https://example.com");

    expect(allowPreview).toBe(true);
    expect(allowLocal).toBe(true);
    expect(allowFallbackLocal).toBe(true);
    expect(allowNoOrigin).toBe(true);
    expect(blockOther).toBe(false);
  });
});

describe("an empty origin list", () => {
  it("allows no browser origin, for HTTP and for sockets", async () => {
    expect(await resolveOriginCheck(createCorsOriginMatcher([]), "https://example.com")).toBe(false);
    expect(await resolveOriginCheck(createSocketIoCorsOriginMatcher([]), "https://example.com")).toBe(false);
  });

  it("still serves requests that are not from a browser page", async () => {
    expect(await resolveOriginCheck(createSocketIoCorsOriginMatcher([]), undefined)).toBe(true);
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
    const promiseMatcher = matcher as (origin: string | undefined) => Promise<string | boolean>;
    return promiseMatcher(origin).then((result) => Boolean(result));
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
