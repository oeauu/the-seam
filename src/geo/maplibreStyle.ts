import type { FeatureCollection, Geometry, Position } from "geojson";
import type { ExpressionSpecification, LayerSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { geoClipAntimeridian, geoStream, type GeoStream } from "d3";
import type { CountryFeature } from "./geoTypes";
import type { Language } from "../types";
import { UN_EXCLUDED_COUNTRY_ISO_CODES, UN_EXCLUDED_COUNTRY_NAMES } from "./unStandards";

export const MIN_GLOBE_ZOOM = 1.15;
export const MAX_GLOBE_ZOOM = 7.5;

const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const GLOBE_BASE_RADIUS_AT_Z0_PX = 58;
const REFERENCE_NORMAL_GLOBE_DIAMETER_PX = 2 * DEFAULT_VIEWPORT_HEIGHT * 0.4; // 576px at 1280x720
// Use the normal-view globe as the reference and temper the scaling on narrow screens.
const DOT_RADIUS_TO_GLOBE_DIAMETER_RATIO = 0.0078;

export interface GlobeViewportSize {
  width: number;
  height: number;
}

export interface GlobeClusterSizing {
  normalZoom: number;
  plateauZoom: number;
  normalGlobeDiameterPx: number;
  coreRadius: {
    min: number;
    normal: number;
    max: number;
  };
  strokeWidth: {
    min: number;
    normal: number;
    max: number;
  };
  haloRadius: {
    min: number;
    normal: number;
    max: number;
    hoverMin: number;
    hoverNormal: number;
    hoverMax: number;
  };
  hitRadius: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getDefaultGlobeZoomForViewport(width: number, height: number): number {
  const safeW = Number.isFinite(width) && width > 0 ? width : DEFAULT_VIEWPORT_WIDTH;
  const safeH = Number.isFinite(height) && height > 0 ? height : DEFAULT_VIEWPORT_HEIGHT;
  const minSide = Math.max(220, Math.min(safeW, safeH));
  const targetRadiusPx = minSide * 0.4;
  return Math.max(MIN_GLOBE_ZOOM + 0.2, Math.min(2.6, Math.log2(targetRadiusPx / GLOBE_BASE_RADIUS_AT_Z0_PX)));
}

export function computeGlobeClusterSizing(width: number, height: number): GlobeClusterSizing {
  const normalZoom = getDefaultGlobeZoomForViewport(width, height);
  const normalGlobeDiameterPx = 2 * GLOBE_BASE_RADIUS_AT_Z0_PX * Math.pow(2, normalZoom);
  const referenceRadiusPx = REFERENCE_NORMAL_GLOBE_DIAMETER_PX * DOT_RADIUS_TO_GLOBE_DIAMETER_RATIO;
  const viewportScale = Math.max(
    0.84,
    Math.min(1.18, Math.sqrt(normalGlobeDiameterPx / REFERENCE_NORMAL_GLOBE_DIAMETER_PX)),
  );

  const normalCore = round2(referenceRadiusPx * viewportScale);
  const minCore = round2(normalCore * 0.87);
  const maxCore = round2(normalCore * 1.24);
  const plateauZoom = round2(Math.min(MAX_GLOBE_ZOOM - 0.8, normalZoom + 2.4));

  const minStroke = round2(minCore * 0.16);
  const normalStroke = round2(normalCore * 0.16);
  const maxStroke = round2(maxCore * 0.16);

  return {
    normalZoom,
    plateauZoom,
    normalGlobeDiameterPx: round2(normalGlobeDiameterPx),
    coreRadius: {
      min: minCore,
      normal: normalCore,
      max: maxCore,
    },
    strokeWidth: {
      min: minStroke,
      normal: normalStroke,
      max: maxStroke,
    },
    haloRadius: {
      min: round2(minCore + minStroke + 1.15),
      normal: round2(normalCore + normalStroke + 1.4),
      max: round2(maxCore + maxStroke + 1.8),
      hoverMin: round2(minCore + minStroke + 2.6),
      hoverNormal: round2(normalCore + normalStroke + 3.2),
      hoverMax: round2(maxCore + maxStroke + 4.0),
    },
    hitRadius: Math.max(15, Math.ceil(maxCore + maxStroke + 10)),
  };
}

export function buildGlobeClusterPaintSpecs(sizing: GlobeClusterSizing) {
  const hoverScale = 1.14;
  const coreRadiusExpr: ExpressionSpecification = [
    "interpolate",
    ["cubic-bezier", 0.33, 0.33, 0.67, 1],
    ["zoom"],
    MIN_GLOBE_ZOOM,
    ["case", ["boolean", ["get", "hovered"], false], round2(sizing.coreRadius.min * hoverScale), sizing.coreRadius.min],
    sizing.normalZoom,
    ["case", ["boolean", ["get", "hovered"], false], round2(sizing.coreRadius.normal * hoverScale), sizing.coreRadius.normal],
    sizing.plateauZoom,
    ["case", ["boolean", ["get", "hovered"], false], round2(sizing.coreRadius.max * hoverScale), sizing.coreRadius.max],
    MAX_GLOBE_ZOOM,
    ["case", ["boolean", ["get", "hovered"], false], round2(sizing.coreRadius.max * hoverScale), sizing.coreRadius.max],
  ];

  const strokeWidthExpr: ExpressionSpecification = [
    "interpolate",
    ["cubic-bezier", 0.22, 1, 0.36, 1],
    ["zoom"],
    MIN_GLOBE_ZOOM,
    sizing.strokeWidth.min,
    sizing.normalZoom,
    sizing.strokeWidth.normal,
    sizing.plateauZoom,
    sizing.strokeWidth.max,
    MAX_GLOBE_ZOOM,
    sizing.strokeWidth.max,
  ];

  const haloRadiusExpr: ExpressionSpecification = [
    "interpolate",
    ["cubic-bezier", 0.22, 1, 0.36, 1],
    ["zoom"],
    MIN_GLOBE_ZOOM,
    ["case", ["boolean", ["get", "hovered"], false], sizing.haloRadius.hoverMin, sizing.haloRadius.min],
    sizing.normalZoom,
    ["case", ["boolean", ["get", "hovered"], false], sizing.haloRadius.hoverNormal, sizing.haloRadius.normal],
    sizing.plateauZoom,
    ["case", ["boolean", ["get", "hovered"], false], sizing.haloRadius.hoverMax, sizing.haloRadius.max],
    MAX_GLOBE_ZOOM,
    ["case", ["boolean", ["get", "hovered"], false], sizing.haloRadius.hoverMax, sizing.haloRadius.max],
  ];

  return {
    hitRadius: sizing.hitRadius,
    haloRadius: haloRadiusExpr,
    haloOpacity: ["case", ["boolean", ["get", "hovered"], false], 0.38, 0] as ExpressionSpecification,
    coreRadius: coreRadiusExpr,
    coreStrokeWidth: strokeWidthExpr,
    coreOpacity: 1,
    coreStrokeOpacity: 1,
  };
}

export function syncGlobeClusterLayerSizing(map: MapLibreMap, width: number, height: number): void {
  const specs = buildGlobeClusterPaintSpecs(computeGlobeClusterSizing(width, height));
  if (map.getLayer("seam-clusters-hit")) {
    map.setPaintProperty("seam-clusters-hit", "circle-radius", specs.hitRadius);
  }
  if (map.getLayer("seam-clusters-halo")) {
    map.setPaintProperty("seam-clusters-halo", "circle-radius", specs.haloRadius);
    map.setPaintProperty("seam-clusters-halo", "circle-opacity", specs.haloOpacity);
  }
  if (map.getLayer("seam-clusters-core")) {
    map.setPaintProperty("seam-clusters-core", "circle-radius", specs.coreRadius);
    map.setPaintProperty("seam-clusters-core", "circle-stroke-width", specs.coreStrokeWidth);
    map.setPaintProperty("seam-clusters-core", "circle-opacity", specs.coreOpacity);
    map.setPaintProperty("seam-clusters-core", "circle-stroke-opacity", specs.coreStrokeOpacity);
  }
}

export const GLOBE_CONTEXT_LAYER_IDS = [
  "boundary_3",
  "label_state",
  "label_city",
  "label_city_capital",
  "water_name_point_label",
] as const;

export const COUNTRY_LABEL_LAYER_IDS = ["label_country_1", "label_country_2", "label_country_3"] as const;

export const EMPTY_GEOJSON: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [],
};

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

function hasAntimeridianJump(geometry: Geometry): boolean {
  const checkRings = (rings: Position[][]) =>
    rings.some(ring => {
      for (let i = 1; i < ring.length; i++) {
        if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) return true;
      }
      return false;
    });

  if (geometry.type === "Polygon") return checkRings(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some(checkRings);
  return false;
}

/**
 * Splits polygons that cross ±180° (Russia, Fiji, Antarctica) cleanly at the antimeridian
 * so MapLibre's globe mesh never draws trans-hemispheric chords or clipped blank tiles.
 */
function clipAntimeridianIfNeeded(geometry: Geometry): Geometry {
  if (!hasAntimeridianJump(geometry)) return geometry;

  const polygons: Position[][][] = [];
  let currentPoly: Position[][] = [];
  let currentRing: Position[] | null = null;

  const collector: GeoStream = {
    polygonStart() {
      currentPoly = [];
    },
    polygonEnd() {
      if (currentPoly.length > 0) polygons.push(currentPoly);
    },
    lineStart() {
      currentRing = [];
    },
    lineEnd() {
      if (currentRing && currentRing.length >= 3) {
        const first = currentRing[0];
        const last = currentRing[currentRing.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          currentRing.push([first[0], first[1]]);
        }
        currentPoly.push(currentRing);
      }
      currentRing = null;
    },
    point(lambda: number, phi: number) {
      if (currentRing) currentRing.push([lambda * RAD2DEG, phi * RAD2DEG]);
    },
  };

  const clipper = geoClipAntimeridian(collector);
  const radSink: GeoStream = {
    polygonStart() {
      clipper.polygonStart();
    },
    polygonEnd() {
      clipper.polygonEnd();
    },
    lineStart() {
      clipper.lineStart();
    },
    lineEnd() {
      clipper.lineEnd();
    },
    point(lon: number, lat: number) {
      clipper.point(lon * DEG2RAD, lat * DEG2RAD);
    },
    sphere() {
      clipper.sphere?.();
    },
  };

  geoStream(geometry, radSink);
  if (polygons.length === 0) return geometry;
  return polygons.length === 1
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

/**
 * Returns a clean localized MapLibre text expression and strips dual "Simplified/Traditional"
 * slash suffixes present in OpenMapTiles labels (e.g. "尼日利亚/奈及利亚" -> "尼日利亚").
 */
export function getLocalizedLabelExpression(language: Language): ExpressionSpecification {
  const baseName: ExpressionSpecification =
    language === "zh"
      ? ["coalesce", ["get", "name:zh-Hans"], ["get", "name:zh"], ["get", "name:latin"], ["get", "name"]]
      : ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];

  return [
    "let",
    "raw",
    baseName,
    [
      "case",
      [">=", ["index-of", "/", ["var", "raw"]], 0],
      ["slice", ["var", "raw"], 0, ["index-of", "/", ["var", "raw"]]],
      ["var", "raw"],
    ],
  ];
}

/**
 * Applies UN Map No. 4170 / UNTERM official designations for disputed and special-status
 * territories on top of OpenMapTiles localized country labels.
 */
export function getCountryLabelExpression(language: Language): ExpressionSpecification {
  const cleaned = getLocalizedLabelExpression(language);
  const falklands = language === "zh" ? "福克兰群岛（马尔维纳斯群岛）" : "Falkland Islands (Malvinas)";
  const palestine = language === "zh" ? "巴勒斯坦国" : "State of Palestine";
  const wSahara = language === "zh" ? "西撒哈拉（非自治领土）" : "Western Sahara";
  const kosovo = language === "zh" ? "科索沃（安理会第1244号决议）" : "Kosovo (UNSCR 1244)";

  return [
    "let",
    "cleaned",
    cleaned,
    [
      "match",
      ["coalesce", ["get", "iso_a2"], ""],
      "FK",
      falklands,
      "PS",
      palestine,
      "EH",
      wSahara,
      "XK",
      kosovo,
      [
        "case",
        ["==", ["coalesce", ["get", "name:en"], ["get", "name"], ""], "Kosovo"],
        kosovo,
        ["==", ["coalesce", ["get", "name:en"], ["get", "name"], ""], "Palestine"],
        palestine,
        ["==", ["coalesce", ["get", "name:en"], ["get", "name"], ""], "Western Sahara"],
        wSahara,
        ["==", ["coalesce", ["get", "name:en"], ["get", "name"], ""], "Falkland Islands"],
        falklands,
        ["var", "cleaned"],
      ],
    ],
  ];
}

function buildCountriesGeoJson(features: CountryFeature[]): FeatureCollection<Geometry> {
  return {
    type: "FeatureCollection",
    features: features.map(country => ({
      type: "Feature",
      id: String(country.id),
      properties: {
        _seamId: String(country.id),
        name: country.properties.name,
      },
      geometry: clipAntimeridianIfNeeded(country.geometry),
    })),
  };
}

function buildGraticuleGeoJson(): FeatureCollection<Geometry> {
  const features: FeatureCollection<Geometry>["features"] = [];
  for (let lon = -180; lon < 180; lon += 15) {
    const coords: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 5) coords.push([lon, lat]);
    features.push({
      type: "Feature",
      properties: { kind: lon === 0 ? "prime" : "meridian" },
      geometry: { type: "LineString", coordinates: coords },
    });
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 5) coords.push([lon, lat]);
    features.push({
      type: "Feature",
      properties: { kind: lat === 0 ? "equator" : "parallel" },
      geometry: { type: "LineString", coordinates: coords },
    });
  }
  return { type: "FeatureCollection", features };
}

