/**
 * Tips that appear at the moment they are useful, one at a time, each at most once.
 * This replaces the nine-step tour that ran before the first move.
 */
export type CoachMoment =
  | "choose-tickets"
  | "your-turn"
  | "second-card"
  | "route-selected"
  | "city-selected"
  | "final-round";

export interface CoachHintCopy {
  eyebrow: string;
  title: string;
  body: string;
  /** Matches a `data-tour-target` on the gameplay screen. */
  target: "tickets" | "hand" | "market" | "board" | "turn" | "roster";
}

export const coachHints: Record<CoachMoment, CoachHintCopy> = {
  "choose-tickets": {
    eyebrow: "Tickets",
    title: "Pick your destinations",
    body: "Connect a ticket’s two stations to score it. A kept ticket you do not finish costs the same points, so keep the ones that share a path.",
    target: "tickets"
  },
  "your-turn": {
    eyebrow: "Your turn",
    title: "One action per turn",
    body: "Draw two cards, tap a route to claim it, tap a city to build a station, or draw tickets. Then the turn passes.",
    target: "turn"
  },
  "second-card": {
    eyebrow: "Drawing",
    title: "Take one more card",
    body: "A face-up locomotive counts as both of your cards, so it cannot be your second one.",
    target: "market"
  },
  "route-selected": {
    eyebrow: "Claiming",
    title: "Pay with matching cards",
    body: "One card per space, all one color; locomotives are wild and gray takes any color. Tunnels may cost up to three more; ferries need their locomotives.",
    target: "hand"
  },
  "city-selected": {
    eyebrow: "Stations",
    title: "A station borrows a rival's route",
    body: "It counts one rival route in that city toward your tickets. Stations cost one, two, then three cards; each one left unbuilt scores 4.",
    target: "hand"
  },
  "final-round": {
    eyebrow: "Final round",
    title: "Every other player gets one last turn",
    body: "A player is nearly out of trains, or no route is left. After these turns, tickets, stations and the longest network are scored.",
    target: "roster"
  }
};

export interface CoachContext {
  phase: "initialTickets" | "main" | "gameOver" | string;
  /** The viewer can act right now (their turn, nothing covering their hand). */
  canAct: boolean;
  /** Private info is covered, as during a pass-and-play handoff. */
  privateInfoHidden: boolean;
  choosingTickets: boolean;
  turnStage: string;
  routeSelected: boolean;
  citySelected: boolean;
  finalRound: boolean;
}

/** The single most relevant moment for what is on screen, or null when there is nothing to say. */
export function pickCoachMoment(context: CoachContext): CoachMoment | null {
  if (context.phase === "gameOver" || context.privateInfoHidden) return null;
  if (context.choosingTickets) return "choose-tickets";
  if (context.phase !== "main") return null;
  if (!context.canAct || context.turnStage === "awaitingHandoff") return null;
  if (context.routeSelected) return "route-selected";
  if (context.citySelected) return "city-selected";
  if (context.turnStage === "drawing") return "second-card";
  if (context.finalRound) return "final-round";
  return "your-turn";
}

const SEEN_KEY = "hh-coach-seen-v1";
/** Set by the old tour when it was finished or skipped; such players have already been taught. */
const LEGACY_TOUR_KEY = "hh-tour-seen-v2";
const everyMoment = Object.keys(coachHints) as CoachMoment[];

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readSeenMoments(): Set<CoachMoment> {
  const store = storage();
  if (!store) return new Set(everyMoment);
  if (store.getItem(LEGACY_TOUR_KEY)) return new Set(everyMoment);
  try {
    const parsed: unknown = JSON.parse(store.getItem(SEEN_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? everyMoment.filter((moment) => parsed.includes(moment)) : []);
  } catch {
    return new Set();
  }
}

export function markMomentSeen(moment: CoachMoment): Set<CoachMoment> {
  const seen = readSeenMoments();
  seen.add(moment);
  storage()?.setItem(SEEN_KEY, JSON.stringify([...seen]));
  return seen;
}

export function turnOffTips(): Set<CoachMoment> {
  storage()?.setItem(SEEN_KEY, JSON.stringify(everyMoment));
  return new Set(everyMoment);
}

/** Makes every tip eligible to show again. */
export function resetTips(): Set<CoachMoment> {
  const store = storage();
  store?.removeItem(SEEN_KEY);
  store?.removeItem(LEGACY_TOUR_KEY);
  return new Set();
}
