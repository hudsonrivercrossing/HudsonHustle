import type { MapConfig } from "@hudson-hustle/game-core";
import { projectGeoDiagramCities } from "./cartography";
import type { BoardPoint, GeoDiagramCitySeed } from "./cartography";

export interface BoardBackdropArea {
  id: string;
  points: BoardPoint[];
  opacity?: number;
}

export interface BoardBackdropLine {
  id: string;
  points: BoardPoint[];
}

export interface BoardBackdropLabel {
  id: string;
  text: string;
  point: BoardPoint;
  vertical?: boolean;
}

export interface BoardBackdrop {
  landAreas: BoardBackdropArea[];
  waterAreas: BoardBackdropArea[];
  shorelines: BoardBackdropLine[];
  regionLabels: BoardBackdropLabel[];
}

export interface StationAuthorityRef {
  source:
    | "mta-subway-complexes"
    | "mta-lirr-gtfs"
    | "panynj-path-official"
    | "nj-transit-official"
    | "nj-transit-hblr-map"
    | "station-proxy";
  reference: string;
  sourceUrl?: string;
  notes?: string;
}

export const hudsonHustleBoardFrame = {
  width: 1200,
  height: 900,
  padX: 90,
  padY: 90
} as const;

export const hudsonHustleAnchorWaveCityIds = [
  "newark-penn",
  "secaucus",
  "exchange-place",
  "midtown-west",
  "grand-central",
  "world-trade",
  "long-island-city",
  "jamaica",
  "downtown-brooklyn"
] as const;

export const hudsonHustleFirstRingCityIds = [
  "hoboken",
  "union-square",
  "lower-manhattan",
  "chelsea",
  "queensboro",
  "court-square",
  "williamsburg",
  "atlantic-terminal"
] as const;

function pt(x: number, y: number): BoardPoint {
  return { x, y };
}

type LabelPresetName =
  | "top-near"
  | "bottom-near"
  | "left-near"
  | "right-near"
  | "top-left-near"
  | "top-right-near"
  | "bottom-left-near"
  | "bottom-right-near";

const labelPresets: Record<
  LabelPresetName,
  Pick<GeoDiagramCitySeed, "labelDx" | "labelDy" | "labelAnchor">
> = {
  "top-near": { labelDx: 0, labelDy: -16, labelAnchor: "middle" },
  "bottom-near": { labelDx: 0, labelDy: 24, labelAnchor: "middle" },
  "left-near": { labelDx: -14, labelDy: 4, labelAnchor: "end" },
  "right-near": { labelDx: 14, labelDy: 4, labelAnchor: "start" },
  "top-left-near": { labelDx: -12, labelDy: -16, labelAnchor: "end" },
  "top-right-near": { labelDx: 12, labelDy: -16, labelAnchor: "start" },
  "bottom-left-near": { labelDx: -14, labelDy: 24, labelAnchor: "end" },
  "bottom-right-near": { labelDx: 14, labelDy: 24, labelAnchor: "start" }
};

function labelPreset(
  name: LabelPresetName,
  overrides: Partial<Pick<GeoDiagramCitySeed, "labelDx" | "labelDy" | "labelAnchor">> = {}
) {
  return {
    ...labelPresets[name],
    ...overrides
  };
}

const hudsonHustleActiveCityIdSet = new Set<string>([
  ...hudsonHustleAnchorWaveCityIds,
  "hoboken",
  "chelsea",
  "williamsburg",
  "atlantic-terminal"
]);

