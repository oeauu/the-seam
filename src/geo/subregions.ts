import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { ArchiveRecord, Language } from "../types";
import { latLngToVector3 } from "./worldGeometry";
import { withBasePath } from "../state/routing";

export interface AdminLabel {
  id: string;
  name: string;
  coordinates: [number, number];
}

export interface SubregionGroup {
  key: string;
  label: string;
  count: number;
  provinceFeatureId?: string;
}

const CHINA_PROVINCE_EN: Record<string, string> = {
  北京: "Beijing",
  天津: "Tianjin",
  上海: "Shanghai",
  重庆: "Chongqing",
  河北: "Hebei",
  山西: "Shanxi",
  辽宁: "Liaoning",
  吉林: "Jilin",
  黑龙江: "Heilongjiang",
  江苏: "Jiangsu",
  浙江: "Zhejiang",
  安徽: "Anhui",
  福建: "Fujian",
  江西: "Jiangxi",
  山东: "Shandong",
  河南: "Henan",
  湖北: "Hubei",
  湖南: "Hunan",
  广东: "Guangdong",
  海南: "Hainan",
  四川: "Sichuan",
  贵州: "Guizhou",
  云南: "Yunnan",
  陕西: "Shaanxi",
  甘肃: "Gansu",
  青海: "Qinghai",
  台湾: "Taiwan",
  内蒙古: "Inner Mongolia",
  广西: "Guangxi",
  西藏: "Tibet",
  宁夏: "Ningxia",
  新疆: "Xinjiang",
  香港: "Hong Kong",
  澳门: "Macau",
};

let chinaProvincesCache: Promise<FeatureCollection | null> | null = null;

/** Lazy-loads full provincial polygons for China so 2D & filter classification are exact. */
export function loadChinaProvinces(): Promise<FeatureCollection | null> {
  if (chinaProvincesCache) return chinaProvincesCache;
  chinaProvincesCache = fetch(withBasePath("china.json"))
    .then(async res => {
      if (!res.ok) return null;
      const json = (await res.json()) as FeatureCollection;
      if (!json || !Array.isArray(json.features)) return null;
      return json;
    })
    .catch(() => null);
  return chinaProvincesCache;
}

function appendSphericalSegment(positions: number[], p1: Position, p2: Position, radius: number): void {
  const lon1 = p1[0];
  const lat1 = p1[1];
  const lon2 = p2[0];
  const lat2 = p2[1];
  if (!Number.isFinite(lon1) || !Number.isFinite(lat1) || !Number.isFinite(lon2) || !Number.isFinite(lat2)) {
    return;
  }

  let dLon = lon2 - lon1;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  const span = Math.max(Math.abs(dLon), Math.abs(lat2 - lat1));
  const steps = Math.max(1, Math.min(12, Math.ceil(span / 3.0)));

  for (let s = 0; s < steps; s++) {
    const t0 = s / steps;
    const t1 = (s + 1) / steps;
    const a = latLngToVector3(lat1 + (lat2 - lat1) * t0, lon1 + dLon * t0, radius);
    const b = latLngToVector3(lat1 + (lat2 - lat1) * t1, lon1 + dLon * t1, radius);
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
}

function collectLineStrings(geometry: Geometry | null): Position[][] {
  if (!geometry) return [];
  switch (geometry.type) {
    case "LineString":
      return [geometry.coordinates];
    case "MultiLineString":
      return geometry.coordinates;
    case "Polygon":
      return geometry.coordinates;
    case "MultiPolygon":
      return geometry.coordinates.flat();
    case "GeometryCollection":
      return geometry.geometries.flatMap(collectLineStrings);
    default:
      return [];
  }
}

/** Converts a FeatureCollection of state/province borders into 3D line-segment positions. */
export function buildAdminBorderPositions(collection: FeatureCollection, radius: number): number[] {
  const positions: number[] = [];
  for (const feature of collection.features) {
    const lines = collectLineStrings(feature.geometry);
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        appendSphericalSegment(positions, line[i], line[i + 1], radius);
      }
    }
  }
  return positions;
}

/** Handles both GeoJSON RFC 7946 and D3 spherical winding orders safely. */
export function featureContainsPoint(feature: Feature, coordinates: [number, number]): boolean {
  const area = d3.geoArea(feature);
  const contained = d3.geoContains(feature, coordinates);
  return area > Math.PI * 2 ? !contained : contained;
}

export function localizeProvinceName(rawName: string, language: Language): string {
  const trimmed = rawName.trim();
  if (language === "en") {
    return CHINA_PROVINCE_EN[trimmed] || trimmed;
  }
  return trimmed;
}

