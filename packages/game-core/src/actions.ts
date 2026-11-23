import { trainCardColors, type GameAction, type TrainCardColor } from "./types.js";

const MAX_ID_LENGTH = 120;
const MAX_TICKET_IDS = 8;

function fail(reason: string): never {
  throw new Error(`Invalid action: ${reason}.`);
}

function readId(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ID_LENGTH) {
    fail(`${field} must be a non-empty string`);
  }
  return value;
}

function readColor(value: unknown): TrainCardColor {
  if (typeof value !== "string" || !(trainCardColors as readonly string[]).includes(value)) {
    fail("color must be a payment color");
  }
  return value as TrainCardColor;
}

function readTicketIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_TICKET_IDS) {
    fail("keptTicketIds must be a short list");
  }
  const ids = value.map((entry) => readId(entry, "keptTicketIds entry"));
  if (new Set(ids).size !== ids.length) {
    fail("keptTicketIds contains duplicates");
  }
  return ids;
}

/**
 * Turns untrusted input (a socket payload, a restored save) into a GameAction.
 * The result carries only the fields the action defines.
 */
export function parseGameAction(input: unknown): GameAction {
  if (typeof input !== "object" || input === null) {
    fail("expected an object");
  }
  const raw = input as Record<string, unknown>;

  switch (raw.type) {
    case "select_initial_tickets":
    case "keep_drawn_tickets":
      return { type: raw.type, keptTicketIds: readTicketIds(raw.keptTicketIds) };
    case "draw_card": {
      if (raw.source === "deck") {
        return { type: "draw_card", source: "deck" };
      }
      if (raw.source === "market") {
        const index = raw.marketIndex;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
          fail("marketIndex must be a non-negative integer");
        }
        return { type: "draw_card", source: "market", marketIndex: index };
      }
      return fail("draw source must be deck or market");
    }
    case "claim_route":
      return { type: "claim_route", routeId: readId(raw.routeId, "routeId"), color: readColor(raw.color) };
    case "build_station":
      return { type: "build_station", cityId: readId(raw.cityId, "cityId"), color: readColor(raw.color) };
    case "draw_tickets":
    case "cancel_ticket_draw":
    case "advance_turn":
      return { type: raw.type };
    default:
      return fail("unknown action type");
  }
}
