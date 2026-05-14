import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { rootDir, readJson, resolveSnapshotEntry } from "./config-snapshot-lib.mjs";

const defaultPadding = {
  route: 34,
  station: 32,
  label: 10
};

function usage(exitCode = 1) {
  const message = `Usage:
  pnpm config:basemap-candidate --config <config-id|config-folder> --recipe <recipe.json> --out <candidate.json>
  pnpm config:basemap-candidate --config v0.4-flushing-newark-airport --recipe configs/hudson-hustle/basemap-recipes/nyc-harbor-memory-v1.json --out /tmp/nyc-basemap-candidate.json

Options:
  --protected-zones <zones.json>  Use precomputed protected zones instead of deriving them from the config map.
  --help                         Show this help text.
`;
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      usage(0);
    }
    if (!arg.startsWith("--")) {
      usage();
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      usage();
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function requireNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function padBounds(bounds, padding, width, height) {
  return {
    left: clamp(bounds.left - padding, 0, width),
    top: clamp(bounds.top - padding, 0, height),
    right: clamp(bounds.right + padding, 0, width),
    bottom: clamp(bounds.bottom + padding, 0, height)
  };
}

function boundsFromPoints(points, padding, width, height) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return padBounds(
    {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys)
    },
    padding,
    width,
    height
  );
}

