import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

export const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const configsRoot = path.join(rootDir, "configs/hudson-hustle");
export const currentConfigPath = path.join(configsRoot, "current.json");
export const registryScriptPath = path.join(rootDir, "scripts/config/generate-config-registry.mjs");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Script failed with exit code ${code}: ${path.relative(rootDir, scriptPath)}`));
    });

    child.on("error", reject);
  });
}

export async function refreshRegistry() {
  await runNodeScript(registryScriptPath);
}

export async function readCurrentPointer() {
  return readJson(currentConfigPath);
}

export async function listSnapshotEntries() {
  const entries = [];

  for (const [mode, folderName] of [
    ["draft", "drafts"],
    ["release", "releases"]
  ]) {
    const folder = path.join(configsRoot, folderName);
    const dirents = await readdir(folder, { withFileTypes: true });
    for (const entry of dirents) {
      if (!entry.isDirectory()) {
        continue;
      }
      const configPath = `configs/hudson-hustle/${folderName}/${entry.name}`;
      const absolutePath = path.join(rootDir, configPath);
      const metaPath = path.join(absolutePath, "meta.json");
      const mapPath = path.join(absolutePath, "map.json");
      const ticketsPath = path.join(absolutePath, "tickets.json");
      const visualsPath = path.join(absolutePath, "visuals.json");

      const [meta, map, tickets, visuals] = await Promise.all([
        readJson(metaPath),
        readJson(mapPath),
        readJson(ticketsPath),
        readJson(visualsPath)
      ]);

      entries.push({
        configId: entry.name,
        mode,
        configPath,
        absolutePath,
        meta,
        map,
        tickets,
        visuals,
        stationCount: map.stations.filter((station) => station.active).length,
        routeCount: map.routes.length,
        longTicketCount: tickets.long.length,
        regularTicketCount: tickets.regular.length,
        totalTicketCount: tickets.long.length + tickets.regular.length
      });
    }
  }

  return entries.sort((left, right) => left.configId.localeCompare(right.configId));
}

export async function resolveSnapshotEntry(configId) {
  const entries = await listSnapshotEntries();
  return entries.find((entry) => entry.configId === configId) ?? null;
}

export async function copySnapshotDirectory(sourcePath, destinationPath) {
  await cp(sourcePath, destinationPath, { recursive: true, errorOnExist: true });
}
