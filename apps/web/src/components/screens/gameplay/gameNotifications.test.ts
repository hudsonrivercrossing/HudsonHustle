import { describe, expect, it } from "vitest";
import type { GameEvent, MapConfig } from "@hudson-hustle/game-core";
import { notificationsFromEvents, type NotificationContext } from "./gameNotifications";

const context: NotificationContext = {
  players: [
    { id: "p1", name: "Ava" },
    { id: "p2", name: "Beau" }
  ],
  config: {
    cities: [
      { id: "sec", name: "Secaucus" },
      { id: "penn", name: "Penn District" }
    ],
    routes: [{ id: "sec-penn", from: "sec", to: "penn" }]
  } as unknown as MapConfig
};

let seq = 0;
function event(body: Record<string, unknown>): GameEvent {
  seq += 1;
  return { ...body, seq } as GameEvent;
}

describe("notificationsFromEvents", () => {
  it("holds a player's draws until their turn ends, then reports them together", () => {
    const first = notificationsFromEvents([event({ type: "card_drawn", playerId: "p1", source: "market", color: "amber" })], context, null);
    expect(first.messages).toEqual([]);
    expect(first.pendingDraws).toEqual({ playerId: "p1", faceUp: ["amber"], fromDeck: 0 });

    const second = notificationsFromEvents(
      [event({ type: "card_drawn", playerId: "p1", source: "deck" }), event({ type: "turn_started", playerId: "p2" })],
      context,
      first.pendingDraws
    );
    expect(second.messages).toEqual([{ message: "Ava took amber from the market and drew 1 card from the deck.", tone: "neutral" }]);
    expect(second.pendingDraws).toBeNull();
  });

  it("never names the color of a card drawn from the deck", () => {
    const { messages } = notificationsFromEvents(
      [
        event({ type: "card_drawn", playerId: "p1", source: "deck" }),
        event({ type: "card_drawn", playerId: "p1", source: "deck" }),
        event({ type: "turn_started", playerId: "p2" })
      ],
      context,
      null
    );
    expect(messages).toEqual([{ message: "Ava drew 2 cards from the deck.", tone: "neutral" }]);
  });

  it("names both cards taken from the open market", () => {
    const { messages } = notificationsFromEvents(
      [
        event({ type: "card_drawn", playerId: "p2", source: "market", color: "rose" }),
        event({ type: "card_drawn", playerId: "p2", source: "market", color: "ivory" }),
        event({ type: "turn_started", playerId: "p1" })
      ],
      context,
      null
    );
    expect(messages).toEqual([{ message: "Beau took rose and ivory from the market.", tone: "neutral" }]);
  });

  it("names the two stations of a claimed route instead of its id", () => {
    const { messages } = notificationsFromEvents(
      [event({ type: "route_claimed", playerId: "p2", routeId: "sec-penn", points: 4 })],
      context,
      null
    );
    expect(messages).toEqual([{ message: "Beau claimed Secaucus → Penn District for 4 points.", tone: "neutral" }]);
  });

  it("reports held draws before another kind of event", () => {
    const { messages } = notificationsFromEvents(
      [event({ type: "station_built", playerId: "p2", cityId: "penn" })],
      context,
      { playerId: "p1", faceUp: [], fromDeck: 1 }
    );
    expect(messages.map((entry) => entry.message)).toEqual(["Ava drew 1 card from the deck.", "Beau built a station in Penn District."]);
  });

  it("warns about the final round and celebrates the end", () => {
    const { messages } = notificationsFromEvents(
      [
        event({ type: "final_round_triggered", playerId: "p1" }),
        event({ type: "tunnel_failed", playerId: "p1", routeId: "sec-penn" }),
        event({ type: "game_over" })
      ],
      context,
      null
    );
    expect(messages).toEqual([
      { message: "Ava triggered the final round.", tone: "warning" },
      { message: "Ava could not cover the tunnel surcharge on Secaucus → Penn District.", tone: "warning" },
      { message: "Final scores are in.", tone: "success" }
    ]);
  });

  it("stays quiet for ticket bookkeeping", () => {
    const { messages } = notificationsFromEvents(
      [
        event({ type: "tickets_kept", playerId: "p1", count: 2, initial: true }),
        event({ type: "tickets_drawn", playerId: "p1", count: 3 })
      ],
      context,
      null
    );
    expect(messages).toEqual([]);
  });

  it("falls back to ids when a player or route is unknown", () => {
    const { messages } = notificationsFromEvents(
      [event({ type: "route_claimed", playerId: "ghost", routeId: "nowhere", points: 1 })],
      context,
      null
    );
    expect(messages[0].message).toBe("A player claimed nowhere for 1 point.");
  });
});
