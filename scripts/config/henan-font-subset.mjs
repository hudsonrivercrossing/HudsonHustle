// Cuts LXGW WenKai (霞鹜文楷) down to the Chinese characters the Henan map shows, as two small woff2 files.
//   node scripts/config/henan-font-subset.mjs <LXGWWenKai-Regular.ttf> <LXGWWenKai-Medium.ttf>
// Run it again after adding a station or a basemap name with a character the map did not have before;
// a character missing from the subset is drawn in the system's own Chinese font instead.
// Needs `pyftsubset` (pip install fonttools brotli); set PYFTSUBSET to its path if it is not on PATH.
// The full fonts are at https://github.com/lxgw/LxgwWenKai/releases (SIL Open Font License 1.1).
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { names } from "./henan-basemap.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [regular, medium] = process.argv.slice(2);
if (!regular || !medium) {
  throw new Error("usage: node scripts/config/henan-font-subset.mjs <LXGWWenKai-Regular.ttf> <LXGWWenKai-Medium.ttf>");
}

const configDir = path.join(rootDir, "configs/hudson-hustle/releases/henan");
const map = JSON.parse(readFileSync(path.join(configDir, "map.json"), "utf8"));
const text = [
  map.name,
  ...Object.values(map.typeLabelOverrides ?? {}),
  ...map.stations.flatMap((station) => [station.name, station.label ?? ""]),
  ...names.map((name) => name.text),
  "河南大河中原北" // the basemap's title and compass
].join("");
const characters = [...new Set([...text].filter((character) => /[⺀-鿿]/.test(character)))].sort().join("");

for (const [source, weight] of [[regular, "regular"], [medium, "medium"]]) {
  const out = path.join(rootDir, `apps/web/public/fonts/lxgw-wenkai-henan-${weight}.woff2`);
  execFileSync(process.env.PYFTSUBSET ?? "pyftsubset", [source, `--text=${characters}·`, "--flavor=woff2", "--layout-features=", "--no-hinting", `--output-file=${out}`]);
  console.log(`wrote ${path.relative(rootDir, out)}: ${[...characters].length} characters, ${Math.round(statSync(out).size / 1024)} KB`);
}