function getInteractiveOverlayLayers(viewport?: GlobeViewportSize): LayerSpecification[] {
  const specs = buildGlobeClusterPaintSpecs(
    computeGlobeClusterSizing(
      viewport?.width ?? DEFAULT_VIEWPORT_WIDTH,
      viewport?.height ?? DEFAULT_VIEWPORT_HEIGHT,
    ),
  );

  return [
    {
      id: "seam-locked-fill",
      type: "fill",
      source: "seam-countries",
      filter: ["==", ["get", "_seamId"], ""],
      paint: {
        "fill-color": "#c49a45",
        "fill-opacity": 0.18,
      },
    },
    {
      id: "seam-clusters-hit",
      type: "circle",
      source: "seam-clusters",
      paint: {
        // Generous invisible pointer/touch hit target around the golden coordinate dot.
        "circle-radius": specs.hitRadius,
        "circle-color": "#c49a45",
        "circle-opacity": 0,
        "circle-stroke-width": 0,
      },
    },
    {
      id: "seam-clusters-halo",
      type: "circle",
      source: "seam-clusters",
      paint: {
        "circle-radius": specs.haloRadius,
        "circle-color": "#dfb53d",
        "circle-opacity": specs.haloOpacity,
        "circle-stroke-width": 0,
      },
    },
    {
      id: "seam-clusters-core",
      type: "circle",
      source: "seam-clusters",
      paint: {
        "circle-radius": specs.coreRadius,
        "circle-color": ["case", ["boolean", ["get", "hovered"], false], "#997223", "#c49a45"],
        "circle-opacity": specs.coreOpacity,
        "circle-blur": 0,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": specs.coreStrokeOpacity,
        "circle-stroke-width": specs.coreStrokeWidth,
      },
    },
  ];
}

