import { readCurrentPointer, refreshRegistry, resolveSnapshotEntry } from "./config-snapshot-lib.mjs";

function usage() {
  console.error("Usage: pnpm config:preview <config-id>");
  console.error("       pnpm config:preview --current");
  process.exit(1);
}

async function main() {
  const argument = process.argv[2];
  if (!argument) {
    usage();
  }

  await refreshRegistry();

  const current = await readCurrentPointer();
  const targetId = argument === "--current" ? current.activeConfigId : argument;
  const entry = await resolveSnapshotEntry(targetId);

  if (!entry) {
    throw new Error(`Unknown config id "${targetId}". Run pnpm config:switch --list to inspect available configs.`);
  }

  console.log(
    JSON.stringify(
      {
        configId: entry.configId,
        mode: entry.mode,
        path: entry.configPath,
        active: entry.configId === current.activeConfigId,
        version: entry.meta.version,
        status: entry.meta.status,
        summary: entry.meta.summary,
        designGoals: entry.meta.designGoals,
        changeSummary: entry.meta.changeSummary,
        playtestFocus: entry.meta.playtestFocus,
        counts: {
          stations: entry.stationCount,
          routes: entry.routeCount,
          longTickets: entry.longTicketCount,
          regularTickets: entry.regularTicketCount,
          totalTickets: entry.totalTicketCount
        },
        visuals: {
          theme: entry.visuals.theme,
          backdropMode: entry.visuals.backdropMode,
          boardLabelMode: entry.visuals.boardLabelMode
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
