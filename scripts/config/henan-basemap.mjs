// Draws the Henan basemap: a hand-drawn-looking sheet of the province with the Yellow River, the Huai,
// the Taihang, Funiu, Song and Dabie ranges and a few place names, under the routes and stations.
//   pnpm --filter @hudson-hustle/game-data build
//   node scripts/config/henan-basemap.mjs                 writes apps/web/public/basemaps/henan-central-plains-v1.webp
//   node scripts/config/henan-basemap.mjs --preview out.png   also draws the routes on top, to check by eye
// Everything is placed in board coordinates (1200 x 900), next to the stations as the board draws them,
// so the river runs between the right pairs of stations even where the board bends real geography.
// The drawing is an SVG rendered by the Chromium that Playwright installs; `cwebp` writes the file.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = path.join(rootDir, "apps/web/public/basemaps/henan-central-plains-v1.webp");
/** The names on the sheet are set in LXGW WenKai, from the subset the app serves (see henan-font-subset.mjs). */
const fontPath = path.join(rootDir, "apps/web/public/fonts/lxgw-wenkai-henan-medium.woff2");
const WIDTH = 1200;
const HEIGHT = 900;
const SCALE = 4 / 3; // rendered at 1600 x 1200

/** The same numbers every run, so the sheet does not change unless this file does. */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
const random = seededRandom(1958);

/** A smooth line through points, as an SVG path. */
function smoothPath(points, closed = false) {
  const p = closed ? [points.at(-1), ...points, points[0], points[1]] : [points[0], ...points, points.at(-1)];
  let d = `M${p[1][0]},${p[1][1]}`;
  for (let i = 1; i < p.length - 2; i += 1) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    d += ` C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2},${y2}`;
  }
  return closed ? `${d} Z` : d;
}

// The province, clockwise from its western tip. West of Jiyuan the Yellow River is the border.
const province = [
  [38, 338], [70, 318], [150, 312], [235, 316], [300, 308], [322, 262], [352, 212], [420, 190], [492, 160], [552, 122],
  [596, 82], [640, 42], [720, 20], [830, 12], [935, 14], [1000, 40], [1062, 82], [1120, 96], [1182, 92], [1190, 128],
  [1128, 186], [1062, 262], [1040, 300], [1078, 338], [1140, 356], [1192, 440], [1170, 498], [1100, 492], [1042, 548],
  [1016, 630], [1052, 700], [1126, 752], [1128, 838], [1040, 872], [900, 886], [760, 890], [640, 892], [560, 866],
  [500, 812], [440, 772], [350, 786], [240, 778], [140, 728], [92, 650], [112, 566], [80, 476], [40, 404]
];

const yellowRiver = [
  [-20, 300], [40, 322], [100, 322], [170, 314], [240, 318], [310, 312], [372, 322], [430, 316], [500, 298], [570, 284],
  [640, 282], [700, 280], [770, 286], [840, 292], [910, 290], [968, 276], [1012, 248], [1060, 222], [1110, 196],
  [1160, 150], [1220, 96]
];
const huaiRiver = [[500, 786], [570, 770], [650, 774], [720, 764], [800, 770], [880, 760], [960, 752], [1040, 756], [1120, 742], [1220, 738]];
const luoRiver = [[150, 452], [220, 430], [290, 412], [345, 398], [400, 368], [440, 338], [470, 306]];
const yingRiver = [[470, 520], [560, 520], [640, 540], [720, 548], [800, 560], [880, 590], [960, 610], [1040, 640], [1110, 660]];
const weiRiver = [[560, 232], [640, 222], [720, 190], [790, 150], [850, 100], [900, 78], [980, 60], [1060, 30]];
const danjiangkou = [[196, 740], [232, 728], [262, 744], [286, 770], [262, 792], [224, 786], [200, 768]];

// Ridges: a line of peaks is scattered around each, `spread` units to either side.
const ranges = [
  { name: "taihang", spread: 34, count: 120, line: [[300, 236], [380, 196], [450, 160], [520, 122], [580, 78], [640, 30], [690, 8]] },
  { name: "taihang-foot", spread: 22, count: 46, line: [[610, 96], [660, 56], [730, 40], [790, 34]] },
  { name: "funiu", spread: 46, count: 150, line: [[100, 450], [170, 490], [250, 540], [330, 580], [420, 600], [480, 610]] },
  { name: "xionger", spread: 26, count: 60, line: [[120, 410], [200, 430], [280, 450], [340, 470]] },
  { name: "funiu-south", spread: 30, count: 60, line: [[120, 590], [200, 600], [280, 630], [340, 640]] },
  { name: "song", spread: 18, count: 30, line: [[452, 470], [500, 462], [548, 452], [588, 430]] },
  { name: "tongbai-dabie", spread: 26, count: 130, line: [[470, 820], [560, 852], [680, 884], [820, 880], [940, 868], [1060, 850], [1140, 800]] }
];

