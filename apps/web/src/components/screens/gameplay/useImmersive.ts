import { useCallback, useEffect, useState } from "react";

/** How this device can give the table the whole screen. */
export type FullScreenMode =
  /** The browser can do it on request (Android, iPad, desktop). */
  | "button"
  /** It cannot (iPhone Safari): the only way is to open the game from the home screen. */
  | "home-screen"
  /** Nothing to offer: already running as an installed app, or a mouse-driven browser without the feature. */
  | "none";

function isInstalled(): boolean {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || standaloneNavigator.standalone === true;
}

export function detectFullScreenMode(): FullScreenMode {
  if (isInstalled()) return "none";
  if (document.fullscreenEnabled) return "button";
  return window.matchMedia("(pointer: coarse)").matches ? "home-screen" : "none";
}

/** Full screen for the whole page, where the browser allows it. */
export function useFullScreen(): { mode: FullScreenMode; active: boolean; toggle: () => void } {
  const [mode] = useState(detectFullScreenMode);
  const [active, setActive] = useState(() => document.fullscreenElement !== null);

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    // A refusal (the user's browser setting, an embedded frame) leaves the page as it was, which is the right outcome.
    const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: "hide" });
    request.catch(() => undefined);
  }, []);

  return { mode, active, toggle };
}

interface WakeLockHandle {
  release: () => Promise<void>;
}

/** Keeps the screen from dimming while `on` is true: a player waiting for their turn is not touching it. */
export function useScreenAwake(on: boolean): void {
  useEffect(() => {
    const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> } }).wakeLock;
    if (!on || !wakeLock) return;
    let handle: WakeLockHandle | null = null;
    let cancelled = false;

    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      // Refused on low battery or by the browser; the game plays the same either way.
      wakeLock
        .request("screen")
        .then((next) => {
          if (cancelled) void next.release();
          else handle = next;
        })
        .catch(() => undefined);
    };

    acquire();
    // The browser drops the lock whenever the tab is hidden, so it is taken again on return.
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void handle?.release();
    };
  }, [on]);
}
