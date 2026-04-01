import { currentConfigPath, listSnapshotEntries, readCurrentPointer, refreshRegistry, writeJson } from "./config-snapshot-lib.mjs";

function usage() {
  console.error("Usage: pnpm config:switch <config-id>");
  console.error("       pnpm config:switch --list");
  process.exit(1);
}

function printList(entries, current) {
  const lines = entries.map((entry) => {
    const activeMarker = entry.configId === current.activeConfigId ? "*" : " ";
    return `${activeMarker} ${entry.configId} [${entry.mode}] ${entry.meta.version} - ${entry.meta.summary}`;
  });
  console.log(lines.join("\n"));
}

async function main() {
  const argument = process.argv[2];
  if (!argument) {
    usage();
  }

  await refreshRegistry();
  const current = await readCurrentPointer();
  const availableEntries = await listSnapshotEntries();

  if (argument === "--list") {
    printList(availableEntries, current);
    return;
  }

  const target = availableEntries.find((entry) => entry.configId === argument);

  if (!target) {
    const availableIds = availableEntries.map((entry) => entry.configId).sort();
    throw new Error(`Unknown config id "${argument}". Available ids: ${availableIds.join(", ")}`);
  }

  const nextPointer = {
    ...current,
    activeConfigId: target.configId,
    activeConfigPath: target.configPath,
    mode: target.mode
  };

  await writeJson(currentConfigPath, nextPointer);

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