// Authority-backed geography stays attached to each hub, but the shipped board
// coordinates are laid out for gameplay readability first.
export const hudsonHustleStationReferences: Record<string, StationAuthorityRef> = {
  secaucus: {
    source: "nj-transit-official",
    reference: "Secaucus Junction",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map/station inventory."
  },
  hoboken: {
    source: "nj-transit-hblr-map",
    reference: "Hoboken Terminal",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Backed by the official HBLR system map, which also shows PATH and ferry connections at Hoboken Terminal."
  },
  "journal-square": {
    source: "nj-transit-hblr-map",
    reference: "Journal Square Transportation Center",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Backed by the official HBLR system map, which includes the PATH layout used for west-side corridor ordering."
  },
  "jersey-city": {
    source: "nj-transit-hblr-map",
    reference: "Harborside / Jersey City waterfront",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Still a generalized board node, but now explicitly tied to the official HBLR waterfront corridor rather than a freehand proxy."
  },
  newport: {
    source: "nj-transit-hblr-map",
    reference: "Newport",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Backed by the official HBLR system map and PATH layout."
  },
  "exchange-place": {
    source: "nj-transit-hblr-map",
    reference: "Exchange Place",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Backed by the official HBLR system map and PATH layout."
  },
  "newark-penn": {
    source: "nj-transit-official",
    reference: "Newark Penn Station",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map and used as the west-side intercity anchor."
  },
  "newark-airport": {
    source: "nj-transit-official",
    reference: "Newark Liberty International Airport Station",
    sourceUrl: "https://www.njtransit.com/airport",
    notes: "Backed by NJ TRANSIT's airport rail page."
  },
  elizabeth: {
    source: "nj-transit-official",
    reference: "Elizabeth Station",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map."
  },
  rahway: {
    source: "nj-transit-official",
    reference: "Rahway Station",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map."
  },
  metropark: {
    source: "nj-transit-official",
    reference: "Metropark Station",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map."
  },
  edison: {
    source: "nj-transit-official",
    reference: "Edison Station",
    sourceUrl: "https://www.njtransit.com/accessibility/System-Map",
    notes: "Normalized to the official NJ TRANSIT rail system map."
  },
  "world-trade": {
    source: "panynj-path-official",
    reference: "World Trade Center PATH / Oculus",
    sourceUrl: "https://wtcstage.panynj.gov/en/local/plan-your-visit/getting-here.html",
    notes: "Normalized to the official Port Authority World Trade Center transit reference."
  },
  "lower-manhattan": { source: "mta-subway-complexes", reference: "Fulton St" },
  chelsea: { source: "mta-subway-complexes", reference: "23 St (C,E)", notes: "Used as the west-Chelsea proxy node." },
  "midtown-west": { source: "mta-lirr-gtfs", reference: "Penn Station" },
  "grand-central": { source: "mta-lirr-gtfs", reference: "Grand Central" },
  "union-square": { source: "mta-subway-complexes", reference: "14 St-Union Sq" },
  greenpoint: { source: "mta-subway-complexes", reference: "Nassau Av", notes: "Used as the Greenpoint proxy node." },
  queensboro: { source: "mta-subway-complexes", reference: "Queens Plaza" },
  astoria: { source: "mta-subway-complexes", reference: "Astoria-Ditmars Blvd" },
  "long-island-city": { source: "mta-lirr-gtfs", reference: "Long Island City" },
  "court-square": { source: "mta-subway-complexes", reference: "Court Sq-23 St" },
  "jackson-heights": { source: "mta-subway-complexes", reference: "Jackson Hts-Roosevelt Av/74 St-Broadway" },
  flushing: { source: "mta-subway-complexes", reference: "Flushing-Main St" },
  jamaica: { source: "mta-lirr-gtfs", reference: "Jamaica" },
  williamsburg: { source: "mta-subway-complexes", reference: "Bedford Av", notes: "Used as the Williamsburg proxy node." },
  "downtown-brooklyn": { source: "mta-subway-complexes", reference: "Jay St-MetroTech" },
  "atlantic-terminal": { source: "mta-lirr-gtfs", reference: "Atlantic Terminal" },
  "sunset-park": { source: "station-proxy", reference: "36 St (Sunset Park)", notes: "Generalized south-Brooklyn node; board placement remains intentionally distorted for readability." },
  "coney-island": { source: "mta-subway-complexes", reference: "Coney Island-Stillwell Av" }
};