function buildCountryUnFilter(baseFilter: unknown): unknown {
  const isoExclusion = [
    "!",
    ["in", ["coalesce", ["get", "iso_a2"], ""], ["literal", UN_EXCLUDED_COUNTRY_ISO_CODES]],
  ];
  const nameExclusion = [
    "!",
    ["in", ["coalesce", ["get", "name:en"], ["get", "name"], ""], ["literal", UN_EXCLUDED_COUNTRY_NAMES]],
  ];
  return baseFilter ? ["all", baseFilter, isoExclusion, nameExclusion] : ["all", isoExclusion, nameExclusion];
}

/**
 * Appends dynamic per-frame country name exclusions (e.g. labels touching the globe limb)
 * on top of a country label layer's base UN-compliant filter without mutating it.
 */
export function appendCountryNameExclusionFilter(
  baseFilter: unknown,
  excludedNames: readonly string[],
): unknown {
  if (excludedNames.length === 0) return baseFilter;
  const exclusion = [
    "!",
    ["in", ["coalesce", ["get", "name:en"], ["get", "name"], ""], ["literal", excludedNames]],
  ];
  return baseFilter ? ["all", baseFilter, exclusion] : exclusion;
}

function buildCeasefireCondition(): ExpressionSpecification {
  const dname: ExpressionSpecification = ["coalesce", ["get", "disputed_name"], ""];
  const lCode: ExpressionSpecification = ["coalesce", ["get", "adm0_l"], ""];
  const rCode: ExpressionSpecification = ["coalesce", ["get", "adm0_r"], ""];
  return [
    "any",
    [">=", ["index-of", "Kashmir", dname], 0],
    [">=", ["index-of", "Line of Control", dname], 0],
    [">=", ["index-of", "Siachen", dname], 0],
    [">=", ["index-of", "Cyprus", dname], 0],
    [">=", ["index-of", "DMZ", dname], 0],
    [">=", ["index-of", "Golan", dname], 0],
    [">=", ["index-of", "UNDOF", dname], 0],
    [
      "all",
      ["in", lCode, ["literal", ["IND", "PAK"]]],
      ["in", rCode, ["literal", ["IND", "PAK"]]],
    ],
    [
      "all",
      ["in", lCode, ["literal", ["KOR", "PRK"]]],
      ["in", rCode, ["literal", ["KOR", "PRK"]]],
    ],
  ];
}

