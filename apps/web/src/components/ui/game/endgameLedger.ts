import { getCityName, type GameState, type MapConfig } from "@hudson-hustle/game-core";

type Player = GameState["players"][number];

export interface LedgerTicket {
  id: string;
  label: string;
  points: number;
}

/** One player's final score, split into the lines it is made of. The lines always add up to `total`. */
export interface EndgameLedger {
  playerId: string;
  name: string;
  color: Player["color"];
  /** Position at the table, so the count can be shown in seating order without giving the result away. */
  seat: number;
  rank: number;
  isWinner: boolean;
  total: number;
  routePoints: number;
  completed: LedgerTicket[];
  failed: LedgerTicket[];
  stationsLeft: number;
  stationBonus: number;
  longestLength: number;
  longestBonus: number;
}

export function buildEndgameLedgers(players: Player[], config: MapConfig): EndgameLedger[] {
  const ticketById = new Map(config.tickets.map((ticket) => [ticket.id, ticket]));
  const describe = (id: string): LedgerTicket => {
    const ticket = ticketById.get(id);
    return ticket
      ? { id, label: `${getCityName(config, ticket.from)} → ${getCityName(config, ticket.to)}`, points: ticket.points }
      : { id, label: "Unknown ticket", points: 0 };
  };
  const topScore = Math.max(...players.map((player) => player.score));
  const ordered = [...players].sort((left, right) => right.score - left.score);

  return ordered.map((player) => {
    const endgame = player.endgame;
    const ticketDelta = endgame?.ticketDelta ?? 0;
    const stationBonus = endgame?.stationBonus ?? 0;
    const longestBonus = endgame?.longestRouteBonus ?? 0;
    return {
      playerId: player.id,
      name: player.name,
      color: player.color,
      seat: players.indexOf(player),
      rank: ordered.filter((other) => other.score > player.score).length + 1,
      isWinner: player.score === topScore,
      total: player.score,
      routePoints: player.score - ticketDelta - stationBonus - longestBonus,
      completed: (endgame?.completedTicketIds ?? []).map(describe),
      failed: (endgame?.failedTicketIds ?? []).map(describe),
      stationsLeft: player.stationsLeft,
      stationBonus,
      longestLength: endgame?.longestRouteLength ?? 0,
      longestBonus
    };
  });
}

/** "Cy wins", or the names of everyone tied for first. */
export function describeWinner(ledgers: EndgameLedger[]): string {
  const winners = ledgers.filter((ledger) => ledger.isWinner).map((ledger) => ledger.name);
  if (winners.length === 1) {
    return `${winners[0]} wins`;
  }
  return `${winners.slice(0, -1).join(", ")} and ${winners[winners.length - 1]} tie`;
}

/** How far ahead the winner finished, worded for the line under the headline. */
export function describeMargin(ledgers: EndgameLedger[]): string {
  const [first, second] = ledgers;
  if (!first) {
    return "";
  }
  if (!second || first.total === second.total) {
    return `${first.total} points.`;
  }
  const gap = first.total - second.total;
  return `${first.total} points, ${gap} ahead of ${second.name}.`;
}

export function signed(points: number): string {
  return points < 0 ? `−${Math.abs(points)}` : `+${points}`;
}
