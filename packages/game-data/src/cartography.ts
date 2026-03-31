import type { CityDef } from "@hudson-hustle/game-core";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface BoardPoint {
  x: number;
  y: number;
}

export interface GeoDiagramCitySeed extends Omit<CityDef, "x" | "y"> {
  lat: number;
  lon: number;
  boardX?: number;
  boardY?: number;
  diagramDx?: number;
  diagramDy?: number;
}

export interface GeoProjectionOptions {
  width?: number;
  height?: number;
  padX?: number;
  padY?: number;
}

export interface GeoProjectionBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  minProjectedX: number;
  maxProjectedX: number;
  minProjectedY: number;
  maxProjectedY: number;
}

export interface GeoProjectionResult {
  cities: CityDef[];
  bounds: GeoProjectionBounds;
}

export interface GeoProjector {
  projectPoint: (point: GeoPoint) => BoardPoint;
  projectPoints: (points: GeoPoint[]) => BoardPoint[];
  bounds: GeoProjectionBounds;
}

function projectLongitude(lon: number, avgLatRadians: number): number {
  return lon * Math.cos(avgLatRadians);
}

export function createGeoProjector(
  cities: GeoDiagramCitySeed[],
  options: GeoProjectionOptions = {}
): GeoProjector {
  const width = options.width ?? 1200;
  const height = options.height ?? 900;
  const padX = options.padX ?? 90;
  const padY = options.padY ?? 90;
  const avgLatRadians = (cities.reduce((sum, city) => sum + city.lat, 0) / cities.length) * (Math.PI / 180);

  const projected = cities.map((city) => ({
    projectedX: projectLongitude(city.lon, avgLatRadians),
    projectedY: city.lat
  }));

  const minProjectedX = Math.min(...projected.map((city) => city.projectedX));
  const maxProjectedX = Math.max(...projected.map((city) => city.projectedX));
  const minProjectedY = Math.min(...projected.map((city) => city.projectedY));
  const maxProjectedY = Math.max(...projected.map((city) => city.projectedY));

  const bounds: GeoProjectionBounds = {
    minLat: Math.min(...cities.map((city) => city.lat)),
    maxLat: Math.max(...cities.map((city) => city.lat)),
    minLon: Math.min(...cities.map((city) => city.lon)),
    maxLon: Math.max(...cities.map((city) => city.lon)),
    minProjectedX,
    maxProjectedX,
    minProjectedY,
    maxProjectedY
  };

  function projectPoint(point: GeoPoint): BoardPoint {
    const projectedX = projectLongitude(point.lon, avgLatRadians);
    const projectedY = point.lat;

    return {
      x:
        padX +
        ((projectedX - minProjectedX) / (maxProjectedX - minProjectedX)) * (width - padX * 2),
      y:
        height -
        padY -
        ((projectedY - minProjectedY) / (maxProjectedY - minProjectedY)) * (height - padY * 2)
    };
  }

  return {
    projectPoint,
    projectPoints: (points) => points.map(projectPoint),
    bounds
  };
}

export function projectGeoDiagramCities(
  cities: GeoDiagramCitySeed[],
  options: GeoProjectionOptions = {}
): GeoProjectionResult {
  const projector = createGeoProjector(cities, options);

  return {
    cities: cities.map((city) => {
      const projectedPoint = projector.projectPoint(city);
      const x = city.boardX ?? projectedPoint.x + (city.diagramDx ?? 0);
      const y = city.boardY ?? projectedPoint.y + (city.diagramDy ?? 0);

      return {
        id: city.id,
        name: city.name,
        label: city.label,
        lat: city.lat,
        lon: city.lon,
        x,
        y,
        labelDx: city.labelDx,
        labelDy: city.labelDy,
        labelAnchor: city.labelAnchor
      };
    }),
    bounds: projector.bounds
  };
}
