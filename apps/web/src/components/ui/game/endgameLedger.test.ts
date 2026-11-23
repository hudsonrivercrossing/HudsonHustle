import { describe, expect, it } from "vitest";
import type { GameState, MapConfig } from "@hudson-hustle/game-core";
import { buildEndgameLedgers, describeMargin, describeWinner, signed } from "./endgameLedger";

const config = {
  cities: [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
    { id: "c", name: "Gamma" }
  ],
  tickets: [
    { id: "t-a-b", from: "a", to: "b", points: 9 },
    { id: "t-b-c", from: "b", to: "c", points: 5 }
  ]
} as unknown as MapConfig;

function player(overrides: Record<string, unknown>): GameState["players"][number] {
  return { id: "p", name: "P", color: "teal", score: 0, stationsLeft: 0, ...overrides } as unknown as GameState["players"][number];
}

describe("buildEndgameLedgers", () => {
  const players = [
    player({
      id: "p1",
      name: "Ada",
      score: 30,
      stationsLeft: 2,
      endgame: { ticketDelta: 4, completedTicketIds: ["t-a-b"], failedTicketIds: ["t-b-c"], stationBonus: 8, longestRouteLength: 7, longestRouteBonus: 0 }
    }),
    player({
      id: "p2",
      name: "Cy",
      score: 52,
      stationsLeft: 1,
      endgame: { ticketDelta: 14, completedTicketIds: ["t-a-b", "t-b-c"], failedTicketIds: [], stationBonus: 4, longestRouteLength: 12, longestRouteBonus: 10 }
    })
  ];
  const ledgers = buildEndgameLedgers(players, config);

  it("orders players by score and marks the winner", () => {
    expect(ledgers.map((ledger) => [ledger.name, ledger.rank, ledger.isWinner])).toEqual([
      ["Cy", 1, true],
      ["Ada", 2, false]
    ]);
  });

  it("names tickets by their cities, never by id", () => {
    expect(ledgers[1].completed).toEqual([{ id: "t-a-b", label: "Alpha → Beta", points: 9 }]);
    expect(ledgers[1].failed).toEqual([{ id: "t-b-c", label: "Beta → Gamma", points: 5 }]);
  });

  it("splits the total into lines that add back up to it", () => {
    for (const ledger of ledgers) {
      const tickets = ledger.completed.reduce((sum, ticket) => sum + ticket.points, 0) - ledger.failed.reduce((sum, ticket) => sum + ticket.points, 0);
      expect(ledger.routePoints + tickets + ledger.stationBonus + ledger.longestBonus).toBe(ledger.total);
    }
    expect(ledgers[1].routePoints).toBe(18);
  });

  it("words the headline and the margin", () => {
    expect(describeWinner(ledgers)).toBe("Cy wins");
    expect(describeMargin(ledgers)).toBe("52 points, 22 ahead of Ada.");
  });

  it("names everyone in a tie", () => {
    const tied = buildEndgameLedgers([player({ id: "p1", name: "Ada", score: 40 }), player({ id: "p2", name: "Ben", score: 40 }), player({ id: "p3", name: "Cy", score: 12 })], config);
    expect(describeWinner(tied)).toBe("Ada and Ben tie");
    expect(tied.map((ledger) => ledger.rank)).toEqual([1, 1, 3]);
    expect(describeMargin(tied)).toBe("40 points.");
  });
});

describe("signed", () => {
  it("uses a real minus sign", () => {
    expect(signed(7)).toBe("+7");
    expect(signed(0)).toBe("+0");
    expect(signed(-5)).toBe("−5");
  });
});
