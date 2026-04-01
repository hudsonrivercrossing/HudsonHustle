import fs from "node:fs";
import {
  getAffordableRouteColors,
  getCurrentPlayer,
  getTicketProgress,
  reduceGame,
  startGame,
  summarizeEndgame
} from "../../packages/game-core/src/game.ts";
import { hudsonHustleMap } from "../../packages/game-data/src/index.ts";

const cardColors = ["crimson", "amber", "emerald", "cobalt", "violet", "obsidian", "ivory", "rose"];
const logLines = [];
const maxTurns = 120;
const seed = Number(process.env.HH_SEED ?? process.argv[2] ?? 42);

const personas = [
  {
    name: "central optimizer",
    style: "central",
    preferred: new Set(["midtown-west", "world-trade", "battery-park", "grand-central", "hudson-yards", "union-square", "chelsea"]),
    outer: new Set(["flushing", "newark-airport", "red-hook", "grove-st", "hoboken"])
  },
  {
    name: "outer opportunist",
    style: "outer",
    preferred: new Set(["flushing", "newark-airport", "red-hook", "grove-st", "hoboken", "hudson-yards"]),
    outer: new Set(["flushing", "newark-airport", "red-hook", "grove-st", "hoboken", "hudson-yards"])
  }
];

const failedClaimMemory = new Map();

function log(line = "") {
  logLines.push(line);
}

function cityById(id) {
  return hudsonHustleMap.cities.find((city) => city.id === id);
}

function routeById(id) {
  return hudsonHustleMap.routes.find((route) => route.id === id);
}

function handCounts(hand) {
  const counts = Object.fromEntries([...cardColors, "locomotive"].map((color) => [color, 0]));
  for (const card of hand) {
    counts[card.color] += 1;
  }
  return counts;
}

function formatHand(hand) {
  const counts = handCounts(hand);
  return cardColors
    .map((color) => `${color.slice(0, 3)}:${counts[color]}`)
    .concat(`loco:${counts.locomotive}`)
    .join(" ");
}

function buildAllowedAdjacency(state, playerId) {
  const blocked = new Set(state.routeClaims.filter((claim) => claim.playerId !== playerId).map((claim) => claim.routeId));
  const adjacency = new Map();
  const push = (from, to, routeId, length, type) => {
    const list = adjacency.get(from) ?? [];
    list.push({ to, routeId, length, type });
    adjacency.set(from, list);
  };

  for (const route of hudsonHustleMap.routes) {
    if (blocked.has(route.id)) {
      continue;
    }
    push(route.from, route.to, route.id, route.length, route.type);
    push(route.to, route.from, route.id, route.length, route.type);
  }

  return adjacency;
}

function dijkstraPath(state, playerId, from, to) {
  if (from === to) {
    return { distance: 0, routeIds: [], cityIds: [from] };
  }

  const adjacency = buildAllowedAdjacency(state, playerId);
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const queue = [{ city: from, cost: 0 }];

  const popMin = () => {
    let bestIndex = 0;
    for (let index = 1; index < queue.length; index += 1) {
      if (queue[index].cost < queue[bestIndex].cost) {
        bestIndex = index;
      }
    }
    return queue.splice(bestIndex, 1)[0];
  };

  while (queue.length > 0) {
    const current = popMin();
    if (current.city === to) {
      break;
    }
    if ((dist.get(current.city) ?? Infinity) < current.cost) {
      continue;
    }

    for (const edge of adjacency.get(current.city) ?? []) {
      const edgeCost = edge.length + (edge.type === "tunnel" ? 0.35 : edge.type === "ferry" ? 0.5 : 0);
      const nextCost = current.cost + edgeCost;
      if (nextCost < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nextCost);
        prev.set(edge.to, { city: current.city, routeId: edge.routeId });
        queue.push({ city: edge.to, cost: nextCost });
      }
    }
  }

  if (!prev.has(to)) {
    return { distance: Infinity, routeIds: [], cityIds: [] };
  }

  const routeIds = [];
  const cityIds = [to];
  let cursor = to;
  while (cursor !== from) {
    const item = prev.get(cursor);
    if (!item) {
      break;
    }
    routeIds.push(item.routeId);
    cursor = item.city;
    cityIds.push(cursor);
  }
  routeIds.reverse();
  cityIds.reverse();
  return { distance: dist.get(to) ?? Infinity, routeIds, cityIds };
}