const hudsonHustleAllGeoCities: GeoDiagramCitySeed[] = [
  { id: "secaucus", name: "Secaucus", lat: 40.789, lon: -74.0635, boardX: 258, boardY: 118, ...labelPreset("top-left-near", { labelDx: -8, labelDy: -18 }) },
  { id: "hoboken", name: "Hoboken", lat: 40.7359, lon: -74.0303, boardX: 318, boardY: 220, ...labelPreset("right-near", { labelDx: 14, labelDy: 6 }) },
  { id: "journal-square", name: "Journal Sq", lat: 40.733, lon: -74.0627, boardX: 168, boardY: 320, ...labelPreset("left-near", { labelDy: -4 }) },
  { id: "jersey-city", name: "Jersey City", lat: 40.728, lon: -74.047, boardX: 206, boardY: 420, ...labelPreset("bottom-right-near") },
  { id: "newport", name: "Newport", lat: 40.7269, lon: -74.0338, boardX: 330, boardY: 292, ...labelPreset("top-right-near") },
  { id: "exchange-place", name: "Exchange Place", lat: 40.7168, lon: -74.0345, boardX: 382, boardY: 300, ...labelPreset("left-near", { labelDx: -16, labelDy: 6 }) },
  { id: "newark-penn", name: "Newark Penn", lat: 40.7347, lon: -74.1645, boardX: 94, boardY: 538, ...labelPreset("right-near", { labelDx: 16, labelDy: 6 }) },
  { id: "newark-airport", name: "Newark Airport", label: "Airport", lat: 40.6895, lon: -74.1745, boardX: 118, boardY: 548, ...labelPreset("bottom-left-near") },
  { id: "elizabeth", name: "Elizabeth", lat: 40.667, lon: -74.2152, boardX: 134, boardY: 658, ...labelPreset("bottom-left-near") },
  { id: "rahway", name: "Rahway", lat: 40.615, lon: -74.2753, boardX: 184, boardY: 770, ...labelPreset("bottom-left-near") },
  { id: "metropark", name: "Metropark", lat: 40.5682, lon: -74.3298, boardX: 252, boardY: 846, ...labelPreset("bottom-left-near") },
  { id: "edison", name: "Edison", lat: 40.5193, lon: -74.4103, boardX: 330, boardY: 892, ...labelPreset("top-left-near") },
  { id: "world-trade", name: "World Trade", lat: 40.712603, lon: -74.0095515, boardX: 532, boardY: 430, ...labelPreset("left-near", { labelDx: -20, labelDy: 6 }) },
  { id: "lower-manhattan", name: "Lower Manhattan", lat: 40.71008875, lon: -74.00783825, boardX: 514, boardY: 604, ...labelPreset("bottom-left-near") },
  { id: "chelsea", name: "Chelsea", lat: 40.745906, lon: -73.998041, boardX: 510, boardY: 334, ...labelPreset("top-left-near", { labelDx: -10 }) },
  { id: "midtown-west", name: "Penn District", lat: 40.75058844, lon: -73.99358408, boardX: 544, boardY: 226, ...labelPreset("top-near") },
  { id: "grand-central", name: "Grand Central", lat: 40.755162, lon: -73.975455, boardX: 718, boardY: 176, ...labelPreset("top-right-near") },
  { id: "union-square", name: "Union Square", lat: 40.735066, lon: -73.99041633, boardX: 608, boardY: 516, ...labelPreset("bottom-near", { labelDy: 30 }) },
  { id: "greenpoint", name: "Greenpoint", lat: 40.724635, lon: -73.951277, boardX: 888, boardY: 336, ...labelPreset("top-right-near") },
  { id: "queensboro", name: "Queens Plaza", lat: 40.748973, lon: -73.937243, boardX: 860, boardY: 246, ...labelPreset("top-right-near", { labelDx: 10 }) },
  { id: "astoria", name: "Astoria", lat: 40.775036, lon: -73.912034, boardX: 980, boardY: 166, ...labelPreset("top-right-near", { labelDx: 10 }) },
  { id: "long-island-city", name: "Long Island City", label: "Long Isl. City", lat: 40.74134343, lon: -73.95763922, boardX: 850, boardY: 404, ...labelPreset("top-left-near", { labelDx: -14, labelDy: -14 }) },
  { id: "court-square", name: "Court Square", lat: 40.747141, lon: -73.945032, boardX: 974, boardY: 408, ...labelPreset("bottom-right-near", { labelDx: 12 }) },
  { id: "jackson-heights", name: "Jackson Heights", label: "Jackson Hts", lat: 40.746746, lon: -73.891366, boardX: 1064, boardY: 252, ...labelPreset("top-left-near", { labelDx: -8 }) },
  { id: "flushing", name: "Flushing", lat: 40.7596, lon: -73.83003, boardX: 1138, boardY: 244, ...labelPreset("top-left-near") },
  { id: "jamaica", name: "Jamaica", lat: 40.69960817, lon: -73.80852987, boardX: 1116, boardY: 556, ...labelPreset("bottom-near") },
  { id: "williamsburg", name: "Williamsburg", lat: 40.717304, lon: -73.956872, boardX: 920, boardY: 586, ...labelPreset("right-near", { labelDx: 18 }) },
  { id: "downtown-brooklyn", name: "Downtown Brooklyn", label: "Downtown Bklyn", lat: 40.692259, lon: -73.986642, boardX: 856, boardY: 752, ...labelPreset("top-right-near", { labelDx: 16, labelDy: -12 }) },
  { id: "atlantic-terminal", name: "Atlantic Terminal", label: "Atlantic Term", lat: 40.68359596, lon: -73.97567112, boardX: 936, boardY: 796, ...labelPreset("bottom-right-near") },
  { id: "sunset-park", name: "Sunset Park", lat: 40.6453, lon: -74.0128, boardX: 652, boardY: 806, ...labelPreset("bottom-left-near", { labelDy: 28 }) },
  { id: "coney-island", name: "Coney Island", lat: 40.577422, lon: -73.981233, boardX: 900, boardY: 878, ...labelPreset("top-left-near") }
];

