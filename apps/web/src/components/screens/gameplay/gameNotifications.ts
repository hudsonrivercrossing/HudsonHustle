import { getCityName, type GameEvent, type MapConfig } from "@hudson-hustle/game-core";
import type { GameplayNotification } from "../../ui/game";

export interface NotificationContext {
  players: Array<{ id: string; name: string }>;
  config: MapConfig;
}

/** Cards one player has drawn so far this turn, held back so the turn reads as one notification. */
export interface PendingDraws {
  playerId: string;
  /** Faces taken from the open market, which everyone saw. */
  faceUp: string[];
  /** How many came from the deck; their faces are the drawer's secret. */
  fromDeck: number;
}

function describeDraws(draws: PendingDraws): string {
  const parts: string[] = [];
  if (draws.faceUp.length > 0) {
    parts.push(`took ${draws.faceUp.join(" and ")} from the market`);
  }
  if (draws.fromDeck > 0) {
    parts.push(`drew ${draws.fromDeck} card${draws.fromDeck === 1 ? "" : "s"} from the deck`);
  }
  return parts.join(" and ");
}

export type NotificationMessage = Pick<GameplayNotification, "message" | "tone">;

function routeName(config: MapConfig, routeId: string): string {
  const route = config.routes.find((candidate) => candidate.id === routeId);
  return route ? `${getCityName(config, route.from)} → ${getCityName(config, route.to)}` : routeId;
}

/**
 * Turns game events into the notifications players see.
 * Pure: pass in the draws held from earlier calls and keep the ones it returns.
 */
export function notificationsFromEvents(
  events: GameEvent[],
  context: NotificationContext,
  pendingDraws: PendingDraws | null
): { messages: NotificationMessage[]; pendingDraws: PendingDraws | null } {
  const messages: NotificationMessage[] = [];
  let pending = pendingDraws;
  const nameOf = (playerId: string) => context.players.find((player) => player.id === playerId)?.name ?? "A player";

  function flushDraws() {
    if (pending && pending.faceUp.length + pending.fromDeck > 0) {
      messages.push({ message: `${nameOf(pending.playerId)} ${describeDraws(pending)}.`, tone: "neutral" });
    }
    pending = null;
  }

  for (const event of events) {
    switch (event.type) {
      case "card_drawn":
        if (pending && pending.playerId !== event.playerId) {
          flushDraws();
        }
        pending = {
          playerId: event.playerId,
          faceUp: event.source === "market" ? [...(pending?.faceUp ?? []), event.color] : pending?.faceUp ?? [],
          fromDeck: (pending?.fromDeck ?? 0) + (event.source === "deck" ? 1 : 0)
        };
        break;
      case "route_claimed":
        flushDraws();
        messages.push({
          message: `${nameOf(event.playerId)} claimed ${routeName(context.config, event.routeId)} for ${event.points} point${event.points === 1 ? "" : "s"}.`,
          tone: "neutral"
        });
        break;
      case "tunnel_failed":
        flushDraws();
        messages.push({
          message: `${nameOf(event.playerId)} could not cover the tunnel surcharge on ${routeName(context.config, event.routeId)}.`,
          tone: "warning"
        });
        break;
      case "station_built":
        flushDraws();
        messages.push({ message: `${nameOf(event.playerId)} built a station in ${getCityName(context.config, event.cityId)}.`, tone: "neutral" });
        break;
      case "final_round_triggered":
        flushDraws();
        messages.push({ message: `${nameOf(event.playerId)} triggered the final round.`, tone: "warning" });
        break;
      case "game_over":
        flushDraws();
        messages.push({ message: "Final scores are in.", tone: "success" });
        break;
      case "turn_started":
        flushDraws();
        break;
      case "tickets_kept":
      case "tickets_drawn":
        break;
    }
  }

  return { messages, pendingDraws: pending };
}
