import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const currentConfigPath = path.join(rootDir, "configs/hudson-hustle/current.json");
const registryScriptPath = path.join(rootDir, "scripts/generate-config-registry.mjs");
function usage() {
  console.error("Usage: pnpm config:switch <config-id>");
  process.exit(1);
}

function runNodeScript(scriptPath) {
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function listSnapshotEntries() {
  const entries = [];

  for (const [mode, folder] of [
    ["draft", path.join(rootDir, "configs/hudson-hustle/drafts")],
    ["release", path.join(rootDir, "configs/hudson-hustle/releases")]
  ]) {
    const dirents = await readdir(folder, { withFileTypes: true });
    for (const entry of dirents) {
      if (!entry.isDirectory()) {
        continue;
      }
      entries.push({
        configId: entry.name,
        mode,
        configPath: `configs/hudson-hustle/${mode === "draft" ? "drafts" : "releases"}/${entry.name}`
      });
    }
  }

  return entries;
}

async function main() {
  const nextId = process.argv[2];
  if (!nextId) {
    usage();
  }

  await runNodeScript(registryScriptPath);

  const current = await readJson(currentConfigPath);
  const availableEntries = await listSnapshotEntries();
  const target = availableEntries.find((entry) => entry.configId === nextId);

  if (!target) {
    const availableIds = availableEntries.map((entry) => entry.configId).sort();
    throw new Error(`Unknown config id "${nextId}". Available ids: ${availableIds.join(", ")}`);
  }

  const nextPointer = {
    ...current,
        activeConfigId: target.configId,
        activeConfigPath: target.configPath,
        mode: target.mode
  };

  await writeFile(currentConfigPath, `${JSON.stringify(nextPointer, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        switched: true,
        activeConfigId: target.configId,
        activeConfigPath: target.configPath,
        mode: target.mode,
        nextSteps: ["pnpm build", "pnpm dev"]
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
