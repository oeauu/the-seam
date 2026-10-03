import { geoContains, geoCentroid, geoDistance } from "d3-geo";
import type { CountryFeature } from "./geoTypes";
import { COUNTRIES_META, type CountryMetadata } from "../data/countriesMeta";

export function findCountryAtPoint(
  features: CountryFeature[],
  longitude: number,
  latitude: number
): CountryFeature | null {
  const pt: [number, number] = [longitude, latitude];

  // 1. Precise containment test
  for (const f of features) {
    try {
      if (geoContains(f as any, pt)) {
        return f;
      }
    } catch {
      // ignore invalid polygon edge cases
    }
  }

  // 2. Tolerance fallback (e.g. islands, coastlines where user clicked slightly into sea)
  let bestFeature: CountryFeature | null = null;
  let minDistance = 0.04; // ~250 km on Earth surface

  for (const f of features) {
    try {
      const centroid = geoCentroid(f as any);
      const dist = geoDistance(centroid, pt);
      if (dist < minDistance) {
        minDistance = dist;
        bestFeature = f;
      }
    } catch {
      // ignore
    }
  }

  return bestFeature;
}

export function getCountryMetadataForFeature(feature: CountryFeature): CountryMetadata | null {
  const name = feature.properties?.name || "";
  const id = String(feature.id || "");

  // Match by numeric id
  if (COUNTRIES_META[id]) {
    return COUNTRIES_META[id];
  }

  // Match by name
  const normName = name.toLowerCase();
  for (const meta of Object.values(COUNTRIES_META)) {
    if (meta.name.en.toLowerCase() === normName) {
      return meta;
    }
  }

  // Generic fallback if not in pre-seeded meta
  const centroid = geoCentroid(feature as any);
  return {
    id: id || name,
    name: { en: name, zh: name },
    center: centroid,
    capital: {
      name: { en: name, zh: name },
      coordinates: centroid,
      isCapital: true
    },
    cities: []
  };
}
