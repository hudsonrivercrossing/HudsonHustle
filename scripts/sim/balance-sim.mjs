// Plays many seeded all-bot games on a map and reports what the map does under that policy.
//   pnpm sim                              every released map, 300 seeds, 2-4 players
//   pnpm sim -- --config berlin --seeds 1000 --players 2,4
//   pnpm sim -- --duel hard,standard --seeds 500 --config berlin
//     head-to-head between bot tiers, one seat per tier named (2-4), seats rotated every seed.
//     Prints to the terminal only; no report file is written.
// It measures the map against one deterministic bot, not against people: use it to find
// routes nobody takes and tickets nobody finishes, not to predict how a table of humans plays.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { botDifficulties, getTicketProgress, runBotTurns, startGame } from "../../packages/game-core/dist/index.js";
import { getHudsonHustleMapByConfigId, hudsonHustleReleasedConfigs } from "../../packages/game-data/dist/index.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MAX_ACTIONS_PER_GAME = 4000;

function readArgs(argv) {
  const args = { config: null, seeds: 300, players: [2, 3, 4], out: path.join(rootDir, "docs/playtests/sim"), duel: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];
    if (argv[index] === "--config") args.config = value;
    if (argv[index] === "--seeds") args.seeds = Number(value);
    if (argv[index] === "--players") args.players = value.split(",").map(Number);
    if (argv[index] === "--out") args.out = path.resolve(value);
    if (argv[index] === "--duel") args.duel = (value ?? "").split(",");
  }
  return args;
}

function playGame(config, playerCount, seed, difficultyOf = () => "standard") {
  const playerNames = Array.from({ length: playerCount }, (_, index) => `Bot ${index + 1}`);
  let state = startGame(config, { playerNames, seed });
  let actions = 0;
  while (state.phase !== "gameOver" && actions < MAX_ACTIONS_PER_GAME) {
    const result = runBotTurns(state, config, () => true, 200, difficultyOf);
    if (result.actions.length === 0) break;
    actions += result.actions.length;
    state = result.state;
  }
  return { state, actions };
}

