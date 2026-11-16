import type { MultiPolygon, Position } from "geojson";
import type { CountryFeature } from "./geoTypes";
import type { LocalizedString } from "../types";

export interface UNTerritoryInfo {
  displayName?: LocalizedString;
  statusNote: LocalizedString;
}

/**
 * Sovereign UN member-state target IDs for sub-entities / breakaway regions
 * represented in Natural Earth / world-atlas 50m topology.
 */
export const UN_MERGED_TERRITORY_MAP: Record<string, string> = {
  "158": "156", // Taiwan -> China (UNGA Res. 2758 / UN Map No. 4170)
  taiwan: "156",
  "n. cyprus": "196", // Northern Cyprus -> Cyprus (UNSC Res. 541 / 550)
  "northern cyprus": "196",
  somaliland: "706", // Somaliland -> Somalia
};

/**
 * OpenMapTiles `place` labels excluded from standalone country-level display
 * per UN Cartographic Standards (Map No. 4170).
 */
export const UN_EXCLUDED_COUNTRY_ISO_CODES = ["TW"];

export const UN_EXCLUDED_COUNTRY_NAMES = [
  "Taiwan",
  "N. Cyprus",
  "Northern Cyprus",
  "Somaliland",
  "Abkhazia",
  "South Ossetia",
  "Transnistria",
  "Nagorno-Karabakh",
];

const UN_TERRITORY_STATUS_BY_KEY: Record<string, UNTerritoryInfo> = {
  "732": {
    displayName: {
      zh: "西撒哈拉（非自治领土）",
      en: "Western Sahara",
    },
    statusNote: {
      zh: "联合国非自治领土（最终地位待决）",
      en: "UN Non-Self-Governing Territory",
    },
  },
  "w. sahara": {
    displayName: {
      zh: "西撒哈拉（非自治领土）",
      en: "Western Sahara",
    },
    statusNote: {
      zh: "联合国非自治领土（最终地位待决）",
      en: "UN Non-Self-Governing Territory",
    },
  },
  "western sahara": {
    displayName: {
      zh: "西撒哈拉（非自治领土）",
      en: "Western Sahara",
    },
    statusNote: {
      zh: "联合国非自治领土（最终地位待决）",
      en: "UN Non-Self-Governing Territory",
    },
  },
  "275": {
    displayName: {
      zh: "巴勒斯坦国",
      en: "State of Palestine",
    },
    statusNote: {
      zh: "联合国非会员观察员国（联大第67/19号决议）",
      en: "UN Non-Member Observer State (A/RES/67/19)",
    },
  },
  palestine: {
    displayName: {
      zh: "巴勒斯坦国",
      en: "State of Palestine",
    },
    statusNote: {
      zh: "联合国非会员观察员国（联大第67/19号决议）",
      en: "UN Non-Member Observer State (A/RES/67/19)",
    },
  },
  kosovo: {
    displayName: {
      zh: "科索沃（安理会第1244号决议）",
      en: "Kosovo (UNSCR 1244)",
    },
    statusNote: {
      zh: "适用联合国安理会第1244（1999）号决议",
      en: "Pursuant to UN Security Council Res. 1244 (1999)",
    },
  },
  "country-kosovo": {
    displayName: {
      zh: "科索沃（安理会第1244号决议）",
      en: "Kosovo (UNSCR 1244)",
    },
    statusNote: {
      zh: "适用联合国安理会第1244（1999）号决议",
      en: "Pursuant to UN Security Council Res. 1244 (1999)",
    },
  },
  "238": {
    displayName: {
      zh: "福克兰群岛（马尔维纳斯群岛）",
      en: "Falkland Islands (Malvinas)",
    },
    statusNote: {
      zh: "阿根廷与英国对主权归属存在争议",
      en: "Sovereignty disputed between Argentina and the United Kingdom",
    },
  },
  "falkland is.": {
    displayName: {
      zh: "福克兰群岛（马尔维纳斯群岛）",
      en: "Falkland Islands (Malvinas)",
    },
    statusNote: {
      zh: "阿根廷与英国对主权归属存在争议",
      en: "Sovereignty disputed between Argentina and the United Kingdom",
    },
  },
  "siachen glacier": {
    displayName: {
      zh: "查谟和克什米尔（待决地区）",
      en: "Jammu and Kashmir (Disputed Area)",
    },
    statusNote: {
      zh: "当事方尚未就查谟和克什米尔最终地位达成协议",
      en: "Final status has not yet been agreed upon by the parties",
    },
  },
  "country-siachen-glacier": {
    displayName: {
      zh: "查谟和克什米尔（待决地区）",
      en: "Jammu and Kashmir (Disputed Area)",
    },
    statusNote: {
      zh: "当事方尚未就查谟和克什米尔最终地位达成协议",
      en: "Final status has not yet been agreed upon by the parties",
    },
  },
};

export const UN_MAP_DISCLAIMER: LocalizedString = {
  zh: "参考联合国第4170号标准地图规范：虚线表示未定或存疑国界，点线表示停火线/实际控制线。本图所示边界、名称及称谓不意味着联合国对其法律地位的正式认可或接受。",
  en: "Aligned with UN Map No. 4170 conventions (dashed: undefined/disputed boundaries; dotted: ceasefire/control lines). The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.",
};

function toMultiPolygonCoords(geometry: CountryFeature["geometry"]): Position[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

/**
 * Merges sub-entities (such as Taiwan into China, N. Cyprus into Cyprus, Somaliland into Somalia)
 * into their UN-recognized member-state geometries so 3D highlighting, point lookup, and 2D maps
 * adhere strictly to UN Map No. 4170 representation.
 */
export function mergeUnTerritories(features: CountryFeature[]): CountryFeature[] {
  const byId = new Map<string, CountryFeature>();
  const cloned = features.map(f => ({ ...f, properties: { ...f.properties } }));
  for (const feature of cloned) {
    byId.set(String(feature.id), feature);
  }

  const kept: CountryFeature[] = [];
  for (const feature of cloned) {
    const idKey = String(feature.id).toLowerCase();
    const nameKey = feature.properties.name.trim().toLowerCase();
    const targetId = UN_MERGED_TERRITORY_MAP[idKey] ?? UN_MERGED_TERRITORY_MAP[nameKey];

    if (targetId && targetId !== String(feature.id)) {
      const target = byId.get(targetId);
      if (target) {
        const mergedCoords: Position[][][] = [
          ...toMultiPolygonCoords(target.geometry),
          ...toMultiPolygonCoords(feature.geometry),
        ];
        const mergedGeometry: MultiPolygon = {
          type: "MultiPolygon",
          coordinates: mergedCoords,
        };
        target.geometry = mergedGeometry;
        continue;
      }
    }

    kept.push(feature);
  }

  return kept;
}

export function getUNTerritoryInfo(feature: CountryFeature): UNTerritoryInfo | null {
  const idKey = String(feature.id ?? "").trim().toLowerCase();
  const nameKey = String(feature.properties?.name ?? "").trim().toLowerCase();
  return UN_TERRITORY_STATUS_BY_KEY[idKey] ?? UN_TERRITORY_STATUS_BY_KEY[nameKey] ?? null;
}
