import { geoContains, geoCentroid, geoDistance } from "d3-geo";
import type { CountryFeature } from "./geoTypes";
import type { ArchiveRecord } from "../types";
import { COUNTRIES_META, type CountryMetadata } from "../data/countriesMeta";
import { getUNTerritoryInfo } from "./unStandards";
import { getMapCities, canonicalCountryName } from "./worldGeometry";

export function recordBelongsToCountry(
  record: ArchiveRecord,
  country: CountryFeature,
  countries: CountryFeature[],
): boolean {
  const { coordinates, countryCode } = record.place;
  if (!coordinates) return false;
  const point: [number, number] = [coordinates.longitude, coordinates.latitude];
  if (geoContains(country, point)) return true;
  return countryCode === String(country.id)
    && !countries.some(feature => geoContains(feature, point));
}

export function findCountryAtPoint(
  features: CountryFeature[],
  longitude: number,
  latitude: number
): CountryFeature | null {
  const pt: [number, number] = [longitude, latitude];

  // 1. Precise containment test
  for (const f of features) {
    try {
      if (geoContains(f, pt)) {
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
      const centroid = geoCentroid(f);
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

  // Generic fallback if not in pre-seeded meta (applying UN territory designations where defined)
  const unInfo = getUNTerritoryInfo(feature);
  const centroid = geoCentroid(feature);
  const cities = getMapCities().filter(city => canonicalCountryName(city.countryName) === canonicalCountryName(name));
  return {
    id: id || name,
    name: unInfo?.displayName ?? { en: name, zh: name },
    center: centroid,
    capital: cities.find(city => city.isCapital),
    cities,
  };
}