// Names written on the sheet. Kept clear of routes and station names; `--preview` shows any that are not.
export const names = [
  { text: "黄河", x: 250, y: 300, size: 19, rotate: -1, tone: "water" },
  { text: "黄河", x: 884, y: 276, size: 19, rotate: 1, tone: "water" },
  { text: "淮河", x: 906, y: 742, size: 16, rotate: -4, tone: "water" },
  { text: "太 行 山", x: 452, y: 132, size: 20, rotate: -31, tone: "land" },
  { text: "伏 牛 山", x: 300, y: 610, size: 20, rotate: 14, tone: "land" },
  { text: "大 别 山", x: 930, y: 852, size: 18, rotate: -5, tone: "land" },
  { text: "桐柏山", x: 548, y: 826, size: 15, rotate: 22, tone: "land" },
  { text: "黄 淮 平 原", x: 900, y: 660, size: 18, rotate: 0, tone: "plain" },
  { text: "南阳盆地", x: 362, y: 748, size: 16, rotate: 0, tone: "plain" },
  { text: "山 西", x: 200, y: 232, size: 26, rotate: 0, tone: "neighbour" },
  { text: "河 北", x: 1070, y: 40, size: 22, rotate: 0, tone: "neighbour" },
  { text: "山 东", x: 1140, y: 262, size: 22, rotate: 0, tone: "neighbour" },
  { text: "安 徽", x: 1136, y: 600, size: 24, rotate: 0, tone: "neighbour" },
  { text: "湖 北", x: 300, y: 846, size: 24, rotate: 0, tone: "neighbour" },
  { text: "陕 西", x: 52, y: 560, size: 22, rotate: -90, tone: "neighbour" },
  { text: "龙门石窟", x: 318, y: 442, size: 13, rotate: 0, tone: "sight" },
  { text: "殷墟", x: 1006, y: 70, size: 13, rotate: 0, tone: "sight" },
  { text: "清明上河园", x: 850, y: 318, size: 13, rotate: 0, tone: "sight" },
  { text: "太行大峡谷", x: 594, y: 52, size: 13, rotate: 0, tone: "sight" },
  { text: "小浪底", x: 300, y: 344, size: 13, rotate: 0, tone: "sight" },
  { text: "丹江口水库", x: 150, y: 812, size: 13, rotate: 0, tone: "sight" }
];

function pointOnLine(line, t) {
  const lengths = line.slice(1).map((point, index) => Math.hypot(point[0] - line[index][0], point[1] - line[index][1]));
  let remaining = t * lengths.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i]) {
      const ratio = remaining / lengths[i];
      return [line[i][0] + (line[i + 1][0] - line[i][0]) * ratio, line[i][1] + (line[i + 1][1] - line[i][1]) * ratio];
    }
    remaining -= lengths[i];
  }
  return line.at(-1);
}

function peaks() {
  const all = [];
  for (const range of ranges) {
    for (let i = 0; i < range.count; i += 1) {
      const [x, y] = pointOnLine(range.line, random());
      const offset = (random() + random() - 1) * range.spread;
      all.push({ x: x + offset * 0.7, y: y + offset, size: 6 + random() * 7 });
    }
  }
  // Drawn back to front, so nearer peaks overlap the ones behind them.
  return all
    .sort((a, b) => a.y - b.y)
    .map(({ x, y, size }) => {
      const lean = (random() - 0.5) * size * 0.5;
      const left = `${(x - size).toFixed(1)},${(y + size * 0.62).toFixed(1)}`;
      const top = `${(x + lean).toFixed(1)},${(y - size * 0.62).toFixed(1)}`;
      const right = `${(x + size).toFixed(1)},${(y + size * 0.62).toFixed(1)}`;
      const shade = `${(x + lean * 0.4 + size * 0.18).toFixed(1)},${(y + size * 0.62).toFixed(1)}`;
      return `<path d="M${left} L${top} L${right} Z" fill="#e6d7ae"/><path d="M${top} L${right} L${shade} Z" fill="#b9a878" opacity="0.55"/><path d="M${left} L${top} L${right}" fill="none" stroke="#8a7650" stroke-width="0.9" stroke-linejoin="round" opacity="0.75"/>`;
    })
    .join("");
}