function pathMapForTickets(state, playerId, tickets) {
  const result = new Map();
  for (const ticket of tickets) {
    result.set(ticket.id, dijkstraPath(state, playerId, ticket.from, ticket.to));
  }
  return result;
}

function pathIncludesRoute(path, routeId) {
  return path.routeIds.includes(routeId);
}

function routeCentrality(route) {
  const centralCities = new Set(["midtown-west", "world-trade", "battery-park", "grand-central", "hudson-yards", "union-square", "chelsea"]);
  const outerCities = new Set(["flushing", "newark-airport", "red-hook", "grove-st", "hoboken"]);
  const endpoints = [route.from, route.to];
  let score = 0;
  for (const cityId of endpoints) {
    if (centralCities.has(cityId)) {
      score += 1.5;
    }
    if (outerCities.has(cityId)) {
      score += 1.1;
    }
  }
  return score;
}

function ticketSelectionScore(ticket, persona) {
  const path = dijkstraPath({ routeClaims: [] }, "player-1", ticket.from, ticket.to);
  const endpointCentrality =
    (persona.style === "central"
      ? (persona.preferred.has(ticket.from) ? 2.5 : 0.75) + (persona.preferred.has(ticket.to) ? 2.5 : 0.75)
      : (persona.preferred.has(ticket.from) ? 2.5 : 0.8) + (persona.preferred.has(ticket.to) ? 2.5 : 0.8));
  return ticket.points * 4 - path.distance + endpointCentrality;
}

function chooseInitialTickets(pendingTickets, persona) {
  const subsets = [];
  const n = pendingTickets.length;
  for (let mask = 0; mask < 1 << n; mask += 1) {
    const chosen = pendingTickets.filter((_, index) => (mask & (1 << index)) !== 0);
    if (chosen.length < 2) continue;
    subsets.push(chosen);
  }

  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const subset of subsets) {
    const paths = subset.map((ticket) => dijkstraPath({ routeClaims: [] }, "player-1", ticket.from, ticket.to));
    const edgeCounts = new Map();
    let score = 0;
    for (let index = 0; index < subset.length; index += 1) {
      const ticket = subset[index];
      const path = paths[index];
      score += ticketSelectionScore(ticket, persona);
      for (const routeId of path.routeIds) {
        edgeCounts.set(routeId, (edgeCounts.get(routeId) ?? 0) + 1);
      }
    }
    for (const count of edgeCounts.values()) {
      if (count > 1) {
        score += count * 1.7;
      }
    }
    score += subset.length * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = subset;
    }
  }

  return best ?? pendingTickets.slice(0, 2);
}

function connectedAfterClaim(state, playerId, extraRouteId) {
  const adjacency = new Map();
  const push = (from, to, routeId) => {
    const list = adjacency.get(from) ?? [];
    list.push({ to, routeId });
    adjacency.set(from, list);
  };
  for (const claim of state.routeClaims) {
    if (claim.playerId !== playerId) continue;
    const route = routeById(claim.routeId);
    push(route.from, route.to, route.id);
    push(route.to, route.from, route.id);
  }
  const extraRoute = routeById(extraRouteId);
  push(extraRoute.from, extraRoute.to, extraRoute.id);
  push(extraRoute.to, extraRoute.from, extraRoute.id);

  const canReach = (from, to) => {
    if (from === to) return true;
    const queue = [from];
    const seen = new Set([from]);
    while (queue.length) {
      const current = queue.shift();
      for (const edge of adjacency.get(current) ?? []) {
        if (edge.to === to) return true;
        if (!seen.has(edge.to)) {
          seen.add(edge.to);
          queue.push(edge.to);
        }
      }
    }
    return false;
  };

  return { adjacency, canReach };
}