const percent = (part, whole) => (whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`);
const mean = (values) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);
const cityName = (config, cityId) => config.cities.find((city) => city.id === cityId)?.name ?? cityId;
const routeLabel = (config, route) => `${cityName(config, route.from)} – ${cityName(config, route.to)}`;

function simulate(config, playerCount, seedCount) {
  const routeClaims = new Map(config.routes.map((route) => [route.id, 0]));
  const tickets = new Map(config.tickets.map((ticket) => [ticket.id, { held: 0, completed: 0 }]));
  const winsBySeat = Array(playerCount).fill(0);
  const scores = [];
  const margins = [];
  const actionCounts = [];
  const stationsBuilt = [];
  let finished = 0;
  let stuck = 0;
  let crashed = 0;

  for (let seed = 1; seed <= seedCount; seed += 1) {
    let game;
    try {
      game = playGame(config, playerCount, seed);
    } catch (error) {
      crashed += 1;
      if (crashed <= 3) console.error(`  seed ${seed} (${playerCount}p) threw: ${error.message}`);
      continue;
    }
    if (game.state.phase !== "gameOver") {
      stuck += 1;
      continue;
    }
    finished += 1;
    actionCounts.push(game.actions);
    for (const claim of game.state.routeClaims) {
      routeClaims.set(claim.routeId, (routeClaims.get(claim.routeId) ?? 0) + 1);
    }
    const ranked = game.state.players.map((player, seat) => ({ seat, score: player.score })).sort((left, right) => right.score - left.score);
    if (ranked[0].score > (ranked[1]?.score ?? -Infinity)) {
      winsBySeat[ranked[0].seat] += 1;
    }
    margins.push(ranked[0].score - ranked[ranked.length - 1].score);
    for (const player of game.state.players) {
      scores.push(player.score);
      stationsBuilt.push(config.settings.stationsPerPlayer - player.stationsLeft);
      for (const progress of getTicketProgress(game.state, config, player.id)) {
        const entry = tickets.get(progress.ticket.id);
        if (entry) {
          entry.held += 1;
          if (progress.completed) entry.completed += 1;
        }
      }
    }
  }

  return { playerCount, seedCount, finished, stuck, crashed, routeClaims, tickets, winsBySeat, scores, margins, actionCounts, stationsBuilt };
}

function report(configSummary, config, runs) {
  const lines = [];
  lines.push(`# Balance simulation — ${configSummary.mapName} (${configSummary.configId})`);
  lines.push("");
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/sim/balance-sim.mjs\`. Every seat is the same deterministic bot.`);
  lines.push("Read this as how the map behaves under that one policy. It finds dead routes and unreachable tickets; it does not predict human play.");
  lines.push("");
  lines.push(`Map: ${config.cities.length} stations, ${config.routes.length} routes, ${config.tickets.length} tickets, ${config.settings.trainsPerPlayer} trains per player.`);
  lines.push("");
  lines.push("## Games");
  lines.push("");
  lines.push("| Players | Seeds | Finished | Stuck | Crashed | Mean score | Mean spread (first − last) | Mean actions | Stations built per player |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const run of runs) {
    lines.push(
      `| ${run.playerCount} | ${run.seedCount} | ${run.finished} | ${run.stuck} | ${run.crashed} | ${mean(run.scores).toFixed(1)} | ${mean(run.margins).toFixed(1)} | ${mean(run.actionCounts).toFixed(0)} | ${mean(run.stationsBuilt).toFixed(2)} |`
    );
  }
  lines.push("");
  lines.push("## Seat order");
  lines.push("");
  lines.push("Share of outright wins by seat. An even table would give each seat the same share.");
  lines.push("");
  lines.push(`| Players | ${[1, 2, 3, 4].map((seat) => `Seat ${seat}`).join(" | ")} | Ties |`);
  lines.push("|---|---|---|---|---|---|");
  for (const run of runs) {
    const wins = run.winsBySeat.reduce((sum, value) => sum + value, 0);
    const cells = [0, 1, 2, 3].map((seat) => (seat < run.playerCount ? percent(run.winsBySeat[seat], run.finished) : ""));
    lines.push(`| ${run.playerCount} | ${cells.join(" | ")} | ${percent(run.finished - wins, run.finished)} |`);
  }
  lines.push("");
  lines.push("## Routes");
  lines.push("");
  lines.push("How often each route ends the game claimed. Sorted by the average across player counts, least used first.");
  lines.push("");
  lines.push(`| Route | Length | Color | Type | ${runs.map((run) => `${run.playerCount}p`).join(" | ")} |`);
  lines.push(`|---|---|---|---|${runs.map(() => "---").join("|")}|`);
  const routeRows = config.routes
    .map((route) => ({ route, rates: runs.map((run) => (run.finished === 0 ? 0 : (run.routeClaims.get(route.id) ?? 0) / run.finished)) }))
    .sort((left, right) => mean(left.rates) - mean(right.rates));
  for (const { route, rates } of routeRows) {
    lines.push(`| ${routeLabel(config, route)} | ${route.length} | ${route.color} | ${route.type} | ${rates.map((rate) => `${Math.round(rate * 100)}%`).join(" | ")} |`);
  }
  lines.push("");
  lines.push("## Tickets");
  lines.push("");
  lines.push("Of the times a ticket was held at the end of a game, how often it was completed. Hardest first.");
  lines.push("");
  lines.push(`| Ticket | Points | Kind | ${runs.map((run) => `${run.playerCount}p done / held`).join(" | ")} |`);
  lines.push(`|---|---|---|${runs.map(() => "---").join("|")}|`);
  const ticketRows = config.tickets
    .map((ticket) => {
      const totals = runs.map((run) => run.tickets.get(ticket.id));
      const held = totals.reduce((sum, entry) => sum + entry.held, 0);
      const completed = totals.reduce((sum, entry) => sum + entry.completed, 0);
      return { ticket, totals, rate: held === 0 ? -1 : completed / held };
    })
    .sort((left, right) => left.rate - right.rate);
  for (const { ticket, totals } of ticketRows) {
    const cells = totals.map((entry) => (entry.held === 0 ? "never held" : `${percent(entry.completed, entry.held)} of ${entry.held}`));
    lines.push(`| ${cityName(config, ticket.from)} – ${cityName(config, ticket.to)} | ${ticket.points} | ${ticket.bucket} | ${cells.join(" | ")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * Plays the named tiers against each other, one seat each. The seating shifts by one every seed,
 * so over the run each tier sits in each seat equally often and the first-move edge cancels out.
 */
function duel(config, tiers, seedCount) {
  const names = [...new Set(tiers)];
  const stats = new Map(names.map((tier) => [tier, { seats: 0, wins: 0, scores: [], ticketsHeld: 0, ticketsDone: 0, stations: 0 }]));
  let finished = 0;
  let decided = 0;
  let stuck = 0;
  let crashed = 0;

  for (let seed = 1; seed <= seedCount; seed += 1) {
    const tierBySeat = tiers.map((_, seat) => tiers[(seat + seed) % tiers.length]);
    const tierOf = (playerId) => tierBySeat[Number(playerId.split("-")[1]) - 1];
    let game;
    try {
      game = playGame(config, tiers.length, seed, tierOf);
    } catch (error) {
      crashed += 1;
      if (crashed <= 3) console.error(`  seed ${seed} (${tierBySeat.join(" vs ")}) threw: ${error.message}`);
      continue;
    }
    if (game.state.phase !== "gameOver") {
      stuck += 1;
      continue;
    }
    finished += 1;
    const ranked = [...game.state.players].sort((left, right) => right.score - left.score);
    const outright = ranked[0].score > ranked[1].score;
    if (outright) decided += 1;
    for (const player of game.state.players) {
      const entry = stats.get(tierOf(player.id));
      entry.seats += 1;
      entry.scores.push(player.score);
      entry.stations += config.settings.stationsPerPlayer - player.stationsLeft;
      entry.ticketsHeld += player.tickets.length;
      entry.ticketsDone += player.endgame?.completedTicketIds.length ?? 0;
      if (outright && player.id === ranked[0].id) entry.wins += 1;
    }
  }
  return { names, stats, finished, decided, stuck, crashed };
}

function printDuel(summary, tiers, seedCount, result) {
  console.log(`\n${summary.mapName} (${summary.configId}) — ${tiers.join(" vs ")}, ${seedCount} seeds, seats rotated`);
  console.log(`  finished ${result.finished}, decided ${result.decided}, tied ${result.finished - result.decided}, stuck ${result.stuck}, crashed ${result.crashed}`);
  console.log("  | Tier | Seats played | Wins | Win % of decided games | Mean score | Tickets done / held | Stations built per seat |");
  console.log("  |---|---|---|---|---|---|---|");
  for (const tier of result.names) {
    const entry = result.stats.get(tier);
    const stations = entry.seats === 0 ? "—" : (entry.stations / entry.seats).toFixed(2);
    console.log(
      `  | ${tier} | ${entry.seats} | ${entry.wins} | ${result.names.length > 1 ? percent(entry.wins, result.decided) : "—"} | ${mean(entry.scores).toFixed(1)} | ${percent(entry.ticketsDone, entry.ticketsHeld)} of ${entry.ticketsHeld} | ${stations} |`
    );
  }
}

const args = readArgs(process.argv.slice(2));
const configs = hudsonHustleReleasedConfigs.filter((summary) => !args.config || summary.configId === args.config);
if (configs.length === 0) {
  console.error(`No released config matches "${args.config}". Available: ${hudsonHustleReleasedConfigs.map((summary) => summary.configId).join(", ")}`);
  process.exit(2);
}
if (args.duel) {
  if (args.duel.length < 2 || args.duel.length > 4 || args.duel.some((tier) => !botDifficulties.includes(tier))) {
    console.error(`--duel takes 2 to 4 tiers out of ${botDifficulties.join(", ")}, separated by commas, e.g. --duel hard,standard`);
    process.exit(2);
  }
  for (const summary of configs) {
    printDuel(summary, args.duel, args.seeds, duel(getHudsonHustleMapByConfigId(summary.configId), args.duel, args.seeds));
  }
  process.exit(0);
}
mkdirSync(args.out, { recursive: true });
for (const summary of configs) {
  const config = getHudsonHustleMapByConfigId(summary.configId);
  console.log(`${summary.configId}: ${args.seeds} seeds × players ${args.players.join(", ")}`);
  const runs = args.players.map((playerCount) => {
    const started = Date.now();
    const run = simulate(config, playerCount, args.seeds);
    console.log(`  ${playerCount}p: ${run.finished} finished, ${run.stuck} stuck, ${run.crashed} crashed (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    return run;
  });
  const file = path.join(args.out, `${summary.configId}.md`);
  writeFileSync(file, report(summary, config, runs));
  console.log(`  wrote ${path.relative(rootDir, file)}`);
}
