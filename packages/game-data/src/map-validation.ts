import { trainCardColors } from "@hudson-hustle/game-core";
import type { SnapshotMap, SnapshotRules, SnapshotTickets } from "./config-types.js";

const ROUTE_TYPES = ["normal", "tunnel", "ferry"];
const ROUTE_COLORS: readonly string[] = [...trainCardColors, "gray"];
const MAX_ROUTE_LENGTH = 6;

/**
 * Everything wrong with a map snapshot, as plain sentences; an empty list means it can be played.
 * Snapshots are hand-edited JSON, so nothing about them is taken on trust: a misspelt route type or a
 * ticket to a station that was switched off is reported here instead of surfacing mid-game.
 */
export function findSnapshotProblems(map: SnapshotMap, tickets: SnapshotTickets, rules: SnapshotRules): string[] {
  const problems: string[] = [];
  const stationIds = map.stations.map((station) => station.id);
  const activeIds = new Set(map.stations.filter((station) => station.active).map((station) => station.id));

  for (const id of duplicates(stationIds)) {
    problems.push(`station id "${id}" is used more than once`);
  }
  for (const station of map.stations.filter((item) => item.active)) {
    if (station.boardX < 0 || station.boardX > map.board.width || station.boardY < 0 || station.boardY > map.board.height) {
      problems.push(`station "${station.id}" is off the board at ${station.boardX}, ${station.boardY}`);
    }
  }

  for (const id of duplicates(map.routes.map((route) => route.id))) {
    problems.push(`route id "${id}" is used more than once`);
  }
  for (const route of map.routes) {
    const where = `route "${route.id}"`;
    if (!ROUTE_TYPES.includes(route.type)) {
      problems.push(`${where} has type "${route.type}"; expected one of ${ROUTE_TYPES.join(", ")}`);
    }
    if (!ROUTE_COLORS.includes(route.color)) {
      problems.push(`${where} has color "${route.color}"`);
    }
    if (!Number.isInteger(route.length) || route.length < 1 || route.length > MAX_ROUTE_LENGTH) {
      problems.push(`${where} has length ${route.length}; expected 1 to ${MAX_ROUTE_LENGTH}`);
    } else if (rules.routeScoreTable[String(route.length)] === undefined) {
      problems.push(`${where} has length ${route.length}, which the score table does not cover`);
    }
    for (const end of [route.from, route.to]) {
      if (!activeIds.has(end)) {
        problems.push(`${where} ends at "${end}", which is not an active station`);
      }
    }
    if (route.from === route.to) {
      problems.push(`${where} starts and ends at the same station`);
    }
    if (route.locomotiveCost !== undefined && (!Number.isInteger(route.locomotiveCost) || route.locomotiveCost < 0 || route.locomotiveCost > route.length)) {
      problems.push(`${where} needs ${route.locomotiveCost} locomotives for ${route.length} spaces`);
    }
  }

  const twinGroups = new Map<string, typeof map.routes>();
  for (const route of map.routes) {
    if (route.twinGroup) {
      twinGroups.set(route.twinGroup, [...(twinGroups.get(route.twinGroup) ?? []), route]);
    }
  }
  for (const [group, routes] of twinGroups) {
    const ends = new Set(routes.map((route) => [route.from, route.to].sort().join("|")));
    if (routes.length !== 2 || ends.size !== 1) {
      problems.push(`twin group "${group}" must be exactly two routes between the same two stations`);
    }
  }

  const allTickets = [...tickets.long, ...tickets.regular];
  for (const id of duplicates(allTickets.map((ticket) => ticket.id))) {
    problems.push(`ticket id "${id}" is used more than once`);
  }
  for (const ticket of allTickets) {
    for (const end of [ticket.from, ticket.to]) {
      if (!activeIds.has(end)) {
        problems.push(`ticket "${ticket.id}" names "${end}", which is not an active station`);
      }
    }
    if (ticket.from === ticket.to || !Number.isInteger(ticket.points) || ticket.points < 1) {
      problems.push(`ticket "${ticket.id}" needs two different stations and a whole number of points`);
    }
  }

  for (const [key, value] of Object.entries({ trainsPerPlayer: rules.trainsPerPlayer, stationsPerPlayer: rules.stationsPerPlayer })) {
    if (!Number.isInteger(value) || value < 0) {
      problems.push(`rules.${key} is ${value}`);
    }
  }

  return problems;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    (seen.has(value) ? repeated : seen).add(value);
  }
  return [...repeated];
}
