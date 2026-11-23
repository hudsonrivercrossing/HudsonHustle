// The Henan map, written once as tables and turned into the snapshot's map.json and tickets.json.
//   node scripts/config/henan-map-source.mjs
// Stations carry their real latitude and longitude for reference. Their board positions follow the
// same relative layout, stretched east to west and nudged by hand so names and routes do not collide.
// The basemap (henan-basemap.mjs) is drawn around these board positions, so a station moved across
// the Yellow River here needs the river moved there.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(rootDir, "configs/hudson-hustle/releases/henan");

export const board = { width: 1200, height: 900, padX: 90, padY: 90 };

// id, name, tier, lat, lon, board x/y, label dx/dy/anchor
const S = (id, name, tier, lat, lon, x, y, dx, dy, anchor) => ({ id, name, tier, lat, lon, x, y, dx, dy, anchor });
export const stations = [
  S("zhengzhou", "郑州", "anchor", 34.75, 113.65, 650, 345, -40, -14, "end"),
  S("kaifeng", "开封", "first-ring", 34.8, 114.31, 815, 350, 6, 32, "middle"),
  S("luoyang", "洛阳", "anchor", 34.62, 112.45, 360, 385, -4, -22, "end"),
  S("sanmenxia", "三门峡", "anchor", 34.77, 111.2, 95, 360, -8, -22, "start"),
  S("shangqiu", "商丘", "anchor", 34.41, 115.66, 1125, 420, -6, -22, "middle"),
  S("lankao", "兰考", "other", 34.82, 114.82, 955, 340, 0, 34, "middle"),
  S("anyang", "安阳", "anchor", 36.1, 114.39, 930, 52, 18, 6, "start"),
  S("hebi", "鹤壁", "first-ring", 35.75, 114.3, 845, 135, 18, 8, "start"),
  S("xinxiang", "新乡", "first-ring", 35.3, 113.93, 745, 215, 18, 22, "start"),
  S("jiaozuo", "焦作", "first-ring", 35.22, 113.24, 525, 215, -16, -12, "end"),
  S("jiyuan", "济源", "first-ring", 35.07, 112.6, 385, 260, -16, -12, "end"),
  S("puyang", "濮阳", "first-ring", 35.76, 115.03, 1070, 150, 18, 6, "start"),
  S("yuntai-mountain", "云台山", "other", 35.43, 113.38, 610, 135, 0, -20, "middle"),
  S("red-flag-canal", "红旗渠", "other", 36.08, 113.82, 705, 70, -16, 6, "end"),
  S("shaolin-temple", "少林寺", "other", 34.51, 112.94, 515, 432, 0, 34, "middle"),
  S("xuchang", "许昌", "first-ring", 34.04, 113.85, 692, 480, 18, 8, "start"),
  S("pingdingshan", "平顶山", "first-ring", 33.77, 113.19, 540, 560, -16, 6, "end"),
  S("luohe", "漯河", "first-ring", 33.58, 114.02, 765, 590, -16, 26, "end"),
  S("zhoukou", "周口", "first-ring", 33.63, 114.65, 930, 560, 18, 6, "start"),
  S("zhumadian", "驻马店", "first-ring", 33.01, 114.02, 800, 712, 18, 6, "start"),
  S("nanyang", "南阳", "anchor", 33.0, 112.53, 395, 680, 0, 34, "middle"),
  S("xixia", "西峡", "other", 33.3, 111.48, 160, 645, 0, 34, "middle"),
  S("laojun-mountain", "老君山", "other", 33.75, 111.6, 205, 515, -16, 6, "end"),
  S("xinyang", "信阳", "anchor", 32.15, 114.09, 760, 830, 14, 30, "start"),
  S("jigong-mountain", "鸡公山", "other", 31.8, 114.07, 640, 870, -16, 6, "end")
];