function restylePositronLayers(
  rawLayers: LayerSpecification[],
  language: Language,
  includeBackground: boolean,
): LayerSpecification[] {
  const localizedLabelExpr = getLocalizedLabelExpression(language);
  const countryLabelExpr = getCountryLabelExpression(language);
  const ceasefireCond = buildCeasefireCondition();
  const restyledLayers: LayerSpecification[] = [];

  for (const layer of rawLayers) {
    if (layer.type === "background") {
      if (!includeBackground) continue;
      restyledLayers.push({
        ...layer,
        paint: { ...(layer.paint || {}), "background-color": "#fcfbf7" },
      });
      continue;
    }

    if (layer.id === "water" && layer.type === "fill") {
      restyledLayers.push({
        ...layer,
        paint: {
          ...(layer.paint || {}),
          "fill-color": "#e6eef6",
          "fill-outline-color": "#d4e0ec",
        },
      });
      continue;
    }

    // Settled international boundaries (OpenMapTiles excludes disputed=1 and claimed_by)
    if (layer.id === "boundary_2" && layer.type === "line") {
      restyledLayers.push({
        ...layer,
        paint: {
          ...(layer.paint || {}),
          "line-color": "#cfc8bc",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.48, 3, 0.68, 6, 0.8],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.45, 3, 0.72, 6, 1.15],
          "line-blur": 0.15,
        },
      });
      continue;
    }

    // Provincial / sub-national boundaries stay hidden until a user actively clicks a country
    if (layer.id === "boundary_3" && layer.type === "line") {
      restyledLayers.push({
        ...layer,
        minzoom: 2.5,
        layout: {
          ...(layer.layout || {}),
          visibility: "none",
        },
        paint: {
          ...(layer.paint || {}),
          "line-color": "#dcd6ca",
          "line-dasharray": [2.5, 2],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 2.5, 0.25, 5, 0.52],
          "line-width": ["interpolate", ["linear"], ["zoom"], 2.5, 0.4, 6, 0.75],
        },
      });
      continue;
    }

    // UN Map No. 4170: dashed lines for disputed/undefined borders, dotted lines for ceasefire/LoC
    if (layer.id === "boundary_disputed" && layer.type === "line") {
      const baseFilter = "filter" in layer ? layer.filter : ["==", ["get", "disputed"], 1];
      restyledLayers.push({
        ...layer,
        filter: ["all", baseFilter, ["!", ceasefireCond]] as typeof layer.filter,
        paint: {
          ...(layer.paint || {}),
          "line-color": "#a89d8c",
          "line-dasharray": [4.2, 2.5],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.56, 4, 0.76],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 5, 0.95],
        },
      });
      restyledLayers.push({
        ...layer,
        id: "boundary_un_ceasefire",
        filter: ["all", baseFilter, ceasefireCond] as typeof layer.filter,
        paint: {
          ...(layer.paint || {}),
          "line-color": "#9b907f",
          "line-dasharray": [1.1, 2.2],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.65, 4, 0.85],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.65, 5, 1.05],
        },
      });
      continue;
    }

    if (layer.type === "symbol" && (layer.id.startsWith("label_") || layer.id.includes("water_name"))) {
      const isCountry = layer.id.startsWith("label_country");
      const isCountry2 = layer.id === "label_country_2";
      const isCountry3 = layer.id === "label_country_3";
      const isState = layer.id === "label_state";
      const isCity = layer.id === "label_city" || layer.id === "label_city_capital";
      const isWaterPoint = layer.id === "water_name_point_label";

      if (isCountry) {
        const minzoom = isCountry3 ? 2.3 : isCountry2 ? 1.6 : 1.25;
        // Hide country names when zoomed out small (< 1.3..2.3), keep visible across all zoom-in scales.
        const countryTextSize = ["interpolate", ["linear"], ["zoom"], 1.3, 10.5, 3, 11.5, 6, 13];
        const countryTextOpacity = isCountry3
          ? ["interpolate", ["linear"], ["zoom"], 2.3, 0, 2.75, 0.88]
          : isCountry2
            ? ["interpolate", ["linear"], ["zoom"], 1.6, 0, 1.95, 0.88]
            : ["interpolate", ["linear"], ["zoom"], 1.3, 0, 1.65, 0.88];

        const existingFilter = "filter" in layer ? layer.filter : undefined;
        restyledLayers.push({
          ...layer,
          minzoom,
          maxzoom: 9,
          filter: buildCountryUnFilter(existingFilter) as typeof layer.filter,
          layout: {
            ...(layer.layout || {}),
            visibility: "visible",
            "text-field": countryLabelExpr as unknown as string,
            "text-font": ["Noto Sans Regular"],
            "text-letter-spacing": 0.1,
            "text-max-width": 11,
            "text-padding": 9,
            "text-transform": language === "en" ? "uppercase" : "none",
            "text-size": countryTextSize as unknown as number,
          },
          paint: {
            ...(layer.paint || {}),
            "text-color": "#615a50",
            "text-opacity": countryTextOpacity as unknown as number,
            "text-halo-color": "rgba(252, 251, 247, 0.95)",
            "text-halo-width": 1.8,
            "text-halo-blur": 0.7,
          },
        });
        continue;
      }

      if (isState) {
        restyledLayers.push({
          ...layer,
          minzoom: 3.5,
          layout: {
            ...(layer.layout || {}),
            visibility: "none",
            "text-field": localizedLabelExpr as unknown as string,
            "text-font": ["Noto Sans Italic"],
            "text-letter-spacing": 0.16,
            "text-max-width": 10,
            "text-padding": 6,
            "text-transform": language === "en" ? "uppercase" : "none",
            "text-size": ["interpolate", ["linear"], ["zoom"], 3.5, 9, 7, 11.5] as unknown as number,
          },
          paint: {
            ...(layer.paint || {}),
            "text-color": "#8c8374",
            "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.5, 0, 4.3, 0.82] as unknown as number,
            "text-halo-color": "rgba(252, 251, 247, 0.92)",
            "text-halo-width": 1.5,
            "text-halo-blur": 0.5,
          },
        });
        continue;
      }

      if (isCity) {
        restyledLayers.push({
          ...layer,
          minzoom: 3,
          layout: {
            ...(layer.layout || {}),
            visibility: "none",
            "text-field": localizedLabelExpr as unknown as string,
            "text-padding": 6,
            "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9.5, 7, 12] as unknown as number,
          },
          paint: {
            ...(layer.paint || {}),
            "text-color": "#6e675b",
            "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 3.8, 0.86] as unknown as number,
            "text-halo-color": "rgba(252, 251, 247, 0.92)",
            "text-halo-width": 1.5,
            "text-halo-blur": 0.5,
          },
        });
        continue;
      }

      if (isWaterPoint) {
        restyledLayers.push({
          ...layer,
          layout: {
            ...(layer.layout || {}),
            visibility: "none",
            "text-field": localizedLabelExpr as unknown as string,
            "text-font": ["Noto Sans Italic"],
            "text-letter-spacing": 0.2,
            "text-max-width": 10,
            "text-padding": 12,
            "text-size": ["interpolate", ["linear"], ["zoom"], 0.8, 9, 4, 11.5, 8, 13] as unknown as number,
          },
          paint: {
            ...(layer.paint || {}),
            "text-color": "#788ea3",
            "text-opacity": 0.72,
            "text-halo-color": "rgba(232, 239, 245, 0.9)",
            "text-halo-width": 1.6,
            "text-halo-blur": 0.6,
          },
        });
        continue;
      }

      // Hide towns, villages, rivers, and other micro labels
      restyledLayers.push({
        ...layer,
        layout: {
          ...(layer.layout || {}),
          visibility: "none",
        },
      });
      continue;
    }

    // Suppress urban infrastructure, roads, rails, parks, landcover fills, and POI shields on the archival globe
    restyledLayers.push({
      ...layer,
      layout: {
        ...(layer.layout || {}),
        visibility: "none",
      },
    } as LayerSpecification);
  }

  return restyledLayers;
}