function boundsIntersect(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

function normalizePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

async function readMaybeJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read JSON at ${path.relative(rootDir, filePath)}: ${error.message}`);
  }
}

async function resolveConfig(configArgument) {
  const directPath = normalizePath(configArgument);
  try {
    const map = await readMaybeJson(path.join(directPath, "map.json"));
    return {
      configId: path.basename(directPath),
      configPath: path.relative(rootDir, directPath),
      map
    };
  } catch {
    const entry = await resolveSnapshotEntry(configArgument);
    if (!entry) {
      throw new Error(`Unknown config "${configArgument}". Pass a config id or a folder with map.json.`);
    }
    return {
      configId: entry.configId,
      configPath: entry.configPath,
      map: entry.map
    };
  }
}

function toMapConfig(snapshotMap) {
  const cities = snapshotMap.stations
    .filter((station) => station.active)
    .map((station) => ({
      id: station.id,
      name: station.name,
      label: station.label,
      x: station.boardX,
      y: station.boardY,
      labelDx: station.labelDx,
      labelDy: station.labelDy,
      labelAnchor: station.labelAnchor
    }));
  const cityIds = new Set(cities.map((city) => city.id));
  const routes = snapshotMap.routes.filter((route) => cityIds.has(route.from) && cityIds.has(route.to));
  return { cities, routes };
}

function routePathPoints(route, config) {
  const from = config.cities.find((city) => city.id === route.from);
  const to = config.cities.find((city) => city.id === route.to);
  if (!from || !to) {
    throw new Error(`Route ${route.id} references a missing active station`);
  }

  if (route.waypoints?.length > 0) {
    return [{ x: from.x, y: from.y }, ...route.waypoints, { x: to.x, y: to.y }];
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -(dy / length);
  const ny = dx / length;
  const offset = route.offset ?? 0;
  return [
    { x: from.x + nx * offset, y: from.y + ny * offset },
    { x: to.x + nx * offset, y: to.y + ny * offset }
  ];
}

function buildProtectedZones(config, board) {
  const routes = config.routes.map((route) => ({
    id: `route:${route.id}`,
    kind: "route",
    routeId: route.id,
    bounds: boundsFromPoints(routePathPoints(route, config), defaultPadding.route, board.width, board.height)
  }));

  const stations = config.cities.map((city) => ({
    id: `station:${city.id}`,
    kind: "station",
    cityId: city.id,
    bounds: padBounds(
      {
        left: city.x - 18,
        top: city.y - 18,
        right: city.x + 18,
        bottom: city.y + 18
      },
      defaultPadding.station - 18,
      board.width,
      board.height
    )
  }));

  const labels = config.cities.map((city) => {
    const label = city.label ?? city.name;
    const labelX = city.x + (city.labelDx ?? 14);
    const labelY = city.y + (city.labelDy ?? -14);
    const width = Math.max(44, label.length * 9);
    const anchor = city.labelAnchor ?? "start";
    const left = anchor === "end" ? labelX - width : anchor === "middle" ? labelX - width / 2 : labelX;
    return {
      id: `label:${city.id}`,
      kind: "label",
      cityId: city.id,
      bounds: padBounds(
        {
          left,
          top: labelY - 18,
          right: left + width,
          bottom: labelY + 8
        },
        defaultPadding.label,
        board.width,
        board.height
      )
    };
  });

  return { routes, stations, labels };
}

function readPoint(raw, board, coordinates, label) {
  if (!Array.isArray(raw) || raw.length !== 2) {
    throw new Error(`${label} must be [x, y]`);
  }
  const x = requireNumber(raw[0], `${label}[0]`);
  const y = requireNumber(raw[1], `${label}[1]`);
  return coordinates === "board" ? { x, y } : { x: Math.round(x * board.width), y: Math.round(y * board.height) };
}

function readPoints(rawPoints, board, coordinates, label) {
  if (!Array.isArray(rawPoints) || rawPoints.length < 2) {
    throw new Error(`${label} must include at least two points`);
  }
  return rawPoints.map((point, index) => readPoint(point, board, coordinates, `${label}[${index}]`));
}

function readBounds(raw, board, coordinates, label) {
  if (!Array.isArray(raw) || raw.length !== 4) {
    throw new Error(`${label} must be [x, y, width, height]`);
  }
  const x = requireNumber(raw[0], `${label}[0]`);
  const y = requireNumber(raw[1], `${label}[1]`);
  const width = requireNumber(raw[2], `${label}[2]`);
  const height = requireNumber(raw[3], `${label}[3]`);
  return coordinates === "board"
    ? { x, y, width, height }
    : {
        x: Math.round(x * board.width),
        y: Math.round(y * board.height),
        width: Math.round(width * board.width),
        height: Math.round(height * board.height)
      };
}

function landmarkBounds(landmark) {
  if (landmark.bounds) {
    return {
      left: landmark.bounds.x,
      top: landmark.bounds.y,
      right: landmark.bounds.x + landmark.bounds.width,
      bottom: landmark.bounds.y + landmark.bounds.height
    };
  }
  return {
    left: landmark.point.x - 6,
    top: landmark.point.y - 6,
    right: landmark.point.x + 6,
    bottom: landmark.point.y + 6
  };
}

function lineBounds(line, board) {
  return boundsFromPoints(line.points, 10, board.width, board.height);
}

function hitsProtectedZones(bounds, protectedZones) {
  return protectedZones.some((zone) => boundsIntersect(bounds, zone.bounds));
}

function mapArea(area, board, coordinates, collectionName) {
  return {
    id: area.id,
    points: readPoints(area.points, board, coordinates, `${collectionName}.${area.id}.points`),
    ...(area.opacity === undefined ? {} : { opacity: area.opacity })
  };
}

function mapLine(line, board, coordinates, collectionName) {
  return {
    id: line.id,
    points: readPoints(line.points, board, coordinates, `${collectionName}.${line.id}.points`)
  };
}

function mapLabel(label, board, coordinates) {
  return {
    id: label.id,
    text: label.text,
    point: readPoint(label.point, board, coordinates, `regionLabels.${label.id}.point`),
    ...(label.vertical ? { vertical: true } : {})
  };
}

function mapLandmark(landmark, board, coordinates) {
  const mapped = {
    id: landmark.id,
    kind: landmark.kind,
    ...(landmark.label ? { label: landmark.label } : {}),
    ...(landmark.opacity === undefined ? {} : { opacity: landmark.opacity }),
    ...(landmark.priority ? { priority: landmark.priority } : {})
  };

  if (landmark.bounds) {
    return {
      ...mapped,
      bounds: readBounds(landmark.bounds, board, coordinates, `landmarks.${landmark.id}.bounds`)
    };
  }

  return {
    ...mapped,
    point: readPoint(landmark.point, board, coordinates, `landmarks.${landmark.id}.point`)
  };
}

function mapThemeLine(line, board, coordinates) {
  return {
    id: line.id,
    kind: line.kind,
    points: readPoints(line.points, board, coordinates, `themeLines.${line.id}.points`),
    ...(line.opacity === undefined ? {} : { opacity: line.opacity }),
    ...(line.priority ? { priority: line.priority } : {})
  };
}

function generateBackdrop(recipe, configInfo, protectedZones) {
  const board = {
    width: configInfo.map.board.width,
    height: configInfo.map.board.height
  };
  const coordinates = recipe.coordinates ?? "normalized";
  if (!["normalized", "board"].includes(coordinates)) {
    throw new Error('recipe.coordinates must be "normalized" or "board"');
  }

  const avoidZones = [...protectedZones.routes, ...protectedZones.stations, ...protectedZones.labels];
  const omitted = [];
  const landAreas = (recipe.landAreas ?? []).map((area) => mapArea(area, board, coordinates, "landAreas"));
  const waterAreas = (recipe.waterAreas ?? []).map((area) => mapArea(area, board, coordinates, "waterAreas"));
  const shorelines = (recipe.shorelines ?? []).map((line) => mapLine(line, board, coordinates, "shorelines"));
  const regionLabels = (recipe.regionLabels ?? []).map((label) => mapLabel(label, board, coordinates));
  const landmarks = [];
  const themeLines = [];

  for (const source of recipe.landmarks ?? []) {
    const landmark = mapLandmark(source, board, coordinates);
    if (source.avoidProtectedZones !== false && hitsProtectedZones(landmarkBounds(landmark), avoidZones)) {
      omitted.push({ id: landmark.id, collection: "landmarks", reason: "intersects protected route, station, or label zone" });
      continue;
    }
    landmarks.push(landmark);
  }

  for (const source of recipe.themeLines ?? []) {
    const line = mapThemeLine(source, board, coordinates);
    if (source.avoidProtectedZones !== false && hitsProtectedZones(lineBounds(line, board), avoidZones)) {
      omitted.push({ id: line.id, collection: "themeLines", reason: "intersects protected route, station, or label zone" });
      continue;
    }
    themeLines.push(line);
  }

  return {
    landAreas,
    waterAreas,
    shorelines,
    regionLabels,
    landmarks,
    themeLines,
    generatedBy: {
      recipeId: recipe.recipeId,
      generatorVersion: "basemap-candidate-script-v1",
      acceptedAt: new Date().toISOString().slice(0, 10),
      notes: [
        `Candidate generated from ${configInfo.configId}.`,
        `Protected zones: ${protectedZones.routes.length} routes, ${protectedZones.stations.length} stations, ${protectedZones.labels.length} labels.`,
        ...(omitted.length > 0 ? [`Omitted ${omitted.length} protected-zone conflicts: ${omitted.map((item) => item.id).join(", ")}.`] : []),
        ...(recipe.notes ?? [])
      ]
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config || !args.recipe || !args.out) {
    usage();
  }

  const configInfo = await resolveConfig(args.config);
  const recipe = await readJson(normalizePath(args.recipe));
  if (recipe.schemaVersion !== 1) {
    throw new Error("Only basemap recipe schemaVersion 1 is supported");
  }
  if (!recipe.recipeId) {
    throw new Error("Recipe must include recipeId");
  }

  const mapConfig = toMapConfig(configInfo.map);
  const protectedZones = args["protected-zones"]
    ? await readJson(normalizePath(args["protected-zones"]))
    : buildProtectedZones(mapConfig, configInfo.map.board);
  const backdrop = generateBackdrop(recipe, configInfo, protectedZones);
  const outPath = normalizePath(args.out);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(backdrop, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        generated: true,
        outputPath: path.relative(rootDir, outPath),
        configId: configInfo.configId,
        recipeId: recipe.recipeId,
        counts: {
          landAreas: backdrop.landAreas.length,
          waterAreas: backdrop.waterAreas.length,
          shorelines: backdrop.shorelines.length,
          regionLabels: backdrop.regionLabels.length,
          landmarks: backdrop.landmarks.length,
          themeLines: backdrop.themeLines.length
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
