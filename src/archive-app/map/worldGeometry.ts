import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { BufferGeometry, Float32BufferAttribute } from "three";
import type { WorldProjection } from "./worldProjection";
import { sampleParchmentSurface } from "../parchment/parchmentSurface";

export type WorldFeature = Feature<Geometry, { name?: string }>;

interface WorldTopology extends Topology {
  objects: Topology["objects"] & { countries: Topology["objects"][string] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isWorldTopology(value: unknown): value is WorldTopology {
  return isRecord(value) && value.type === "Topology" && isRecord(value.objects) && "countries" in value.objects && Array.isArray(value.arcs);
}

export function parseWorldFeatures(value: unknown): WorldFeature[] {
  if (!isWorldTopology(value)) return [];
  const converted: unknown = feature(value, "countries");
  if (!isRecord(converted) || typeof converted.type !== "string") return [];
  if (converted.type === "FeatureCollection" && Array.isArray(converted.features)) {
    return converted.features.filter((item): item is WorldFeature => isRecord(item) && item.type === "Feature" && "geometry" in item && item.geometry !== null) as WorldFeature[];
  }
  return converted.type === "Feature" && "geometry" in converted && converted.geometry !== null ? [converted as unknown as WorldFeature] : [];
}

export async function loadWorldFeatures(signal?: AbortSignal): Promise<WorldFeature[]> {
  const response = await fetch("/countries-110m.json", { signal });
  if (!response.ok) throw new Error(`World boundary request failed: ${response.status}`);
  const payload = await response.json() as unknown;
  const features = parseWorldFeatures(payload);
  if (features.length === 0) throw new Error("World boundary payload contains no features");
  return features;
}

function coordinateRing(value: readonly number[]): readonly [number, number] | null {
  return value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]) ? [value[0], value[1]] : null;
}

function ringsForGeometry(geometry: Geometry | null): readonly (readonly (readonly [number, number])[])[] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.map(ring => ring.map(coordinateRing).filter((item): item is readonly [number, number] => item !== null));
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat().map(ring => ring.map(coordinateRing).filter((item): item is readonly [number, number] => item !== null));
  return [];
}

export function createWorldBoundaryGeometry(features: readonly WorldFeature[], projection: WorldProjection): BufferGeometry {
  const points: number[] = [];
  for (const item of features) {
    for (const ring of ringsForGeometry(item.geometry)) {
      const stride = ring.length > 160 ? 2 : ring.length > 80 ? 1 : 1;
      for (let index = 0; index < ring.length - 1; index += stride) {
        const first = projection.projectLonLat(ring[index][0], ring[index][1]);
        const second = projection.projectLonLat(ring[Math.min(index + stride, ring.length - 1)][0], ring[Math.min(index + stride, ring.length - 1)][1]);
        const firstSurface = sampleParchmentSurface(first.x, first.y);
        const secondSurface = sampleParchmentSurface(second.x, second.y);
        points.push(first.x, first.y, firstSurface.position[2] + 0.048, second.x, second.y, secondSurface.position[2] + 0.048);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}