function harmonizePositronStyle(
  rawStyle: StyleSpecification,
  features: CountryFeature[],
  language: Language,
  viewport?: GlobeViewportSize,
): StyleSpecification {
  const restyledLayers = restylePositronLayers(rawStyle.layers || [], language, true);
  const [lockedFillLayer, ...clusterLayers] = getInteractiveOverlayLayers(viewport);
  const bgIdx = restyledLayers.findIndex(layer => layer.type === "background");
  const mergedLayers =
    bgIdx >= 0
      ? [
          ...restyledLayers.slice(0, bgIdx + 1),
          lockedFillLayer,
          ...restyledLayers.slice(bgIdx + 1),
          ...clusterLayers,
        ]
      : [lockedFillLayer, ...restyledLayers, ...clusterLayers];

  return {
    ...rawStyle,
    projection: { type: "globe" },
    sky: {
      "sky-color": "#ffffff",
      "horizon-color": "#ffffff",
      "fog-color": "#ffffff",
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.14, 5, 0.04, 10, 0],
    },
    sources: {
      ...rawStyle.sources,
      "seam-countries": {
        type: "geojson",
        data: buildCountriesGeoJson(features),
      },
      "seam-clusters": {
        type: "geojson",
        data: EMPTY_GEOJSON,
      },
    },
    layers: mergedLayers,
  };
}

