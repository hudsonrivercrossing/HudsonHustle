import { useEffect, useState, type RefObject } from "react";
import type { GameAction, GameState } from "@hudson-hustle/game-core";
import { storageGet, storageSet } from "../../shared/safeStorage";

/** The phone arrangement of the table: a narrow screen, or a phone turned on its side. Mirrors the CSS. */
export const PHONE_TABLE = "(max-width: 760px), (orientation: landscape) and (max-height: 500px) and (min-width: 560px)";

const PAN_HINT_KEY = "hudson-hustle:pan-hint-seen";

/** Whether the table is in its phone arrangement right now; follows rotation and resizing. */
export function usePhoneTable(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_TABLE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE_TABLE);
    const onChange = () => setPhone(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return phone;
}

/** A short tick under the finger for the moves that put something on the table. Android only: iOS has no such API. */
export function buzzFor(action: GameAction): void {
  if (action.type !== "draw_card" && action.type !== "claim_route" && action.type !== "build_station") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate?.(action.type === "draw_card" ? 8 : 16);
}

/**
 * On a phone held upright the board is wider than the screen. When a route is claimed, by anyone,
 * the board slides so that route is in view: a move the player cannot see did not happen for them.
 */
export function useBoardFollow(board: RefObject<HTMLElement>, events: GameState["events"]): void {
  const lastClaim = [...events].reverse().find((event) => event.type === "route_claimed");
  const routeId = lastClaim?.type === "route_claimed" ? lastClaim.routeId : null;
  const seq = lastClaim?.seq ?? null;

  useEffect(() => {
    const scroller = board.current;
    if (!scroller || !routeId || scroller.scrollWidth <= scroller.clientWidth + 1) return;
    const route = scroller.querySelector(`[data-route-id="${routeId}"]`);
    if (!route) return;
    const box = route.getBoundingClientRect();
    const frame = scroller.getBoundingClientRect();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left: scroller.scrollLeft + box.left + box.width / 2 - (frame.left + frame.width / 2),
      top: scroller.scrollTop + box.top + box.height / 2 - (frame.top + frame.height / 2),
      behavior: calm ? "auto" : "smooth"
    });
  }, [board, routeId, seq]);
}

/** True until the player has moved the board once on this device; then the hint is never shown again. */
export function usePanHint(board: RefObject<HTMLElement>): boolean {
  const [show, setShow] = useState(() => storageGet(PAN_HINT_KEY) === null && window.matchMedia(PHONE_TABLE).matches);

  useEffect(() => {
    const scroller = board.current;
    if (!show || !scroller) return;
    const seen = () => {
      storageSet(PAN_HINT_KEY, "1");
      setShow(false);
    };
    scroller.addEventListener("scroll", seen, { once: true, passive: true });
    return () => scroller.removeEventListener("scroll", seen);
  }, [board, show]);

  return show;
}