export const hudsonHustleGeoCities: GeoDiagramCitySeed[] = hudsonHustleAllGeoCities.filter((city) =>
  hudsonHustleActiveCityIdSet.has(city.id)
);

const { cities: hudsonHustleCities, bounds: hudsonHustleGeoBounds } = projectGeoDiagramCities(
  hudsonHustleGeoCities,
  hudsonHustleBoardFrame
);

export { hudsonHustleGeoBounds };

export const hudsonHustleBackdrop: BoardBackdrop = {
  landAreas: [
    {
      id: "manhattan-island",
      opacity: 0.74,
      points: [
        pt(502, 98),
        pt(546, 106),
        pt(612, 142),
        pt(670, 202),
        pt(686, 284),
        pt(674, 382),
        pt(654, 488),
        pt(636, 590),
        pt(618, 706),
        pt(598, 818),
        pt(560, 844),
        pt(520, 816),
        pt(508, 722),
        pt(502, 612),
        pt(494, 500),
        pt(486, 388),
        pt(486, 272),
        pt(492, 180)
      ]
    }
  ],
  waterAreas: [
    {
      id: "hudson-river",
      opacity: 0.9,
      points: [
        pt(332, 70),
        pt(424, 84),
        pt(476, 176),
        pt(488, 306),
        pt(486, 448),
        pt(494, 654),
        pt(504, 834),
        pt(452, 862),
        pt(378, 844),
        pt(362, 664),
        pt(354, 470),
        pt(342, 300)
      ]
    },
    {
      id: "east-river",
      opacity: 0.84,
      points: [
        pt(694, 106),
        pt(812, 118),
        pt(792, 232),
        pt(764, 334),
        pt(748, 470),
        pt(742, 618),
        pt(736, 860),
        pt(680, 860),
        pt(688, 626),
        pt(700, 470),
        pt(708, 334),
        pt(714, 226)
      ]
    },
    {
      id: "upper-bay",
      opacity: 0.88,
      points: [
        pt(428, 570),
        pt(520, 558),
        pt(626, 574),
        pt(728, 650),
        pt(736, 744),
        pt(690, 816),
        pt(570, 838),
        pt(466, 812),
        pt(424, 724),
        pt(422, 622)
      ]
    }
  ],
  shorelines: [
    {
      id: "new-jersey-edge",
      points: [pt(330, 82), pt(308, 162), pt(294, 250), pt(278, 346), pt(248, 476), pt(214, 660), pt(204, 820)]
    },
    {
      id: "manhattan-west-edge",
      points: [pt(494, 112), pt(490, 204), pt(486, 306), pt(486, 400), pt(492, 500), pt(500, 618), pt(508, 806)]
    },
    {
      id: "manhattan-east-edge",
      points: [pt(676, 204), pt(666, 292), pt(654, 402), pt(644, 500), pt(632, 610), pt(618, 744), pt(598, 822)]
    },
    {
      id: "queens-brooklyn-edge",
      points: [pt(812, 126), pt(786, 224), pt(762, 336), pt(750, 476), pt(746, 620), pt(742, 820)]
    }
  ],
  regionLabels: [
    { id: "new-jersey", text: "New Jersey", point: pt(252, 140) },
    { id: "manhattan", text: "Manhattan", point: pt(596, 320), vertical: true },
    { id: "queens", text: "Queens", point: pt(920, 126) },
    { id: "brooklyn", text: "Brooklyn", point: pt(838, 722) }
  ]
};