export function buildLocalPorcelainFallbackStyle(
  features: CountryFeature[],
  viewport?: GlobeViewportSize,
): StyleSpecification {
  return {
    version: 8,
    projection: { type: "globe" },
    sky: {
      "sky-color": "#ffffff",
      "horizon-color": "#ffffff",
      "fog-color": "#ffffff",
      "atmosphere-blend": 0.14,
    },
    sources: {
      "seam-graticule": {
        type: "geojson",
        data: buildGraticuleGeoJson(),
      },
      "seam-countries": {
        type: "geojson",
        data: buildCountriesGeoJson(features),
      },
      "seam-clusters": {
        type: "geojson",
        data: EMPTY_GEOJSON,
      },
    },
    layers: [
      {
        id: "seam-ocean-bg",
        type: "background",
        paint: { "background-color": "#e8eff5" },
      },
      {
        id: "seam-graticule-lines",
        type: "line",
        source: "seam-graticule",
        paint: {
          "line-color": ["case", ["==", ["get", "kind"], "equator"], "#c49a45", "#9fb0c2"],
          "line-opacity": ["case", ["==", ["get", "kind"], "equator"], 0.28, 0.2],
          "line-width": 0.75,
        },
      },
      {
        id: "seam-land-halo",
        type: "line",
        source: "seam-countries",
        paint: {
          "line-color": "#d0dce8",
          "line-width": 3,
          "line-opacity": 0.45,
        },
      },
      {
        id: "seam-land-fill",
        type: "fill",
        source: "seam-countries",
        paint: {
          "fill-color": "#fcfbf7",
          "fill-antialias": true,
        },
      },
      {
        id: "seam-country-borders",
        type: "line",
        source: "seam-countries",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#c8c1b4",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.65, 5, 1.15],
          "line-opacity": 0.65,
        },
      },
      ...getInteractiveOverlayLayers(viewport),
    ],
  };
}

let positronBaseCache: Promise<StyleSpecification | null> | null = null;

function fetchPositronBaseStyle(): Promise<StyleSpecification | null> {
  if (positronBaseCache) return positronBaseCache;
  positronBaseCache = fetch("https://tiles.openfreemap.org/styles/positron", {
    signal: AbortSignal.timeout(4500),
  })
    .then(async res => {
      if (!res.ok) return null;
      return (await res.json()) as StyleSpecification;
    })
    .catch(() => null);
  return positronBaseCache;
}

if (typeof window !== "undefined") {
  void fetchPositronBaseStyle();
}

/**
 * Loads OpenFreeMap Positron's native multi-LOD vector globe harmonized to The Seam's
 * porcelain & antique-gold palette, falling back to local GeoJSON only when offline.
 */
export async function loadArchiveGlobeStyle(
  features: CountryFeature[],
  language: Language,
  viewport?: GlobeViewportSize,
): Promise<StyleSpecification> {
  const base = await fetchPositronBaseStyle();
  if (base) {
    return harmonizePositronStyle(base, features, language, viewport);
  }
  return buildLocalPorcelainFallbackStyle(features, viewport);
}