// from, to, length, colour, type, options: { twin, bend, via, loco }
// `bend` bows the route sideways by that many board units (positive is to the left of travel);
// `via` gives exact waypoints instead.
const R = (from, to, length, color, type = "normal", options = {}) => ({ from, to, length, color, type, ...options });
export const routes = [
  // The 米 spokes out of Zhengzhou
  R("zhengzhou", "kaifeng", 2, "amber", "normal", { twin: "zhengzhou-kaifeng", bend: 16, suffix: "a" }),
  R("zhengzhou", "kaifeng", 2, "cobalt", "normal", { twin: "zhengzhou-kaifeng", bend: -16, suffix: "b" }),
  R("zhengzhou", "xuchang", 2, "crimson", "normal", { twin: "zhengzhou-xuchang", bend: 14, suffix: "a" }),
  R("zhengzhou", "xuchang", 2, "ivory", "normal", { twin: "zhengzhou-xuchang", bend: -14, suffix: "b" }),
  R("zhengzhou", "xinxiang", 2, "emerald", "ferry", { twin: "zhengzhou-xinxiang", bend: 13, suffix: "a", loco: 1 }),
  R("zhengzhou", "xinxiang", 2, "violet", "ferry", { twin: "zhengzhou-xinxiang", bend: -13, suffix: "b", loco: 1 }),
  R("zhengzhou", "luoyang", 4, "obsidian"),
  R("zhengzhou", "shaolin-temple", 3, "gray"),
  R("shaolin-temple", "luoyang", 2, "gray", "tunnel"),
  R("zhengzhou", "jiaozuo", 3, "rose", "ferry", { loco: 1 }),
  R("zhengzhou", "zhoukou", 5, "emerald"),
  R("zhengzhou", "pingdingshan", 4, "violet"),
  // West
  R("luoyang", "sanmenxia", 4, "amber", "tunnel", { twin: "luoyang-sanmenxia", bend: 20, suffix: "a" }),
  R("luoyang", "sanmenxia", 4, "emerald", "normal", { twin: "luoyang-sanmenxia", bend: -20, suffix: "b" }),
  R("luoyang", "jiyuan", 2, "cobalt", "ferry", { loco: 1 }),
  R("luoyang", "pingdingshan", 3, "crimson"),
  R("luoyang", "laojun-mountain", 3, "gray", "tunnel"),
  R("sanmenxia", "laojun-mountain", 3, "gray", "tunnel"),
  R("laojun-mountain", "xixia", 2, "gray", "tunnel"),
  R("xixia", "nanyang", 4, "rose"),
  // South
  R("pingdingshan", "nanyang", 3, "ivory"),
  R("nanyang", "xinyang", 5, "obsidian", "tunnel"),
  R("xinyang", "jigong-mountain", 2, "gray", "tunnel"),
  R("xinyang", "zhumadian", 2, "cobalt"),
  R("zhumadian", "luohe", 2, "violet", "normal", { twin: "zhumadian-luohe", bend: 14, suffix: "a" }),
  R("zhumadian", "luohe", 2, "rose", "normal", { twin: "zhumadian-luohe", bend: -14, suffix: "b" }),
  R("luohe", "xuchang", 2, "obsidian"),
  R("luohe", "pingdingshan", 3, "amber"),
  R("luohe", "zhoukou", 2, "crimson"),
  R("xuchang", "pingdingshan", 3, "cobalt"),
  // East
  R("zhoukou", "shangqiu", 4, "ivory"),
  R("shangqiu", "lankao", 3, "rose"),
  R("lankao", "kaifeng", 2, "obsidian"),
  R("lankao", "puyang", 4, "crimson", "ferry", { loco: 1 }),
  // North of the river
  R("puyang", "anyang", 3, "ivory"),
  R("xinxiang", "puyang", 5, "emerald"),
  R("anyang", "hebi", 2, "cobalt", "normal", { bend: -12 }),
  R("hebi", "xinxiang", 2, "amber"),
  R("anyang", "red-flag-canal", 3, "gray", "tunnel"),
  R("red-flag-canal", "hebi", 2, "violet", "tunnel"),
  R("xinxiang", "yuntai-mountain", 2, "obsidian"),
  R("yuntai-mountain", "jiaozuo", 2, "ivory"),
  R("jiaozuo", "jiyuan", 2, "crimson")
];

const stationById = new Map(stations.map((station) => [station.id, station]));

