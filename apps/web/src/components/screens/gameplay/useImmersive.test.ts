import { afterEach, describe, expect, it, vi } from "vitest";
import { detectFullScreenMode } from "./useImmersive";

function device({ fullscreen, coarse, installed }: { fullscreen: boolean; coarse: boolean; installed: boolean }): void {
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: fullscreen });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("pointer: coarse") ? coarse : query.includes("display-mode: standalone") ? installed : false
  }));
}

describe("detectFullScreenMode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers the button where the browser can go full screen", () => {
    device({ fullscreen: true, coarse: true, installed: false });
    expect(detectFullScreenMode()).toBe("button");
  });

  it("points an iPhone at the home screen, the only way it has", () => {
    device({ fullscreen: false, coarse: true, installed: false });
    expect(detectFullScreenMode()).toBe("home-screen");
  });

  it("offers nothing once the game is opened from the home screen", () => {
    device({ fullscreen: true, coarse: true, installed: true });
    expect(detectFullScreenMode()).toBe("none");
  });

  it("offers nothing to a desktop browser without the feature", () => {
    device({ fullscreen: false, coarse: false, installed: false });
    expect(detectFullScreenMode()).toBe("none");
  });
});
