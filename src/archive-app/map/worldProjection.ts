import { geoEqualEarth } from "d3";
import { sampleParchmentSurface } from "../parchment/parchmentSurface";

export interface ParchmentPoint {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface WorldProjection {
  readonly width: number;
  readonly height: number;
  projectLonLat(longitude: number, latitude: number): ParchmentPoint;
  unprojectParchmentPoint(x: number, y: number): [number, number] | null;
  getProjectedBounds(regionId?: string): ProjectedBounds;
  getWorldBounds(): ProjectedBounds;
}

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 400;
const LOCAL_SCALE = 0.0092;

export function parchmentPointToPixel(point: ParchmentPoint, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT): [number, number] {
  return [point.x / LOCAL_SCALE + width / 2, height / 2 - point.y / LOCAL_SCALE];
}

function assertCoordinate(longitude: number, latitude: number): void {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Longitude must be finite and between -180 and 180");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Latitude must be finite and between -90 and 90");
}

export function createWorldProjection(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT): WorldProjection {
  const projection = geoEqualEarth().fitExtent([[28, 24], [width - 28, height - 24]], { type: "Sphere" });
  const localPoint = (pixelX: number, pixelY: number): ParchmentPoint => {
    const x = (pixelX - width / 2) * LOCAL_SCALE;
    const y = (height / 2 - pixelY) * LOCAL_SCALE;
    const surface = sampleParchmentSurface(x, y);
    return { x, y, z: surface.position[2] + 0.035 };
  };
  const worldBounds: ProjectedBounds = {
    minX: (28 - width / 2) * LOCAL_SCALE,
    maxX: (width - 28 - width / 2) * LOCAL_SCALE,
    minY: (height / 2 - (height - 24)) * LOCAL_SCALE,
    maxY: (height / 2 - 24) * LOCAL_SCALE,
  };
  return {
    width,
    height,
    projectLonLat(longitude, latitude) {
      assertCoordinate(longitude, latitude);
      const point = projection([longitude, latitude]);
      if (!point) throw new Error("Projection returned no point");
      return localPoint(point[0], point[1]);
    },
    unprojectParchmentPoint(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const pixelX = x / LOCAL_SCALE + width / 2;
      const pixelY = height / 2 - y / LOCAL_SCALE;
      const result = projection.invert?.([pixelX, pixelY]);
      if (!result || !Number.isFinite(result[0]) || !Number.isFinite(result[1])) return null;
      return [result[0], result[1]];
    },
    getProjectedBounds(regionId = "global") {
      if (regionId !== "global") return worldBounds;
      return worldBounds;
    },
    getWorldBounds() {
      return worldBounds;
    },
  };
}

export const defaultWorldProjection = createWorldProjection();