export const hudsonHustleMap: MapConfig = {
  id: "hudson-hustle-anchor-prototype",
  name: "Hudson Hustle Anchor Prototype",
  settings: {
    trainsPerPlayer: 24,
    stationsPerPlayer: 3,
    longestRouteBonus: 10,
    stationValue: 4
  },
  cities: hudsonHustleCities,
  routes: [
    { id: "secaucus-newark-penn", from: "secaucus", to: "newark-penn", length: 2, color: "gray", type: "normal" },
    { id: "secaucus-hoboken", from: "secaucus", to: "hoboken", length: 2, color: "gray", type: "normal" },
    {
      id: "secaucus-midtown-west-a",
      from: "secaucus",
      to: "midtown-west",
      length: 3,
      color: "gray",
      type: "tunnel",
      twinGroup: "secaucus-midtown",
      waypoints: [pt(334, 132), pt(477, 186)]
    },
    {
      id: "secaucus-midtown-west-b",
      from: "secaucus",
      to: "midtown-west",
      length: 3,
      color: "cobalt",
      type: "tunnel",
      twinGroup: "secaucus-midtown",
      waypoints: [pt(320, 168), pt(463, 222)]
    },
    {
      id: "newark-penn-exchange-place",
      from: "newark-penn",
      to: "exchange-place",
      length: 3,
      color: "obsidian",
      type: "normal",
      waypoints: [pt(208, 468), pt(304, 386)]
    },
    {
      id: "exchange-place-world-trade-a",
      from: "exchange-place",
      to: "world-trade",
      length: 2,
      color: "gray",
      type: "tunnel",
      twinGroup: "exchange-world",
      waypoints: [pt(436, 328), pt(496, 380)]
    },
    {
      id: "exchange-place-world-trade-b",
      from: "exchange-place",
      to: "world-trade",
      length: 2,
      color: "rose",
      type: "tunnel",
      twinGroup: "exchange-world",
      waypoints: [pt(418, 350), pt(478, 402)]
    },
    {
      id: "newark-penn-world-trade",
      from: "newark-penn",
      to: "world-trade",
      length: 4,
      color: "obsidian",
      type: "tunnel",
      waypoints: [pt(214, 560), pt(384, 524)]
    },
    {
      id: "hoboken-chelsea",
      from: "hoboken",
      to: "chelsea",
      length: 3,
      color: "gray",
      type: "normal",
      waypoints: [pt(396, 238)]
    },
    { id: "midtown-west-chelsea", from: "midtown-west", to: "chelsea", length: 2, color: "amber", type: "normal" },
    { id: "chelsea-world-trade", from: "chelsea", to: "world-trade", length: 2, color: "gray", type: "normal" },
    { id: "long-island-city-williamsburg", from: "long-island-city", to: "williamsburg", length: 2, color: "emerald", type: "normal" },
    {
      id: "world-trade-downtown-brooklyn",
      from: "world-trade",
      to: "downtown-brooklyn",
      length: 3,
      color: "gray",
      type: "tunnel",
      waypoints: [pt(650, 546), pt(758, 650)]
    },
    { id: "williamsburg-downtown-brooklyn", from: "williamsburg", to: "downtown-brooklyn", length: 2, color: "gray", type: "normal" },
    { id: "downtown-brooklyn-atlantic-terminal", from: "downtown-brooklyn", to: "atlantic-terminal", length: 2, color: "rose", type: "normal" },
    { id: "midtown-west-grand-central", from: "midtown-west", to: "grand-central", length: 2, color: "gray", type: "normal" },
    {
      id: "midtown-west-long-island-city",
      from: "midtown-west",
      to: "long-island-city",
      length: 3,
      color: "gray",
      type: "tunnel",
      waypoints: [pt(682, 296), pt(782, 350)]
    },
    {
      id: "grand-central-long-island-city",
      from: "grand-central",
      to: "long-island-city",
      length: 3,
      color: "ivory",
      type: "normal",
      waypoints: [pt(788, 266)]
    },
    {
      id: "grand-central-jamaica",
      from: "grand-central",
      to: "jamaica",
      length: 4,
      color: "gray",
      type: "normal",
      waypoints: [pt(868, 220), pt(1024, 336)]
    },
    {
      id: "long-island-city-jamaica",
      from: "long-island-city",
      to: "jamaica",
      length: 3,
      color: "cobalt",
      type: "normal",
      waypoints: [pt(972, 452), pt(1040, 500)]
    },
    { id: "long-island-city-downtown-brooklyn", from: "long-island-city", to: "downtown-brooklyn", length: 3, color: "gray", type: "ferry", locomotiveCost: 1 },
    {
      id: "atlantic-terminal-jamaica",
      from: "atlantic-terminal",
      to: "jamaica",
      length: 2,
      color: "gray",
      type: "normal",
      waypoints: [pt(1018, 706)]
    }
  ],
  tickets: [
    { id: "t-newark-jamaica", from: "newark-penn", to: "jamaica", points: 15, bucket: "long" },
    { id: "t-secaucus-downtown-brooklyn", from: "secaucus", to: "downtown-brooklyn", points: 14, bucket: "long" },
    { id: "t-exchange-jamaica", from: "exchange-place", to: "jamaica", points: 14, bucket: "long" },
    { id: "t-newark-downtown-brooklyn", from: "newark-penn", to: "downtown-brooklyn", points: 13, bucket: "long" },
    { id: "t-secaucus-jamaica", from: "secaucus", to: "jamaica", points: 14, bucket: "long" },
    { id: "t-newark-penn-district", from: "newark-penn", to: "midtown-west", points: 8, bucket: "regular" },
    { id: "t-hoboken-chelsea", from: "hoboken", to: "chelsea", points: 6, bucket: "regular" },
    { id: "t-chelsea-world-trade", from: "chelsea", to: "world-trade", points: 5, bucket: "regular" },
    { id: "t-exchange-grand-central", from: "exchange-place", to: "grand-central", points: 8, bucket: "regular" },
    { id: "t-world-trade-long-island-city", from: "world-trade", to: "long-island-city", points: 8, bucket: "regular" },
    { id: "t-penn-district-long-island-city", from: "midtown-west", to: "long-island-city", points: 6, bucket: "regular" },
    { id: "t-grand-central-jamaica", from: "grand-central", to: "jamaica", points: 9, bucket: "regular" },
    { id: "t-world-trade-downtown-brooklyn", from: "world-trade", to: "downtown-brooklyn", points: 8, bucket: "regular" },
    { id: "t-long-island-city-jamaica", from: "long-island-city", to: "jamaica", points: 6, bucket: "regular" },
    { id: "t-long-island-city-downtown-brooklyn", from: "long-island-city", to: "downtown-brooklyn", points: 6, bucket: "regular" },
    { id: "t-world-trade-grand-central", from: "world-trade", to: "grand-central", points: 8, bucket: "regular" },
    { id: "t-exchange-place-downtown-brooklyn", from: "exchange-place", to: "downtown-brooklyn", points: 9, bucket: "regular" },
    { id: "t-secaucus-world-trade", from: "secaucus", to: "world-trade", points: 7, bucket: "regular" },
    { id: "t-newark-grand-central", from: "newark-penn", to: "grand-central", points: 10, bucket: "regular" },
    { id: "t-downtown-brooklyn-jamaica", from: "downtown-brooklyn", to: "jamaica", points: 8, bucket: "regular" },
    { id: "t-atlantic-terminal-jamaica", from: "atlantic-terminal", to: "jamaica", points: 5, bucket: "regular" }
  ]
};

export const cardColorPalette: Record<string, string> = {
  crimson: "#c95d72",
  amber: "#d6a436",
  emerald: "#2f988c",
  cobalt: "#4769d0",
  violet: "#8659c4",
  obsidian: "#39414f",
  ivory: "#efe2c7",
  rose: "#db82a5",
  locomotive: "#f5efe2"
};

export const playerColorPalette: Record<string, string> = {
  "harbor-blue": "#0f7b86",
  "signal-red": "#c44c2d",
  "path-green": "#2f8b57",
  "ferry-gold": "#b58b1f"
};

export { createGeoProjector, projectGeoDiagramCities } from "./cartography";
export type { BoardPoint, GeoDiagramCitySeed, GeoPoint, GeoProjectionBounds, GeoProjectionOptions, GeoProjectionResult } from "./cartography";
