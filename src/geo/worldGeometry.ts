import { feature, mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { CountryFeature, WorldData } from "./geoTypes";
import { BufferGeometry, Float32BufferAttribute } from "three";

export const GLOBE_RADIUS = 2.0;
export const BORDER_RADIUS = 2.002;
export const MARKER_RADIUS = 2.025;

export function latLngToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  const cosLat = Math.cos(phi);
  return [
    radius * cosLat * Math.sin(theta),
    radius * Math.sin(phi),
    radius * cosLat * Math.cos(theta),
  ];
}

export function vector3ToLatLng(x: number, y: number, z: number): [number, number] {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0) return [0, 0];
  const lat = Math.asin(Math.max(-1, Math.min(1, y / r))) * (180 / Math.PI);
  const lon = Math.atan2(x, z) * (180 / Math.PI);
  return [lat, lon];
}

interface WorldTopology extends Topology {
  objects: {
    countries: Topology["objects"][string];
    land?: Topology["objects"][string];
  };
}

let cachedWorldData: WorldData | null = null;
let cachedChinaProvinces: any = null;

export async function loadWorldData(): Promise<WorldData> {
  if (cachedWorldData) return cachedWorldData;

  let res = await fetch("/countries-50m.json");
  if (!res.ok) {
    res = await fetch("/countries-110m.json");
  }
  if (!res.ok) throw new Error("Failed to load world map data");

  const topo = (await res.json()) as WorldTopology;
  const countriesCollection = feature(topo, topo.objects.countries as any) as any;
  const features: CountryFeature[] = countriesCollection.features || [];

  const bordersMultiLine = mesh(topo, topo.objects.countries as any) as any;
  const lines: number[][][] = bordersMultiLine.coordinates || [];

  const positions: number[] = [];

  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lon1, lat1] = line[i];
      const [lon2, lat2] = line[i + 1];

      // Skip lines wrapping across antimeridian
      if (Math.abs(lon1 - lon2) > 180) continue;

      const p1 = latLngToVector3(lat1, lon1, BORDER_RADIUS);
      const p2 = latLngToVector3(lat2, lon2, BORDER_RADIUS);

      positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    }
  }

  cachedWorldData = {
    features,
    borderMesh: positions,
    borderLines2D: lines,
  };

  return cachedWorldData;
}

export async function loadChinaProvinces(): Promise<any> {
  if (cachedChinaProvinces) return cachedChinaProvinces;
  try {
    const res = await fetch("/china.json");
    if (res.ok) {
      cachedChinaProvinces = await res.json();
      return cachedChinaProvinces;
    }
  } catch (err) {
    console.warn("Could not load china.json", err);
  }
  return null;
}

export function createBorderGeometry(positions: number[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}
