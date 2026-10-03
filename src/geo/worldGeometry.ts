import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountryFeature, CountryFeatureProperties, WorldData, MapCity } from "./geoTypes";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { geoArea } from "d3";

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
    countries: GeometryCollection<CountryFeatureProperties>;
    land?: Topology["objects"][string];
  };
}

let cachedWorldData: WorldData | null = null;
let cachedChinaProvinces: FeatureCollection | null = null;
let worldRequest: Promise<WorldData> | null = null;

export async function loadWorldData(): Promise<WorldData> {
  if (cachedWorldData) return cachedWorldData;
  if (worldRequest) return worldRequest;
  worldRequest = readWorldData().catch(error => {
    worldRequest = null;
    throw error;
  });
  return worldRequest;
}

async function readWorldData(): Promise<WorldData> {

  let res = await fetch("/countries-50m.json");
  if (!res.ok) {
    res = await fetch("/countries-110m.json");
  }
  if (!res.ok) throw new Error("Failed to load world map data");

  const topo = (await res.json()) as WorldTopology;
  if (topo.type !== "Topology" || !Array.isArray(topo.arcs) || topo.objects?.countries?.type !== "GeometryCollection") {
    throw new Error("Invalid world geometry");
  }
  const countriesCollection = feature(topo, topo.objects.countries);
  const features: CountryFeature[] = countriesCollection.features.flatMap(f => {
    if (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon") return [];
    const properties = f.properties;
    if (!properties || typeof properties.name !== "string") return [];
    const id = f.id === undefined || String(f.id) === "-99" ? `country-${properties.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : f.id;
    return [{ ...f, id, geometry: f.geometry, properties: { name: properties.name } }];
  });
  for (const country of features) {
    if (features.some(other => other !== country && other.id === country.id && geoArea(other) > geoArea(country))) {
      country.id = `country-${country.properties.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    }
  }

  const bordersMultiLine = mesh(topo, topo.objects.countries);
  const lines: number[][][] = bordersMultiLine.coordinates || [];

  const positions: number[] = [];

  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lon1, lat1] = line[i];
      const [lon2, lat2] = line[i + 1];

      const deltaLon = ((lon2 - lon1 + 540) % 360) - 180;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(lat2 - lat1), Math.abs(deltaLon))));
      // Short segments stay above the sphere instead of disappearing inside it.
      for (let step = 0; step < steps; step++) {
        const t1 = step / steps, t2 = (step + 1) / steps;
        const p1 = latLngToVector3(lat1 + (lat2 - lat1) * t1, lon1 + deltaLon * t1, BORDER_RADIUS);
        const p2 = latLngToVector3(lat1 + (lat2 - lat1) * t2, lon1 + deltaLon * t2, BORDER_RADIUS);
        positions.push(...p1, ...p2);
      }
    }
  }

  cachedWorldData = {
    features,
    borderMesh: positions,
    borderLines2D: lines,
    cities: await loadCities(),
  };

  return cachedWorldData;
}

export function getMapCities(): MapCity[] { return cachedWorldData?.cities || []; }

export function canonicalCountryName(name: string): string {
  const aliases: Record<string,string> = {
    "Czechia":"Czech Republic", "Côte d'Ivoire":"Ivory Coast", "Dem. Rep. Congo":"Congo (Kinshasa)",
    "Congo":"Congo (Brazzaville)", "Central African Rep.":"Central African Republic",
    "Eq. Guinea":"Equatorial Guinea", "Dominican Rep.":"Dominican Republic", "Bosnia and Herz.":"Bosnia and Herzegovina",
    "Timor-Leste":"East Timor", "Guinea-Bissau":"Guinea Bissau", "eSwatini":"Swaziland",
  };
  return aliases[name] || name;
}

async function loadCities(): Promise<MapCity[]> {
  try {
    const response = await fetch("/geo/cities.json");
    if (!response.ok) return [];
    const value: unknown = await response.json();
    if (!Array.isArray(value)) return [];
    return value.filter((city): city is MapCity => {
      if (!city || typeof city !== "object") return false;
      return "name" in city && typeof city.name === "object" && city.name !== null && "en" in city.name && "zh" in city.name
        && "coordinates" in city && Array.isArray(city.coordinates) && city.coordinates.length === 2 && city.coordinates.every(Number.isFinite)
        && "countryName" in city && typeof city.countryName === "string" && "countryCode" in city && typeof city.countryCode === "string"
        && "rank" in city && typeof city.rank === "number";
    });
  } catch { return []; }
}

export async function loadAdministrativeBorders(name: string): Promise<FeatureCollection | null> {
  try {
    const indexResponse = await fetch("/geo/admin-index.json");
    if (!indexResponse.ok) return null;
    const index: Record<string, string> = await indexResponse.json();
    const filename = index[name] || index[canonicalCountryName(name)];
    if (!filename) return null;
    const response = await fetch(`/geo/${filename}`);
    if (!response.ok) return null;
    const data: FeatureCollection = await response.json();
    return data.type === "FeatureCollection" && Array.isArray(data.features) ? data : null;
  } catch { return null; }
}

export async function loadChinaProvinces(): Promise<FeatureCollection<Geometry> | null> {
  if (cachedChinaProvinces) return cachedChinaProvinces;
  try {
    const res = await fetch("/china.json");
    if (res.ok) {
      const data: FeatureCollection = await res.json();
      if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) return null;
      cachedChinaProvinces = data;
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