function playerNetworkCities(state, playerId) {
  const cities = new Set();
  for (const claim of state.routeClaims) {
    if (claim.playerId !== playerId) continue;
    const route = routeById(claim.routeId);
    cities.add(route.from);
    cities.add(route.to);
  }
  for (const station of state.stations) {
    if (station.playerId === playerId) {
      cities.add(station.cityId);
    }
  }
  return cities;
}

function chooseClaim(state, personaIndex) {
  const player = getCurrentPlayer(state);
  const persona = personas[personaIndex];
  const failedRoutes = failedClaimMemory.get(player.id) ?? new Set();
  const ticketPaths = pathMapForTickets(state, player.id, player.tickets);
  const ownNetwork = playerNetworkCities(state, player.id);
  const candidates = [];

  for (const route of hudsonHustleMap.routes) {
    if (failedRoutes.has(route.id)) {
      continue;
    }
    const colors = getAffordableRouteColors(state, hudsonHustleMap, route.id);
    if (colors.length === 0) continue;

    for (const color of colors) {
      let score = 0;
      const helpedTickets = [];
      for (const ticket of player.tickets) {
        const path = ticketPaths.get(ticket.id);
        if (path && pathIncludesRoute(path, route.id)) {
          const pathWeight = ticket.points * 6 / Math.max(2, path.routeIds.length);
          score += pathWeight;
          helpedTickets.push(ticket.id);
        }
      }

      const networkTouch = ownNetwork.has(route.from) || ownNetwork.has(route.to);
      if (networkTouch) {
        score += 1.8;
      }

      if (route.twinGroup && state.players.length <= 3) {
        const twinIds = hudsonHustleMap.routes.filter((entry) => entry.twinGroup === route.twinGroup).map((entry) => entry.id);
        const locked = state.routeClaims.some((claim) => twinIds.includes(claim.routeId));
        if (!locked) {
          score += 5;
        }
      }

      if (route.type === "tunnel") {
        score -= 0.25;
      } else if (route.type === "ferry") {
        score -= 0.15;
      }

      score += route.length <= 2 ? 0.75 : route.length === 3 ? 0.35 : 0.15;
      score += routeCentrality(route) * 0.4;

      if (persona.style === "central") {
        const centralCities = new Set(["midtown-west", "world-trade", "battery-park", "grand-central", "hudson-yards", "union-square", "chelsea"]);
        if (centralCities.has(route.from) || centralCities.has(route.to)) {
          score += 1.4;
        }
      } else {
        const outerCities = new Set(["flushing", "newark-airport", "red-hook", "grove-st", "hoboken", "hudson-yards"]);
        if (outerCities.has(route.from) || outerCities.has(route.to)) {
          score += 1.4;
        }
      }

      const completion = connectedAfterClaim(state, player.id, route.id);
      let completedTickets = 0;
      for (const ticket of player.tickets) {
        if (completion.canReach(ticket.from, ticket.to)) {
          completedTickets += 1;
        }
      }
      score += completedTickets * 3.25;

      candidates.push({ route, color, score, helpedTickets, completedTickets });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.route.length - b.route.length);
  return candidates[0] ?? null;
}

function chooseDrawCard(state, personaIndex, targetRoute, forSecondDraw = false) {
  const player = getCurrentPlayer(state);
  const neededColor = targetRoute?.route.color === "gray"
    ? bestGrayColor(player.hand, targetRoute.route, personaIndex)
    : targetRoute?.route.color;
  const market = state.market;

  if (neededColor) {
    const marketIndex = market.findIndex((card) => card.color === neededColor || (!forSecondDraw && card.color === "locomotive"));
    if (marketIndex >= 0) {
      return { type: "draw_card", source: "market", marketIndex };
    }
  }

  const locoIndex = forSecondDraw ? -1 : market.findIndex((card) => card.color === "locomotive");
  if (locoIndex >= 0 && (!neededColor || market[locoIndex]?.color === neededColor)) {
    return { type: "draw_card", source: "market", marketIndex: locoIndex };
  }

  return { type: "draw_card", source: "deck" };
}

function bestGrayColor(hand, route, personaIndex) {
  const counts = handCounts(hand);
  const options = cardColors;
  const persona = personas[personaIndex];
  let bestColor = options[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const color of options) {
    let score = counts[color] * 2;
    if (persona.style === "central") {
      if (["amber", "rose", "ivory", "cobalt"].includes(color)) score += 0.5;
    } else {
      if (["emerald", "obsidian", "violet", "crimson"].includes(color)) score += 0.5;
    }
    if (route.type === "tunnel" && counts.locomotive > 0) score += 0.4;
    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }
  return bestColor;
}

function chooseInitialTurnTarget(state, personaIndex) {
  return chooseClaim(state, personaIndex);
}

function chooseMainAction(state, personaIndex) {
  const player = getCurrentPlayer(state);
  const claim = chooseClaim(state, personaIndex);
  if (claim && claim.score >= 3.6) {
    return { type: "claim_route", routeId: claim.route.id, color: claim.color, meta: claim };
  }

  if (player.tickets.length < 3) {
    const progress = getTicketProgress(state, hudsonHustleMap, player.id);
    const completedCount = progress.filter((entry) => entry.completed).length;
    if (completedCount >= 1 && state.regularTickets.length > 8) {
      return { type: "draw_tickets" };
    }
  }

  if (claim) {
    return chooseDrawCard(state, personaIndex, claim);
  }

  return { type: "draw_card", source: "deck" };
}

function chooseTicketKeep(pendingTickets, persona) {
  return chooseInitialTickets(pendingTickets, persona);
}

function summarizeSnapshot(state, personaIndex) {
  const player = getCurrentPlayer(state);
  const persona = personas[personaIndex];
  const progress = getTicketProgress(state, hudsonHustleMap, player.id);
  const completed = progress.filter((entry) => entry.completed);
  const incomplete = progress.filter((entry) => !entry.completed);
  const strongest = [...player.tickets]
    .map((ticket) => ({ ticket, score: ticketSelectionScore(ticket, persona) }))
    .sort((a, b) => b.score - a.score)[0]?.ticket ?? player.tickets[0];
  const weakest = [...player.tickets]
    .map((ticket) => ({ ticket, score: ticketSelectionScore(ticket, persona) }))
    .sort((a, b) => a.score - b.score)[0]?.ticket ?? player.tickets[0];
  const claim = chooseClaim(state, personaIndex);

  const opponent = state.players.find((entry) => entry.id !== player.id);
  const opponentRoute = opponent
    ? bestPublicThreat(state, opponent.id, personas[1 - personaIndex])
    : null;

  return {
    strongest,
    weakest,
    completed: completed.length,
    incomplete: incomplete.length,
    claim,
    opponentRoute
  };
}

function bestPublicThreat(state, playerId, persona) {
  const networkCities = playerNetworkCities(state, playerId);
  const candidates = [];
  for (const route of hudsonHustleMap.routes) {
    if (state.routeClaims.some((claim) => claim.routeId === route.id)) {
      continue;
    }
    let score = routeCentrality(route);
    if (networkCities.has(route.from) || networkCities.has(route.to)) {
      score += 3;
    }
    if (persona.style === "central") {
      if (["midtown-west", "world-trade", "battery-park", "grand-central", "hudson-yards", "union-square", "chelsea"].includes(route.from) || ["midtown-west", "world-trade", "battery-park", "grand-central", "hudson-yards", "union-square", "chelsea"].includes(route.to)) {
        score += 1;
      }
    } else {
      if (["flushing", "newark-airport", "red-hook", "grove-st", "hoboken", "hudson-yards"].includes(route.from) || ["flushing", "newark-airport", "red-hook", "grove-st", "hoboken", "hudson-yards"].includes(route.to)) {
        score += 1;
      }
    }
    candidates.push({ route, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function routeLabel(routeId) {
  const route = routeById(routeId);
  return `${cityById(route.from).label ?? cityById(route.from).name} -> ${cityById(route.to).label ?? cityById(route.to).name}`;
}

function playOneTurn(state, personaIndex, turnNumber) {
  const player = getCurrentPlayer(state);
  const persona = personas[personaIndex];
  const snapshot = summarizeSnapshot(state, personaIndex);
  const preTurnClaimCount = state.routeClaims.length;
  const preTurnScore = player.score;
  const preTurnTrains = player.trainsLeft;
  log(`Turn ${turnNumber} | ${player.name} (${persona.name})`);
  log(`Snapshot: strongest=${snapshot.strongest?.id ?? "none"} weakest=${snapshot.weakest?.id ?? "none"} completed=${snapshot.completed} incomplete=${snapshot.incomplete}`);
  log(`Plan: ${snapshot.strongest ? `${snapshot.strongest.from} -> ${snapshot.strongest.to}` : "none"} | Risk: ${snapshot.claim ? routeLabel(snapshot.claim.route.id) : "no claimable route"} | Threat: ${snapshot.opponentRoute ? routeLabel(snapshot.opponentRoute.route.id) : "no obvious threat"}`);

  const startHand = formatHand(player.hand);
  log(`Hand before: ${startHand} | tickets=${player.tickets.length} trains=${player.trainsLeft} stations=${player.stationsLeft}`);

  const action = chooseMainAction(state, personaIndex);
  const actionNotes = [];

  if (action.type === "claim_route") {
    const route = routeById(action.routeId);
    actionNotes.push(`Action: claim ${route.id} with ${action.color}`);
    actionNotes.push(`Why: ${action.meta.completedTickets > 0 ? `${action.meta.completedTickets} ticket(s) complete if claimed.` : "best route-progress move right now."}`);
    state = reduceGame(state, { type: "claim_route", routeId: action.routeId, color: action.color }, hudsonHustleMap);
    const claimSucceeded = state.routeClaims.length > preTurnClaimCount && state.players[personaIndex].score > preTurnScore;
    if (!claimSucceeded) {
      const failed = failedClaimMemory.get(player.id) ?? new Set();
      failed.add(route.id);
      failedClaimMemory.set(player.id, failed);
      actionNotes.push(`Result: failed claim / tunnel surcharge or affordability blocked ${route.id}.`);
      actionNotes.push(`Reveal: ${state.turn.latestTunnelReveal.map((color) => color).join(", ") || "none"}`);
    } else {
      actionNotes.push(`Result: success (${state.players[personaIndex].score - preTurnScore >= 0 ? "score updated" : "unexpected"})`);
    }
  } else if (action.type === "draw_tickets") {
    const before = state.players[personaIndex].pendingTickets;
    actionNotes.push("Action: draw tickets");
    state = reduceGame(state, { type: "draw_tickets" }, hudsonHustleMap);
    const pending = state.players[personaIndex].pendingTickets;
    const kept = chooseTicketKeep(pending, persona).slice(0, 3).map((ticket) => ticket.id);
    actionNotes.push(`Why: network broad enough to consider additional objectives. Drawn=${pending.map((ticket) => ticket.id).join(", ")}`);
    state = reduceGame(state, { type: "keep_drawn_tickets", keptTicketIds: kept }, hudsonHustleMap);
    actionNotes.push(`Kept: ${kept.join(", ")}`);
  } else if (action.type === "draw_card") {
    const first = action;
    const drawn1 = first.source === "market" ? `market[${first.marketIndex}]` : "deck";
    state = reduceGame(state, { type: "draw_card", source: first.source, marketIndex: first.marketIndex }, hudsonHustleMap);
    actionNotes.push(`Action: draw card from ${drawn1}`);

    if (state.turn.stage === "drawing") {
      const nextClaim = chooseClaim(state, personaIndex);
      const second = chooseDrawCard(state, personaIndex, nextClaim, true);
      const drawn2 = second.source === "market" ? `market[${second.marketIndex}]` : "deck";
      state = reduceGame(state, { type: "draw_card", source: second.source, marketIndex: second.marketIndex }, hudsonHustleMap);
      actionNotes.push(`Second draw: ${drawn2}`);
      if (nextClaim) {
        actionNotes.push(`Why: building toward ${routeLabel(nextClaim.route.id)} rather than over-drawing tickets.`);
      } else {
        actionNotes.push("Why: no claimable route yet; kept tempo with cards.");
      }
    } else {
      actionNotes.push("Why: the first draw ended the turn.");
    }
  } else {
    actionNotes.push("Action: no-op");
  }

  if (state.turn.stage === "awaitingHandoff") {
    log(actionNotes.join(" | "));
    log(`Hand after: ${formatHand(state.players[personaIndex].hand)} | score=${state.players[personaIndex].score} trains=${state.players[personaIndex].trainsLeft}`);
    const progress = getTicketProgress(state, hudsonHustleMap, player.id);
    const completedNow = progress.filter((entry) => entry.completed).map((entry) => entry.ticket.id);
    log(`Safety: completed=${completedNow.join(", ") || "none"} | fallback=${snapshot.weakest ? `${snapshot.weakest.from} -> ${snapshot.weakest.to}` : "none"}`);
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
    log(`New weakness: ${persona.style === "central" ? "outer branches can now press the central spine." : "the center can still outscore if left uncontested."}`);
  } else if (state.phase === "ticketChoice") {
    log(actionNotes.join(" | "));
    log(`Hand after: ${formatHand(state.players[personaIndex].hand)} | score=${state.players[personaIndex].score} trains=${state.players[personaIndex].trainsLeft}`);
    state = reduceGame(state, { type: "advance_turn" }, hudsonHustleMap);
  } else {
    log(actionNotes.join(" | "));
    log(`Hand after: ${formatHand(state.players[personaIndex].hand)} | score=${state.players[personaIndex].score} trains=${state.players[personaIndex].trainsLeft}`);
  }

  return state;
}

function finalize(state) {
  log("");
  log("Final:");
  for (const player of state.players) {
    log(`${player.name}: score=${player.score} trainsLeft=${player.trainsLeft} stationsLeft=${player.stationsLeft}`);
    if (player.endgame) {
      log(`  ${summarizeEndgame(player, hudsonHustleMap).join(" | ")}`);
    }
    log(`  tickets: ${player.tickets.map((ticket) => ticket.id).join(", ")}`);
  }
}

let state = startGame(hudsonHustleMap, { playerNames: ["Blue", "Red"], seed });
log(`Map: ${hudsonHustleMap.name} (${hudsonHustleMap.cities.length} cities, ${hudsonHustleMap.routes.length} routes, ${hudsonHustleMap.tickets.length} tickets)`);
log(`Setup: 2-player self-play, seed=${seed}, personas = ${personas.map((persona) => persona.name).join(" vs ")}`);
log("");

let setupIndex = 0;
while (state.phase === "initialTickets") {
  const player = getCurrentPlayer(state);
  const persona = personas[setupIndex];
  const choice = chooseInitialTickets(player.pendingTickets, persona);
  log(`Setup | ${player.name} (${persona.name})`);
  log(`Pending: ${player.pendingTickets.map((ticket) => ticket.id).join(", ")}`);
  log(`Keeps: ${choice.map((ticket) => ticket.id).join(", ")}`);
  state = reduceGame(state, { type: "select_initial_tickets", keptTicketIds: choice.map((ticket) => ticket.id) }, hudsonHustleMap);
  setupIndex = (setupIndex + 1) % personas.length;
  log(`Tickets locked. Phase=${state.phase}`);
  log("");
}

let turnNumber = 1;
while (state.phase !== "gameOver" && turnNumber <= maxTurns) {
  const personaIndex = state.activePlayerIndex;
  state = playOneTurn(state, personaIndex, turnNumber);
  log("");
  turnNumber += 1;
}

if (state.phase !== "gameOver") {
  log(`Stopped after ${maxTurns} turns without finishing.`);
}

finalize(state);

const outputPath = `/tmp/hudson-hustle-agent-vs-agent-log-seed-${seed}.md`;
fs.writeFileSync(outputPath, logLines.join("\n"));
console.log(`LOG_WRITTEN ${outputPath}`);
