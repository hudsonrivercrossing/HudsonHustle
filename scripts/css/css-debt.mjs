// Measures how far the stylesheets are from the "tokens only" rule and refuses to let it get worse.
//   node scripts/css/css-debt.mjs            compare against the baseline; exit 1 if any count grew
//   node scripts/css/css-debt.mjs --update   write the current counts as the new baseline
//   node scripts/css/css-debt.mjs --list <metric>   print the offending lines for one metric
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stylesDir = path.join(rootDir, "apps/web/src/styles");
const sourceDir = path.join(rootDir, "apps/web/src");
const baselinePath = path.join(rootDir, "scripts/css/css-debt-baseline.json");
const TOKEN_FILE = "theme.css";

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

function walk(dir, matches, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, matches, out);
    } else if (matches(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const cssFiles = readdirSync(stylesDir)
  .filter((name) => name.endsWith(".css"))
  .sort()
  .map((name) => ({ name, text: stripComments(readFileSync(path.join(stylesDir, name), "utf8")) }));
const componentCss = cssFiles.filter((file) => file.name !== TOKEN_FILE);
const tsxText = walk(sourceDir, (name) => /\.tsx?$/.test(name))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

/** Every declaration outside the token file, as { file, line, property, value }. */
function declarations() {
  const found = [];
  for (const file of componentCss) {
    file.text.split("\n").forEach((lineText, index) => {
      const match = lineText.match(/^\s*([a-z-]+)\s*:\s*([^;{}]+);?\s*$/);
      if (match && !match[1].startsWith("--")) {
        found.push({ file: file.name, line: index + 1, property: match[1], value: match[2].trim() });
      }
    });
  }
  return found;
}

const allDeclarations = declarations();
const definedTokens = new Set();
for (const file of cssFiles) {
  for (const match of file.text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    definedTokens.add(match[1]);
  }
}
for (const match of tsxText.matchAll(/["'`](--[a-z0-9-]+)["'`]/gi)) {
  definedTokens.add(match[1]); // set from React via inline style
}

const usedTokens = new Map();
for (const file of cssFiles) {
  file.text.split("\n").forEach((lineText, index) => {
    for (const match of lineText.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)) {
      const uses = usedTokens.get(match[1]) ?? [];
      uses.push({ file: file.name, line: index + 1, hasFallback: Boolean(match[2]) });
      usedTokens.set(match[1], uses);
    }
  });
}
for (const match of tsxText.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
  if (!usedTokens.has(match[1])) usedTokens.set(match[1], []);
}

const themeTokens = new Set([...cssFiles.find((file) => file.name === TOKEN_FILE).text.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((match) => match[1]));

const where = (entry) => `${entry.file}:${entry.line}`;
const metrics = {
  // A var() with no definition and no fallback makes the whole declaration invalid, silently.
  undefinedTokens: [...usedTokens.entries()]
    .filter(([token]) => !definedTokens.has(token))
    .flatMap(([token, uses]) => uses.filter((use) => !use.hasFallback).map((use) => `${where(use)} ${token}`)),
  unusedTokens: [...themeTokens].filter((token) => !usedTokens.has(token)).map((token) => `${TOKEN_FILE} ${token}`),
  important: allDeclarations.filter((entry) => entry.value.includes("!important")).map((entry) => `${where(entry)} ${entry.property}`),
  literalColors: allDeclarations
    .filter((entry) => /#[0-9a-f]{3,8}\b|\brgba?\(\s*\d/i.test(entry.value))
    .map((entry) => `${where(entry)} ${entry.property}: ${entry.value}`),
  literalFontWeights: allDeclarations
    .filter((entry) => entry.property === "font-weight" && /^\d/.test(entry.value))
    .map((entry) => `${where(entry)} ${entry.value}`),
  literalFontSizes: allDeclarations
    .filter((entry) => entry.property === "font-size" && /^[\d.]/.test(entry.value))
    .map((entry) => `${where(entry)} ${entry.value}`),
  literalRadii: allDeclarations
    .filter((entry) => entry.property.endsWith("radius") && /\d+(px|rem)/.test(entry.value) && !entry.value.includes("var("))
    .map((entry) => `${where(entry)} ${entry.value}`),
  literalZIndex: allDeclarations
    .filter((entry) => entry.property === "z-index" && /^-?\d/.test(entry.value))
    .map((entry) => `${where(entry)} ${entry.value}`),
  literalSpacing: allDeclarations
    .filter((entry) => /^(gap|row-gap|column-gap|padding|margin)(-|$)/.test(entry.property) && /\b[3-9]px|\b\d{2,}px/.test(entry.value) && !entry.value.includes("var("))
    .map((entry) => `${where(entry)} ${entry.property}: ${entry.value}`),
  transitionAll: allDeclarations
    .filter((entry) => entry.property === "transition" && /^all\b/.test(entry.value))
    .map((entry) => `${where(entry)}`)
};

const counts = Object.fromEntries(Object.entries(metrics).map(([name, entries]) => [name, entries.length]));
const [, , flag, flagValue] = process.argv;

if (flag === "--list") {
  if (!metrics[flagValue]) {
    console.error(`Unknown metric. Choose one of: ${Object.keys(metrics).join(", ")}`);
    process.exit(2);
  }
  console.log(metrics[flagValue].join("\n"));
  process.exit(0);
}

if (flag === "--update") {
  writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log("CSS debt baseline updated:", counts);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const grew = Object.entries(counts).filter(([name, count]) => count > (baseline[name] ?? 0));
const shrank = Object.entries(counts).filter(([name, count]) => count < (baseline[name] ?? 0));

for (const [name, count] of Object.entries(counts)) {
  console.log(`${name.padEnd(20)} ${String(count).padStart(5)}  (baseline ${baseline[name] ?? 0})`);
}
if (grew.length > 0) {
  console.error(`\nCSS debt grew: ${grew.map(([name, count]) => `${name} ${baseline[name] ?? 0} → ${count}`).join(", ")}.`);
  console.error("Use a token from theme.css instead. To see the lines: node scripts/css/css-debt.mjs --list <metric>");
  process.exit(1);
}
if (shrank.length > 0) {
  console.log(`\nDebt went down (${shrank.map(([name]) => name).join(", ")}). Lock it in with: pnpm css:debt --update`);
}
