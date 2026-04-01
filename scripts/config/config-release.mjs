import path from "node:path";
import { copySnapshotDirectory, readJson, refreshRegistry, resolveSnapshotEntry, rootDir, writeJson } from "./config-snapshot-lib.mjs";

function usage() {
  console.error("Usage: pnpm config:release <draft-id> <release-id> <version>");
  process.exit(1);
}

async function main() {
  const draftId = process.argv[2];
  const releaseId = process.argv[3];
  const version = process.argv[4];

  if (!draftId || !releaseId || !version) {
    usage();
  }

  await refreshRegistry();

  const source = await resolveSnapshotEntry(draftId);
  if (!source) {
    throw new Error(`Unknown draft id "${draftId}".`);
  }
  if (source.mode !== "draft") {
    throw new Error(`Config "${draftId}" is not a draft.`);
  }

  const existingRelease = await resolveSnapshotEntry(releaseId);
  if (existingRelease) {
    throw new Error(`Release id "${releaseId}" already exists.`);
  }

  const destinationPath = path.join(rootDir, "configs/hudson-hustle/releases", releaseId);
  await copySnapshotDirectory(source.absolutePath, destinationPath);

  const metaPath = path.join(destinationPath, "meta.json");
  const meta = await readJson(metaPath);
  const updatedMeta = {
    ...meta,
    id: releaseId,
    version,
    status: "released",
    basedOn: source.configId,
    updatedAt: new Date().toISOString()
  };
  await writeJson(metaPath, updatedMeta);

  await refreshRegistry();

  console.log(
    JSON.stringify(
      {
        released: true,
        from: source.configId,
        to: releaseId,
        version,
        path: `configs/hudson-hustle/releases/${releaseId}`,
        nextSteps: [`pnpm config:preview ${releaseId}`, `pnpm config:switch ${releaseId}`]
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