function waypointsFor(route) {
  if (route.via) return route.via;
  if (!route.bend) return [];
  const a = stationById.get(route.from);
  const b = stationById.get(route.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const nx = dy / length;
  const ny = -dx / length;
  return [0.25, 0.5, 0.75].map((t) => {
    const lift = route.bend * (1 - (2 * t - 1) ** 2 * 0.55);
    return { x: Math.round(a.x + dx * t + nx * lift), y: Math.round(a.y + dy * t + ny * lift) };
  });
}

export function buildMap() {
  return {
    schemaVersion: 1,
    mapId: "henan-v1",
    name: "河南 · 大河中原",
    board,
    typeLabelOverrides: { ferry: "黄河大桥", tunnel: "山岭隧道" },
    stations: stations.map((station) => ({
      id: station.id,
      name: station.name,
      label: station.name,
      active: true,
      tier: station.tier,
      lat: station.lat,
      lon: station.lon,
      boardX: station.x,
      boardY: station.y,
      labelDx: station.dx,
      labelDy: station.dy,
      labelAnchor: station.anchor
    })),
    routes: routes.map((route) => ({
      id: `${route.from}-${route.to}${route.suffix ? `-${route.suffix}` : ""}`,
      from: route.from,
      to: route.to,
      length: route.length,
      color: route.color,
      type: route.type,
      ...(route.loco !== undefined ? { locomotiveCost: route.loco } : {}),
      ...(route.twin ? { twinGroup: route.twin } : {}),
      waypoints: waypointsFor(route)
    }))
  };
}

// A ticket is worth the fewest spaces that connect its two stations, so the deck follows the board
// whenever a route length changes. No ticket joins two stations that share a route.
const T = (from, to) => ({ from, to });
export const longTickets = [
  T("sanmenxia", "shangqiu"),
  T("anyang", "xinyang"),
  T("puyang", "nanyang"),
  T("sanmenxia", "xinyang"),
  T("shangqiu", "nanyang"),
  T("anyang", "sanmenxia")
];
export const regularTickets = [
  T("zhengzhou", "anyang"),
  T("zhengzhou", "xinyang"),
  T("zhengzhou", "nanyang"),
  T("zhengzhou", "shangqiu"),
  T("zhengzhou", "sanmenxia"),
  T("luoyang", "kaifeng"),
  T("luoyang", "xinxiang"),
  T("kaifeng", "puyang"),
  T("kaifeng", "zhoukou"),
  T("xinxiang", "shangqiu"),
  T("jiaozuo", "pingdingshan"),
  T("jiyuan", "zhengzhou"),
  T("anyang", "kaifeng"),
  T("hebi", "jiaozuo"),
  T("puyang", "xuchang"),
  T("xuchang", "shangqiu"),
  T("pingdingshan", "xinyang"),
  T("luohe", "shangqiu"),
  T("zhumadian", "nanyang"),
  T("zhoukou", "xinyang"),
  T("sanmenxia", "pingdingshan"),
  T("sanmenxia", "jiyuan"),
  T("shaolin-temple", "kaifeng"),
  T("yuntai-mountain", "anyang"),
  T("red-flag-canal", "xinxiang"),
  T("laojun-mountain", "zhengzhou"),
  T("laojun-mountain", "nanyang"),
  T("xixia", "pingdingshan"),
  T("jigong-mountain", "luohe"),
  T("lankao", "xinxiang"),
  T("luoyang", "shangqiu"),
  T("xinxiang", "nanyang"),
  T("kaifeng", "xinyang"),
  T("jiyuan", "xuchang"),
  T("jiaozuo", "zhoukou"),
  T("hebi", "luoyang"),
  T("luohe", "puyang"),
  T("red-flag-canal", "zhengzhou"),
  T("shaolin-temple", "xinyang"),
  T("yuntai-mountain", "kaifeng"),
  T("jigong-mountain", "zhengzhou"),
  T("xixia", "luoyang"),
  T("zhumadian", "kaifeng"),
  T("zhoukou", "luoyang")
];

/** The fewest spaces, and the fewest routes, between every two stations. */
function shortestPaths() {
  const ids = stations.map((station) => station.id);
  const spaces = Object.fromEntries(ids.map((a) => [a, Object.fromEntries(ids.map((b) => [b, a === b ? 0 : Infinity]))]));
  const hops = structuredClone(spaces);
  for (const route of routes) {
    spaces[route.from][route.to] = spaces[route.to][route.from] = Math.min(spaces[route.from][route.to], route.length);
    hops[route.from][route.to] = hops[route.to][route.from] = 1;
  }
  for (const table of [spaces, hops]) {
    for (const k of ids) for (const a of ids) for (const b of ids) table[a][b] = Math.min(table[a][b], table[a][k] + table[k][b]);
  }
  return { spaces, hops };
}

export function buildTickets() {
  const { spaces, hops } = shortestPaths();
  const build = (ticket) => {
    if (hops[ticket.from][ticket.to] < 2) {
      throw new Error(`ticket ${ticket.from}-${ticket.to} joins two stations that share a route`);
    }
    return { id: `t-${ticket.from}-${ticket.to}`, from: ticket.from, to: ticket.to, points: spaces[ticket.from][ticket.to], notes: [] };
  };
  return { schemaVersion: 1, ticketSetId: "henan-v1-tickets", long: longTickets.map(build), regular: regularTickets.map(build) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const map = buildMap();
  const tickets = buildTickets();
  writeFileSync(path.join(outDir, "map.json"), `${JSON.stringify(map, null, 2)}\n`);
  writeFileSync(path.join(outDir, "tickets.json"), `${JSON.stringify(tickets, null, 2)}\n`);
  console.log(`wrote ${path.relative(rootDir, outDir)}: ${map.stations.length} stations, ${map.routes.length} routes, ${tickets.long.length + tickets.regular.length} tickets`);
}