/** Faint field boundaries across the plain, clipped to the province. */
function fields() {
  let d = "";
  for (let i = 0; i < 70; i += 1) {
    const x = 420 + random() * 760;
    const y = 120 + random() * 720;
    const angle = (random() - 0.5) * 0.5 + (random() > 0.5 ? 0 : Math.PI / 2);
    const length = 40 + random() * 110;
    d += `M${x.toFixed(0)},${y.toFixed(0)} l${(Math.cos(angle) * length).toFixed(0)},${(Math.sin(angle) * length).toFixed(0)} `;
  }
  return `<path d="${d}" fill="none" stroke="#a8946a" stroke-width="0.7" opacity="0.28"/>`;
}

/** Soft green patches where the hills are wooded. */
function woods() {
  let out = "";
  for (const range of ranges) {
    for (let i = 0; i < range.count / 5; i += 1) {
      const [x, y] = pointOnLine(range.line, random());
      const offset = (random() - 0.5) * 2 * range.spread;
      out += `<ellipse cx="${(x + offset * 0.6).toFixed(0)}" cy="${(y + offset).toFixed(0)}" rx="${(16 + random() * 22).toFixed(0)}" ry="${(10 + random() * 14).toFixed(0)}" fill="#8f9a5a" opacity="0.2"/>`;
    }
  }
  return out;
}

const tones = {
  water: { fill: "#4f7178", opacity: 0.8, style: "italic" },
  land: { fill: "#6b5636", opacity: 0.62, style: "normal" },
  plain: { fill: "#7a6a48", opacity: 0.4, style: "normal" },
  neighbour: { fill: "#7c6d54", opacity: 0.34, style: "normal" },
  sight: { fill: "#6b4a2c", opacity: 0.7, style: "normal" }
};

function nameMarks() {
  return names
    .map((name) => {
      const tone = tones[name.tone];
      const dot = name.tone === "sight" ? `<circle cx="${name.x - 8}" cy="${name.y - name.size * 0.36}" r="2.4" fill="none" stroke="${tone.fill}" stroke-width="1.1" opacity="${tone.opacity}"/>` : "";
      return `${dot}<text x="${name.x}" y="${name.y}" font-size="${name.size}" fill="${tone.fill}" opacity="${tone.opacity}" font-style="${tone.style}" stroke="#eddfb6" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke" transform="rotate(${name.rotate} ${name.x} ${name.y})">${name.text}</text>`;
    })
    .join("");
}

function compass() {
  return `<g transform="translate(118 122)" opacity="0.5" stroke="#6b5636" fill="none" stroke-width="1.1">
    <circle r="30"/><circle r="24" stroke-dasharray="1.5 4"/>
    <path d="M0,-40 L6,-6 L0,0 L-6,-6 Z" fill="#6b5636"/><path d="M0,40 L6,6 L0,0 L-6,6 Z"/><path d="M-40,0 L-6,-6 L0,0 L-6,6 Z"/><path d="M40,0 L6,-6 L0,0 L6,6 Z"/>
    <text x="0" y="-46" text-anchor="middle" font-size="15" fill="#6b5636" stroke="none">北</text></g>`;
}

