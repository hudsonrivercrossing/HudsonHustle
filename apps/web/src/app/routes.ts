import { useCallback, useEffect, useState } from "react";

export type Route =
  | { name: "gateway" }
  | { name: "local" }
  | { name: "online" }
  | { name: "guide" }
  | { name: "room"; roomCode: string };

const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

/** Unknown paths fall back to the gateway rather than a dead end. */
export function parseRoute(pathname: string): Route {
  const [first = "", second = ""] = pathname.split("/").filter(Boolean);
  if (first === "local" || first === "online" || first === "guide") {
    return { name: first };
  }
  const roomCode = second.toUpperCase();
  if (first === "room" && ROOM_CODE_PATTERN.test(roomCode)) {
    return { name: "room", roomCode };
  }
  return { name: "gateway" };
}

export function routePath(route: Route): string {
  switch (route.name) {
    case "gateway":
      return "/";
    case "room":
      return `/room/${route.roomCode}`;
    default:
      return `/${route.name}`;
  }
}

/** The current route, kept in step with the address bar and the back button. */
export function useRoute(): [Route, (route: Route, options?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const path = routePath(next);
    if (path !== window.location.pathname) {
      if (options?.replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
    }
    setRoute(next);
  }, []);

  return [route, navigate];
}
