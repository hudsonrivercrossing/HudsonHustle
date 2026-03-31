import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const compiledIndexPath = path.join(rootDir, "packages/game-data/dist/game-data/src/index.js");
const compiledCartographyPath = path.join(rootDir, "packages/game-data/dist/game-data/src/cartography.js");
const draftDir = path.join(rootDir, "configs/hudson-hustle/drafts/current-working");

const routeScoreTable = {
  "1": 1,
  "2": 2,
  "3": 4,
  "4": 7,
  "5": 10,
  "6": 15
};

function todayStamp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function withOptional(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

async function loadCurrentMapModule() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "hudson-hustle-config-export-"));
  const indexText = await readFile(compiledIndexPath, "utf8");
  const cartographyText = await readFile(compiledCartographyPath, "utf8");

  const patchedIndexText = indexText.replaceAll('from "./cartography";', 'from "./cartography.mjs";');
  const tempIndexPath = path.join(tempDir, "index.mjs");
  const tempCartographyPath = path.join(tempDir, "cartography.mjs");

  await writeFile(tempIndexPath, patchedIndexText);
  await writeFile(tempCartographyPath, cartographyText);

  try {
    const module = await import(`${pathToFileURL(tempIndexPath).href}?t=${Date.now()}`);
    return module;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function preserveById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

async function main() {
  await mkdir(draftDir, { recursive: true });

  const existingMeta = (await readJsonIfPresent(path.join(draftDir, "meta.json"))) ?? {};
  const existingMap = (await readJsonIfPresent(path.join(draftDir, "map.json"))) ?? {};
  const existingTickets = (await readJsonIfPresent(path.join(draftDir, "tickets.json"))) ?? {};
  const existingRules = (await readJsonIfPresent(path.join(draftDir, "rules.json"))) ?? {};
  const existingVisuals = (await readJsonIfPresent(path.join(draftDir, "visuals.json"))) ?? {};

  const existingStationsById = preserveById(existingMap.stations);
  const existingRoutesById = preserveById(existingMap.routes);
  const existingLongTicketsById = preserveById(existingTickets.long);
  const existingRegularTicketsById = preserveById(existingTickets.regular);

  const data = await loadCurrentMapModule();
  const {
    hudsonHustleMap,
    hudsonHustleGeoCities,
    hudsonHustleStationReferences,
    hudsonHustleBoardFrame,
    hudsonHustleAnchorWaveCityIds,
    hudsonHustleFirstRingCityIds,
    hudsonHustleBackdrop,
    cardColorPalette,
    playerColorPalette
  } = data;

  const geoCitiesById = new Map(hudsonHustleGeoCities.map((city) => [city.id, city]));
  const anchorIdSet = new Set(hudsonHustleAnchorWaveCityIds);
  const firstRingIdSet = new Set(hudsonHustleFirstRingCityIds);

  const stations = hudsonHustleMap.cities.map((city) => {
    const geoCity = geoCitiesById.get(city.id) ?? {};
    const existing = existingStationsById.get(city.id) ?? {};
    const authorityRef = hudsonHustleStationReferences[city.id] ?? null;

    const station = {
      id: city.id,
      name: city.name,
      label: city.label ?? city.name,
      active: true,
      tier: anchorIdSet.has(city.id) ? "anchor" : firstRingIdSet.has(city.id) ? "first-ring" : "other",
      lat: geoCity.lat,
      lon: geoCity.lon,
      boardX: geoCity.boardX ?? city.x,
      boardY: geoCity.boardY ?? city.y,
      labelDx: city.labelDx ?? 0,
      labelDy: city.labelDy ?? 0,
      labelAnchor: city.labelAnchor ?? "start",
      authorityRef: authorityRef
        ? {
            source: authorityRef.source,
            reference: authorityRef.reference,
            ...(authorityRef.sourceUrl ? { sourceUrl: authorityRef.sourceUrl } : {}),
            ...(authorityRef.notes ? { notes: authorityRef.notes } : {})
          }
        : null,
      notes: existing.notes ?? []
    };

    withOptional(station, "labelPreset", existing.labelPreset);
    return station;
  });

  const routes = hudsonHustleMap.routes.map((route) => {
    const existing = existingRoutesById.get(route.id) ?? {};
    const nextRoute = {
      id: route.id,
      from: route.from,
      to: route.to,
      length: route.length,
      color: route.color,
      type: route.type,
      notes: existing.notes ?? []
    };

    withOptional(nextRoute, "locomotiveCost", route.locomotiveCost);
    withOptional(nextRoute, "twinGroup", route.twinGroup);
    withOptional(nextRoute, "waypoints", route.waypoints);
    return nextRoute;
  });

  const longTickets = hudsonHustleMap.tickets
    .filter((ticket) => ticket.bucket === "long")
    .map((ticket) => {
      const existing = existingLongTicketsById.get(ticket.id) ?? {};
      return {
        id: ticket.id,
        from: ticket.from,
        to: ticket.to,
        points: ticket.points,
        notes: existing.notes ?? []
      };
    });

  const regularTickets = hudsonHustleMap.tickets
    .filter((ticket) => ticket.bucket === "regular")
    .map((ticket) => {
      const existing = existingRegularTicketsById.get(ticket.id) ?? {};
      return {
        id: ticket.id,
        from: ticket.from,
        to: ticket.to,
        points: ticket.points,
        notes: existing.notes ?? []
      };
    });

  const nextMeta = {
    schemaVersion: 1,
    id: existingMeta.id ?? "current-working",
    gameId: existingMeta.gameId ?? "hudson-hustle",
    version: existingMeta.version ?? "draft",
    status: existingMeta.status ?? "draft",
    basedOn: existingMeta.basedOn ?? null,
    createdAt: existingMeta.createdAt ?? todayStamp(),
    updatedAt: todayStamp(),
    sourceSync: {
      method: "script",
      sourceModule: "packages/game-data/src/index.ts",
      sourceBuildPath: "packages/game-data/dist/game-data/src/index.js",
      sourceExport: "hudsonHustleMap",
      syncedAt: todayStamp()
    },
    summary: existingMeta.summary ?? "Working draft for the current Hudson Hustle map and rules configuration.",
    designGoals: existingMeta.designGoals ?? [],
    changeSummary: existingMeta.changeSummary ?? [],
    playtestFocus: existingMeta.playtestFocus ?? []
  };

  const nextMap = {
    schemaVersion: 1,
    mapId: hudsonHustleMap.id,
    name: hudsonHustleMap.name,
    board: hudsonHustleBoardFrame,
    stations,
    routes
  };

  const nextTickets = {
    schemaVersion: 1,
    ticketSetId: `${hudsonHustleMap.id}-tickets`,
    long: longTickets,
    regular: regularTickets
  };

  const nextRules = {
    schemaVersion: 1,
    rulesetId: existingRules.rulesetId ?? `${hudsonHustleMap.id}-rules`,
    trainsPerPlayer: hudsonHustleMap.settings.trainsPerPlayer,
    stationsPerPlayer: hudsonHustleMap.settings.stationsPerPlayer,
    stationValue: hudsonHustleMap.settings.stationValue,
    longestRouteBonus: hudsonHustleMap.settings.longestRouteBonus,
    routeScoreTable,
    notes: existingRules.notes ?? []
  };

  const nextVisuals = {
    schemaVersion: 1,
    visualSetId: existingVisuals.visualSetId ?? `${hudsonHustleMap.id}-visuals`,
    boardStyle: existingVisuals.boardStyle ?? "graph-first-transit-nostalgia",
    theme: existingVisuals.theme ?? "warm-transit-nostalgia",
    backdropMode: existingVisuals.backdropMode ?? "minimal",
    boardLabelMode: existingVisuals.boardLabelMode ?? "station-only",
    backdrop: hudsonHustleBackdrop,
    palettes: {
      cards: cardColorPalette,
      players: playerColorPalette
    },
    notes: existingVisuals.notes ?? []
  };

  await writeFile(path.join(draftDir, "meta.json"), `${JSON.stringify(nextMeta, null, 2)}\n`);
  await writeFile(path.join(draftDir, "map.json"), `${JSON.stringify(nextMap, null, 2)}\n`);
  await writeFile(path.join(draftDir, "tickets.json"), `${JSON.stringify(nextTickets, null, 2)}\n`);
  await writeFile(path.join(draftDir, "rules.json"), `${JSON.stringify(nextRules, null, 2)}\n`);
  await writeFile(path.join(draftDir, "visuals.json"), `${JSON.stringify(nextVisuals, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        exported: true,
        mapId: nextMap.mapId,
        stations: nextMap.stations.length,
        routes: nextMap.routes.length,
        longTickets: nextTickets.long.length,
        regularTickets: nextTickets.regular.length,
        visualSetId: nextVisuals.visualSetId,
        target: "configs/hudson-hustle/drafts/current-working"
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