export function basemapSvg() {
  const provincePath = smoothPath(province, true);
  const river = smoothPath(yellowRiver);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH * SCALE}" height="${HEIGHT * SCALE}" font-family="'LXGW WenKai','Kaiti SC','STKaiti','KaiTi','Songti SC',serif">
  <defs>
    <style>@font-face { font-family: "LXGW WenKai"; src: url("data:font/woff2;base64,${readFileSync(fontPath).toString("base64")}") format("woff2"); }</style>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="7" result="cloud"/>
      <feColorMatrix in="cloud" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.2  0.9 0.2 0 0 -0.42" result="stain"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.11 0" result="speck"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="stain"/><feMergeNode in="speck"/></feMerge>
    </filter>
    <filter id="hand" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" result="wobble"/>
      <feDisplacementMap in="SourceGraphic" in2="wobble" scale="5"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="softer"><feGaussianBlur stdDeviation="16"/></filter>
    <clipPath id="inside"><path d="${provincePath}"/></clipPath>
    <radialGradient id="edge" cx="50%" cy="50%" r="75%"><stop offset="62%" stop-color="#5a4424" stop-opacity="0"/><stop offset="100%" stop-color="#5a4424" stop-opacity="0.2"/></radialGradient>
  </defs>
  <g filter="url(#paper)">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#dcc99b"/>
    <g filter="url(#hand)">
      <path d="${provincePath}" fill="#8a7448" opacity="0.3" filter="url(#softer)"/>
      <path d="${provincePath}" fill="#eddfb6"/>
      <g clip-path="url(#inside)">
        <path d="${provincePath}" fill="none" stroke="#c9a66a" stroke-width="26" opacity="0.3" filter="url(#soft)"/>
        ${fields()}
      </g>
      ${woods()}
      <path d="${smoothPath(danjiangkou, true)}" fill="#87a3a0" stroke="#5f7f80" stroke-width="1" opacity="0.8"/>
      <path d="${smoothPath(luoRiver)}" fill="none" stroke="#7d9b9a" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <path d="${smoothPath(yingRiver)}" fill="none" stroke="#7d9b9a" stroke-width="2.6" stroke-linecap="round" opacity="0.55"/>
      <path d="${smoothPath(weiRiver)}" fill="none" stroke="#7d9b9a" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>
      <path d="${smoothPath(huaiRiver)}" fill="none" stroke="#7d9b9a" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
      <path d="${river}" fill="none" stroke="#c9b27a" stroke-width="26" stroke-linecap="round" opacity="0.5"/>
      <path d="${river}" fill="none" stroke="#5f7f80" stroke-width="15" stroke-linecap="round" opacity="0.9"/>
      <path d="${river}" fill="none" stroke="#8fabaa" stroke-width="11" stroke-linecap="round"/>
      <path d="${river}" fill="none" stroke="#c4d2c4" stroke-width="2" stroke-dasharray="14 22" stroke-linecap="round" opacity="0.6"/>
      ${peaks()}
      <path d="${provincePath}" fill="none" stroke="#8a6a3c" stroke-width="2.2" stroke-dasharray="10 5 2 5" opacity="0.75"/>
    </g>
    ${nameMarks()}
    ${compass()}
    <g opacity="0.72" fill="#5d4526">
      <text x="64" y="64" font-size="34" letter-spacing="6">河南</text>
      <text x="170" y="62" font-size="17" letter-spacing="5" opacity="0.85">大河中原</text>
      <path d="M62,76 H300" stroke="#5d4526" stroke-width="1.2"/><path d="M62,80 H300" stroke="#5d4526" stroke-width="0.5"/>
    </g>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#edge)"/>
    <rect x="9" y="9" width="${WIDTH - 18}" height="${HEIGHT - 18}" fill="none" stroke="#7a6038" stroke-width="1.4" opacity="0.5"/>
  </g>
</svg>`;
}

/** The routes, stations and name boxes of the map, drawn over the sheet for a look by eye. */
async function boardOverlay() {
  const data = await import(path.join(rootDir, "packages/game-data/dist/index.js"));
  const map = data.getHudsonHustleMapByConfigId("henan");
  let overlay = "";
  for (const route of map.routes) {
    for (const space of data.routeSpaces(route, map)) {
      overlay += `<polyline points="${space.points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="#3a2f22" stroke-width="13" stroke-linecap="round" opacity="0.8"/>`;
    }
  }
  for (const city of map.cities) {
    const box = data.labelBox(city);
    overlay += `<circle cx="${city.x}" cy="${city.y}" r="12" fill="#f8f5ef" stroke="#453221" stroke-width="3"/>`;
    overlay += `<rect x="${box.left}" y="${box.top}" width="${box.right - box.left}" height="${box.bottom - box.top}" fill="#fff8ec" opacity="0.8"/>`;
    overlay += `<text x="${(box.left + box.right) / 2}" y="${box.bottom - 5}" text-anchor="middle" font-size="17" font-weight="700" font-family="'Songti SC',serif">${city.label ?? city.name}</text>`;
  }
  return overlay;
}

async function main() {
  const previewIndex = process.argv.indexOf("--preview");
  let svg = basemapSvg();
  if (previewIndex !== -1) {
    svg = svg.replace(/<\/svg>$/, `${await boardOverlay()}</svg>`);
  }
  const require = createRequire(path.join(rootDir, "apps/web/package.json"));
  const { chromium } = require("@playwright/test");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH * SCALE, height: HEIGHT * SCALE } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await browser.close();

  if (previewIndex !== -1) {
    writeFileSync(process.argv[previewIndex + 1], png);
    return;
  }
  const pngPath = path.join(mkdtempSync(path.join(os.tmpdir(), "henan-basemap-")), "sheet.png");
  writeFileSync(pngPath, png);
  execFileSync("cwebp", ["-quiet", "-q", "78", "-m", "6", pngPath, "-o", outPath]);
  console.log(`wrote ${path.relative(rootDir, outPath)} (${Math.round(readFileSync(outPath).length / 1024)} KB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