/** Extracts state/province label coordinates from either polygons (china.json) or border lines. */
export function extractAdminLabels(
  collection: FeatureCollection | null,
  language: Language,
  isChina = false
): AdminLabel[] {
  if (!collection) return [];

  if (isChina) {
    const labels: AdminLabel[] = [];
    for (const feature of collection.features) {
      const props = (feature.properties || {}) as { id?: string; name?: string; cp?: unknown };
      if (!props.name) continue;
      let coords: [number, number] | null = null;
      if (
        Array.isArray(props.cp) &&
        props.cp.length >= 2 &&
        typeof props.cp[0] === "number" &&
        typeof props.cp[1] === "number"
      ) {
        coords = [props.cp[0], props.cp[1]];
      } else {
        const c = d3.geoCentroid(feature);
        if (Number.isFinite(c[0]) && Number.isFinite(c[1])) coords = [c[0], c[1]];
      }
      if (!coords) continue;
      labels.push({
        id: props.id || props.name,
        name: localizeProvinceName(props.name, language),
        coordinates: coords,
      });
    }
    return labels;
  }

  const accum = new Map<string, { refLon: number; sumLon: number; sumLat: number; count: number }>();

  for (const feature of collection.features) {
    const rawName = (feature.properties as { name?: unknown } | null)?.name;
    if (typeof rawName !== "string" || !rawName.trim()) continue;

    const parts = rawName
      .split(/\s+-\s+/)
      .map(s => s.trim())
      .filter(part => part.length >= 2 && part.toLowerCase() !== "undefined" && !/^[-?\d.]+$/.test(part));

    if (parts.length === 0) continue;
    const lines = collectLineStrings(feature.geometry);
    if (lines.length === 0) continue;

    for (const part of parts) {
      let bucket = accum.get(part);
      for (const line of lines) {
        const step = line.length > 24 ? Math.ceil(line.length / 16) : 1;
        for (let i = 0; i < line.length; i += step) {
          const [lon, lat] = line[i];
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
          if (!bucket) {
            bucket = { refLon: lon, sumLon: 0, sumLat: 0, count: 0 };
            accum.set(part, bucket);
          }
          let dLon = lon - bucket.refLon;
          if (dLon > 180) dLon -= 360;
          if (dLon < -180) dLon += 360;
          bucket.sumLon += bucket.refLon + dLon;
          bucket.sumLat += lat;
          bucket.count += 1;
        }
      }
    }
  }

  const result: AdminLabel[] = [];
  for (const [name, bucket] of accum.entries()) {
    if (bucket.count < 3) continue;
    let lon = bucket.sumLon / bucket.count;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    result.push({
      id: name,
      name,
      coordinates: [lon, bucket.sumLat / bucket.count],
    });
  }
  return result;
}

function parsePlaceSubregion(record: ArchiveRecord, language: Language): string {
  const placeName = (record.place.name[language] || record.place.name.en || "").trim();
  const countryName = (record.place.countryName?.[language] || "").trim();
  if (!placeName) return language === "zh" ? "其他地区" : "Other";

  if (language === "zh") {
    const parenMatch = placeName.match(/[（(]([^（）()]+)[）)]/);
    if (parenMatch && parenMatch[1]) {
      const inner = parenMatch[1].trim();
      if (inner && inner !== countryName && inner !== "中国") {
        return inner;
      }
    }
    const parts = placeName.split(/[，,]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 1];
      if (candidate !== countryName) return candidate;
    }
    return placeName.replace(/[（(][^（）()]*[）)]/g, "").trim() || placeName;
  }

  const commaParts = placeName.split(",").map(s => s.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const tail = commaParts[commaParts.length - 1];
    if (tail && tail.toLowerCase() !== countryName.toLowerCase() && !tail.toLowerCase().includes("ancient ")) {
      return tail;
    }
    return commaParts[0].replace(/\s*\([^)]*\)/g, "").trim();
  }

  return placeName.replace(/\s*\([^)]*\)/g, "").trim() || placeName;
}

/** Resolves each archive record's sub-national classification strictly from factual polygons/place names. */
export function resolveRecordSubregion(
  record: ArchiveRecord,
  chinaProvinces: FeatureCollection | null,
  language: Language
): { key: string; label: string; provinceFeatureId?: string } {
  const coords = record.place.coordinates;
  if (chinaProvinces && record.place.countryCode === "156" && coords) {
    for (const feature of chinaProvinces.features) {
      if (featureContainsPoint(feature, [coords.longitude, coords.latitude])) {
        const props = (feature.properties || {}) as { id?: string; name?: string };
        if (props.name) {
          return {
            key: `cn:${props.id || props.name}`,
            label: localizeProvinceName(props.name, language),
            provinceFeatureId: props.id || props.name,
          };
        }
      }
    }
  }

  const label = parsePlaceSubregion(record, language);
  return {
    key: `place:${label.toLowerCase()}`,
    label,
  };
}
