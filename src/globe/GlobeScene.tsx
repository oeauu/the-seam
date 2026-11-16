import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { geoArea, geoCentroid, geoContains } from "d3";
import type { CountryFeature, WorldData } from "../geo/geoTypes";
import type { ArchiveRecord, Language, LocationCluster } from "../types";
import { latLngToVector3, vector3ToLatLng } from "../geo/worldGeometry";
import {
  COUNTRY_LABEL_LAYER_IDS,
  GLOBE_CONTEXT_LAYER_IDS,
  MAX_GLOBE_ZOOM,
  MIN_GLOBE_ZOOM,
  appendCountryNameExclusionFilter,
  getCountryLabelExpression,
  getDefaultGlobeZoomForViewport,
  getLocalizedLabelExpression,
  loadArchiveGlobeStyle,
  syncGlobeClusterLayerSizing,
} from "../geo/maplibreStyle";
import { findCountryAtPoint, getCountryMetadataForFeature } from "../geo/countryLookup";
import { getUNTerritoryInfo, UN_MAP_DISCLAIMER } from "../geo/unStandards";
import { CITY_CLUSTER_RADIUS_KM, clusterRecords } from "../geo/clustering";
import { getRecordNameplateNames } from "../data/recordStatus";
import { useApp } from "../state/useApp";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface GlobeContentProps {
  worldData: WorldData;
  onCountryClick: (country: CountryFeature) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

type NameplateDir = "right" | "up" | "left" | "down";

// Smoothstep nameplate visibility based on S = globeScreenDiameter / min(viewportWidth, viewportHeight).
const GLOBE_NAMEPLATE_S_MIN = 1.15;
const GLOBE_NAMEPLATE_S_MAX = 1.5;
const GLOBE_NAMEPLATE_FADE_MS = 220;
const GLOBE_LIMB_MARGIN_PX = 6;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function estimateGlyphWidth(text: string, sizePx: number, wideFactor: number, narrowFactor: number): number {
  let wide = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x3000 && code <= 0x9fff) || (code >= 0xac00 && code <= 0xd7af) || (code >= 0xff00 && code <= 0xffef)) {
      wide++;
    }
  }
  const narrow = Math.max(0, text.length - wide);
  return wide * sizePx * wideFactor + narrow * sizePx * narrowFactor;
}

function queryDotClusterHit(instance: MapLibreMap, point: maplibregl.Point) {
  const layers = ["seam-clusters-hit", "seam-clusters-core", "seam-clusters-halo"];
  const direct = instance.queryRenderedFeatures(point, { layers });
  if (direct.length > 0) return direct;
  return instance.queryRenderedFeatures(
    [
      [point.x - 6, point.y - 6],
      [point.x + 6, point.y + 6],
    ],
    { layers },
  );
}
const COUNTRY_LIMB_SPECIAL_LABELS: Record<Language, Record<string, string>> = {
  zh: {
    FK: "福克兰群岛（马尔维纳斯群岛）",
    PS: "巴勒斯坦国",
    EH: "西撒哈拉（非自治领土）",
    XK: "科索沃（安理会第1244号决议）",
  },
  en: {
    FK: "Falkland Islands (Malvinas)",
    PS: "State of Palestine",
    EH: "Western Sahara",
    XK: "Kosovo (UNSCR 1244)",
  },
};

function getDefaultGlobeZoom(container: HTMLElement): number {
  return getDefaultGlobeZoomForViewport(container.clientWidth, container.clientHeight);
}

function getLockedCountryZoom(country: CountryFeature, baseZoom: number): number {
  const area = Math.max(0.0005, geoArea(country));
  const boost = area > 0.04 ? 1.15 : area > 0.008 ? 1.75 : 2.35;
  return Math.min(5.2, Math.max(baseZoom + 0.9, baseZoom + boost));
}

function getClusterTargetLatLng(country: CountryFeature): [number, number] {
  const meta = getCountryMetadataForFeature(country);
  if (meta?.center && geoContains(country, meta.center)) return meta.center;
  const c = geoCentroid(country);
  if (Number.isFinite(c[0]) && Number.isFinite(c[1])) return [c[0], c[1]];
  return [0, 0];
}

function countCountryRecords(country: CountryFeature, records: ArchiveRecord[]): number {
  return records.filter(record => {
    const coords = record.place.coordinates;
    return coords ? geoContains(country, [coords.longitude, coords.latitude]) : false;
  }).length;
}

function dotOnSphere(lonA: number, latA: number, lonB: number, latB: number): number {
  const va = latLngToVector3(latA, lonA, 1);
  const vb = latLngToVector3(latB, lonB, 1);
  return va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
}

function syncGlobeContextLayers(map: MapLibreMap, showContext: boolean): void {
  const visibility = showContext ? "visible" : "none";
  for (const layerId of GLOBE_CONTEXT_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.setLayoutProperty(layerId, "visibility", visibility);
    } catch {
      // Ignore layer visibility sync race during style reload
    }
  }
}

function isPixelOnGlobe(map: MapLibreMap, x: number, y: number): boolean {
  try {
    const ll = map.unproject([x, y]);
    const rp = map.project(ll);
    return Number.isFinite(rp.x) && Number.isFinite(rp.y) && Math.hypot(rp.x - x, rp.y - y) < 2;
  } catch {
    return false;
  }
}

function measureGlobeScreenRadius(map: MapLibreMap, width: number, height: number): number | null {
  const cx = width / 2;
  const cy = height / 2;
  const maxCornerDist = Math.hypot(cx, cy) + 80;
  // Once zoomed in far enough that the globe disc covers every viewport corner, no outer limb is visible.
  if (isPixelOnGlobe(map, cx + maxCornerDist, cy)) {
    return null;
  }
  let lo = 0;
  let hi = maxCornerDist;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (isPixelOnGlobe(map, cx + mid, cy)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function resolveCountryDisplayLabel(props: Record<string, unknown>, language: Language): string {
  const iso = String(props.iso_a2 || "");
  const enName = String(props["name:en"] || props.name || "");
  const special = COUNTRY_LIMB_SPECIAL_LABELS[language];
  if (iso && iso in special) return special[iso];
  if (enName === "Falkland Islands") return special.FK;
  if (enName === "Palestine") return special.PS;
  if (enName === "Western Sahara") return special.EH;
  if (enName === "Kosovo") return special.XK;

  const raw =
    language === "zh"
      ? String(props["name:zh-Hans"] || props["name:zh"] || props["name:latin"] || props.name || "")
      : String(props["name:en"] || props["name:latin"] || props.name || "");
  const slashIdx = raw.indexOf("/");
  return (slashIdx >= 0 ? raw.slice(0, slashIdx) : raw).trim();
}

function estimateCountryLabelHalfBox(
  props: Record<string, unknown>,
  zoom: number,
  language: Language,
): { halfW: number; halfH: number } {
  const label = resolveCountryDisplayLabel(props, language);
  const fontSize =
    zoom <= 1.3
      ? 10.5
      : zoom <= 3
        ? 10.5 + ((zoom - 1.3) / 1.7) * 1.0
        : zoom <= 6
          ? 11.5 + ((zoom - 3) / 3) * 1.5
          : 13;

  let cjkCount = 0;
  for (let i = 0; i < label.length; i++) {
    const code = label.charCodeAt(i);
    if ((code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)) {
      cjkCount++;
    }
  }
  const otherCount = Math.max(0, label.length - cjkCount);
  const rawW = cjkCount * fontSize * 1.15 + otherCount * fontSize * (language === "en" ? 0.78 : 0.65);
  const maxLineW = fontSize * 11;
  const lines = rawW > maxLineW ? Math.min(3, Math.ceil(rawW / maxLineW)) : 1;

  return {
    halfW: Math.min(rawW, maxLineW) * 0.5 + 8,
    halfH: lines * fontSize * 0.65 + 6,
  };
}

export function GlobeScene({ worldData, onCountryClick, onClusterClick }: GlobeContentProps) {
  const { globeCameraPosition, setGlobeCameraPosition, globeFocus, focusGlobe, language, visibleRecords } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const nameplateRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const projectedCoordsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const [ready, setReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const [lockedCountry, setLockedCountry] = useState<CountryFeature | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [unNoticeOpen, setUnNoticeOpen] = useState(false);
  const [showNameplates, setShowNameplates] = useState(false);
  const [nameplateDirs, setNameplateDirs] = useState<Record<string, NameplateDir>>({});

  // Keep latest callbacks/state cleanly accessible inside native MapLibre event listeners
  const onCountryClickRef = useRef(onCountryClick);
  const onClusterClickRef = useRef(onClusterClick);
  const lockedCountryRef = useRef(lockedCountry);
  const worldDataRef = useRef(worldData);
  const clustersRef = useRef<LocationCluster[]>([]);
  const languageRef = useRef(language);
  const setGlobeCamPosRef = useRef(setGlobeCameraPosition);
  const hoveredIdRef = useRef(hoveredClusterId);
  const showNameplatesRef = useRef(false);
  const nameplateOpacityRef = useRef(0);
  const fadeOutTimerRef = useRef<number>(0);
  const lastDirZoomRef = useRef(1.4);
  const initialCamRef = useRef(globeCameraPosition);
  const lastLayoutKeyRef = useRef("");
  const lastFocusTokenRef = useRef(globeFocus?.token);
  const baseCountryFiltersRef = useRef<Record<string, unknown>>({});
  const lastLimbExcludedKeyRef = useRef<string | null>(null);
  const cachedGlobeRadiusRef = useRef<{ key: string; radius: number | null } | null>(null);
  const cachedCountryPlacesRef = useRef<Array<{ lng: number; lat: number; filterKey: string; props: Record<string, unknown> }>>([]);
  const limbSyncTimerRef = useRef<number>(0);
  const lastClusterSizingKeyRef = useRef("");

  useEffect(() => {
    const el = overlayRef.current;
    if (!showNameplates || !el) return;
    el.style.opacity = "0";
    const raf = requestAnimationFrame(() => {
      if (overlayRef.current === el) {
        el.style.opacity = String(nameplateOpacityRef.current);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [showNameplates]);

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
    onClusterClickRef.current = onClusterClick;
    lockedCountryRef.current = lockedCountry;
    worldDataRef.current = worldData;
    languageRef.current = language;
    setGlobeCamPosRef.current = setGlobeCameraPosition;
    hoveredIdRef.current = hoveredClusterId;
  });

  const clusters = useMemo(() => clusterRecords(visibleRecords, CITY_CLUSTER_RADIUS_KM), [visibleRecords]);
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  const refreshCountryPlaceCache = useCallback((map: MapLibreMap) => {
    if (!map.getSource("openmaptiles")) return;
    const features = map.querySourceFeatures("openmaptiles", {
      sourceLayer: "place",
      filter: ["==", ["get", "class"], "country"],
    });
    const seen = new Set<string>();
    const next: Array<{ lng: number; lat: number; filterKey: string; props: Record<string, unknown> }> = [];
    for (const feature of features) {
      const coords =
        feature.geometry.type === "Point"
          ? feature.geometry.coordinates
          : feature.geometry.type === "MultiPoint"
            ? feature.geometry.coordinates[0]
            : null;
      if (!coords || coords.length < 2) continue;
      const props = (feature.properties || {}) as Record<string, unknown>;
      const filterKey = String(props["name:en"] || props.name || "");
      if (!filterKey) continue;
      const dedupeKey = `${filterKey}@${Math.round(coords[0] * 10)},${Math.round(coords[1] * 10)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      next.push({ lng: coords[0], lat: coords[1], filterKey, props });
    }
    cachedCountryPlacesRef.current = next;
  }, []);

  const getCachedGlobeScreenRadius = useCallback((map: MapLibreMap, width: number, height: number): number | null => {
    const zoom = map.getZoom();
    const radiusCacheKey = `${Math.round(zoom * 100)}_${width}x${height}`;
    if (cachedGlobeRadiusRef.current?.key === radiusCacheKey) {
      return cachedGlobeRadiusRef.current.radius;
    }
    const radiusPx = measureGlobeScreenRadius(map, width, height);
    cachedGlobeRadiusRef.current = { key: radiusCacheKey, radius: radiusPx };
    return radiusPx;
  }, []);

  const syncCountryLimbClipping = useCallback((map: MapLibreMap) => {
    const container = mapContainerRef.current;
    if (!container || !map.getSource("openmaptiles")) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const zoom = map.getZoom();
    const radiusPx = getCachedGlobeScreenRadius(map, width, height);

    const excludedSet = new Set<string>();
    if (radiusPx !== null && radiusPx > 0) {
      if (cachedCountryPlacesRef.current.length === 0) {
        refreshCountryPlaceCache(map);
      }
      const cx = width / 2;
      const cy = height / 2;
      const center = map.getCenter();
      const lang = languageRef.current;

      for (const item of cachedCountryPlacesRef.current) {
        const dot = dotOnSphere(item.lng, item.lat, center.lng, center.lat);
        if (dot < -0.1) continue;
        if (dot < 0.04) {
          excludedSet.add(item.filterKey);
          continue;
        }
        const pt = map.project([item.lng, item.lat]);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;

        const { halfW, halfH } = estimateCountryLabelHalfBox(item.props, zoom, lang);
        const cornerDist = Math.hypot(Math.abs(pt.x - cx) + halfW, Math.abs(pt.y - cy) + halfH);
        if (cornerDist > radiusPx - GLOBE_LIMB_MARGIN_PX) {
          excludedSet.add(item.filterKey);
        }
      }
    }

    const excludedNames = Array.from(excludedSet).sort();
    const excludedKey = excludedNames.join("\0");
    if (excludedKey === lastLimbExcludedKeyRef.current) return;
    lastLimbExcludedKeyRef.current = excludedKey;

    for (const layerId of COUNTRY_LABEL_LAYER_IDS) {
      if (!map.getLayer(layerId)) continue;
      const baseFilter = baseCountryFiltersRef.current[layerId];
      map.setFilter(layerId, appendCountryNameExclusionFilter(baseFilter, excludedNames) as never);
    }
  }, [getCachedGlobeScreenRadius, refreshCountryPlaceCache]);

  const updateNameplateDOM = useCallback((recomputeDirs: boolean) => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const radiusPx = getCachedGlobeScreenRadius(map, width, height);
    const minSide = Math.max(1, Math.min(width, height));
    const scaleRatio = radiusPx === null ? 2.0 : (2 * radiusPx) / minSide;
    const nextAlpha = smoothstep(GLOBE_NAMEPLATE_S_MIN, GLOBE_NAMEPLATE_S_MAX, scaleRatio);
    const shouldShowNameplates = scaleRatio > GLOBE_NAMEPLATE_S_MIN && nextAlpha > 0.001;

    if (shouldShowNameplates) {
      if (fadeOutTimerRef.current) {
        window.clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = 0;
      }
      nameplateOpacityRef.current = nextAlpha;
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(nextAlpha);
        overlayRef.current.classList.remove("is-fading-out");
      }
      if (!showNameplatesRef.current) {
        showNameplatesRef.current = true;
        setShowNameplates(true);
        lastLayoutKeyRef.current = "";
      }
    } else {
      nameplateOpacityRef.current = 0;
      if (overlayRef.current) {
        overlayRef.current.style.opacity = "0";
        overlayRef.current.classList.add("is-fading-out");
      }
      if (showNameplatesRef.current) {
        showNameplatesRef.current = false;
        if (fadeOutTimerRef.current) window.clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = window.setTimeout(() => {
          fadeOutTimerRef.current = 0;
          if (!showNameplatesRef.current) {
            setShowNameplates(false);
          }
        }, GLOBE_NAMEPLATE_FADE_MS);
      }
      return;
    }

    const visibleItems: Array<{ cluster: LocationCluster; x: number; y: number }> = [];

    for (const cluster of clustersRef.current) {
      const el = nameplateRefs.current.get(cluster.id);
      const { longitude, latitude } = cluster.coordinates;
      const hemisphereDot = dotOnSphere(longitude, latitude, center.lng, center.lat);
      if (hemisphereDot < 0.02) {
        if (el) el.style.visibility = "hidden";
        continue;
      }

      const pt = map.project([longitude, latitude]);
      if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 16 || pt.x > width - 16 || pt.y < 16 || pt.y > height - 16) {
        if (el) el.style.visibility = "hidden";
        continue;
      }

      // Exact perspective-horizon check: if MapLibre wrapped a back-horizon point onto the
      // visible disc, unprojecting its screen pixel will land at a different coordinate.
      let onVisibleSurface = false;
      try {
        const unprojected = map.unproject([pt.x, pt.y]);
        onVisibleSurface = dotOnSphere(unprojected.lng, unprojected.lat, longitude, latitude) > 0.999;
      } catch {
        onVisibleSurface = false;
      }
      if (!onVisibleSurface) {
        if (el) el.style.visibility = "hidden";
        continue;
      }

      const rx = Math.round(pt.x);
      const ry = Math.round(pt.y);
      projectedCoordsRef.current.set(cluster.id, { x: rx, y: ry });
      if (el) {
        el.style.translate = `${rx}px ${ry}px`;
        el.style.visibility = "visible";
      }
      visibleItems.push({ cluster, x: rx, y: ry });
    }

    if (!recomputeDirs) return;

    lastDirZoomRef.current = zoom;
    const lang = languageRef.current;
    const layoutKey = `${visibleItems.map(i => `${i.cluster.id}:${Math.round(i.x / 10)},${Math.round(i.y / 10)}`).join("|")}_${Math.round(zoom * 4)}_${lang}`;
    if (layoutKey === lastLayoutKeyRef.current) return;
    lastLayoutKeyRef.current = layoutKey;

    const placedBoxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [];
    const nextDirs: Record<string, NameplateDir> = {};
    const sorted = [...visibleItems].sort((a, b) => b.cluster.records.length - a.cluster.records.length);

    for (const { cluster, x, y } of sorted) {
      const { primaryTitle, secondaryTitle } = getRecordNameplateNames(cluster.records[0], lang);
      const primaryW = estimateGlyphWidth(primaryTitle, 11.5, 1.08, 0.65);
      const secondaryW = secondaryTitle ? estimateGlyphWidth(secondaryTitle, 10.5, 1.06, 0.64) : 0;
      const boxW = Math.min(204, Math.max(82, Math.max(primaryW, secondaryW) + 32));
      const boxH = secondaryTitle ? 40 : 28;

      const tryDirs: NameplateDir[] = [
        x > width - 210 ? "left" : "right",
        y < 76 ? "down" : "up",
        x > width - 210 ? "right" : "left",
        y < 76 ? "up" : "down",
      ];

      for (const dir of tryDirs) {
        const box =
          dir === "right"
            ? { minX: x + 10, minY: y - boxH / 2, maxX: x + 10 + boxW, maxY: y + boxH / 2 }
            : dir === "left"
              ? { minX: x - 10 - boxW, minY: y - boxH / 2, maxX: x - 10, maxY: y + boxH / 2 }
              : dir === "up"
                ? { minX: x - boxW / 2, minY: y - 10 - boxH, maxX: x + boxW / 2, maxY: y - 10 }
                : { minX: x - boxW / 2, minY: y + 10, maxX: x + boxW / 2, maxY: y + 10 + boxH };

        if (box.minX < 8 || box.maxX > width - 8 || box.minY < 8 || box.maxY > height - 8) continue;

        const collides = placedBoxes.some(
          other => !(box.maxX < other.minX || box.minX > other.maxX || box.maxY < other.minY || box.minY > other.maxY),
        );
        if (!collides) {
          placedBoxes.push(box);
          nextDirs[cluster.id] = dir;
          break;
        }
      }
    }

    setNameplateDirs(nextDirs);
  }, [getCachedGlobeScreenRadius]);

  // Initialize MapLibre GL JS 3D Globe directly with Positron's native multi-LOD vector
  // coastlines, national borders, and provincial subdivisions (with offline GeoJSON fallback).
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let disposed = false;
    let map: MapLibreMap | null = null;
    let readyTimer = 0;

    void loadArchiveGlobeStyle(worldData.features, languageRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
    }).then(style => {
      if (disposed || !mapContainerRef.current) return;

      const [initLat, initLng] = vector3ToLatLng(...initialCamRef.current);
      const initialZoom = getDefaultGlobeZoom(container);

      const instance = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [initLng, initLat],
        zoom: initialZoom,
        minZoom: MIN_GLOBE_ZOOM,
        maxZoom: MAX_GLOBE_ZOOM,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 40,
        attributionControl: false,
        localIdeographFontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Yu Gothic UI", "Malgun Gothic", sans-serif',
        canvasContextAttributes: { antialias: true, powerPreference: "high-performance" },
      });
      map = instance;

      instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      mapRef.current = instance;

      let readyMarked = false;
      const markReady = () => {
        if (disposed || readyMarked) return;
        readyMarked = true;
        setReady(true);
        syncCountryLimbClipping(instance);
        requestAnimationFrame(() => updateNameplateDOM(true));
      };

      const scheduleLimbClipSync = () => {
        if (limbSyncTimerRef.current) return;
        limbSyncTimerRef.current = window.setTimeout(() => {
          limbSyncTimerRef.current = 0;
          if (!disposed) syncCountryLimbClipping(instance);
        }, 75);
      };

      const flushLimbClipSync = () => {
        if (limbSyncTimerRef.current) {
          window.clearTimeout(limbSyncTimerRef.current);
          limbSyncTimerRef.current = 0;
        }
        syncCountryLimbClipping(instance);
      };

      const syncClusterSizing = () => {
        const activeContainer = mapContainerRef.current;
        if (!activeContainer) return;
        const w = activeContainer.clientWidth;
        const h = activeContainer.clientHeight;
        if (w <= 0 || h <= 0) return;
        const sizingKey = `${w}x${h}`;
        if (sizingKey === lastClusterSizingKeyRef.current) return;
        lastClusterSizingKeyRef.current = sizingKey;
        syncGlobeClusterLayerSizing(instance, w, h);
      };

      const handleStyleReady = () => {
        if (disposed) return;
        instance.setProjection({ type: "globe" });
        const capturedFilters: Record<string, unknown> = {};
        for (const layerId of COUNTRY_LABEL_LAYER_IDS) {
          if (instance.getLayer(layerId)) {
            capturedFilters[layerId] = instance.getFilter(layerId);
          }
        }
        baseCountryFiltersRef.current = capturedFilters;
        lastLimbExcludedKeyRef.current = null;
        lastClusterSizingKeyRef.current = "";
        cachedGlobeRadiusRef.current = null;
        cachedCountryPlacesRef.current = [];
        syncGlobeContextLayers(instance, Boolean(lockedCountryRef.current));
        syncClusterSizing();
        refreshCountryPlaceCache(instance);
        flushLimbClipSync();
        setStyleVersion(v => v + 1);
        requestAnimationFrame(() => updateNameplateDOM(true));
      };

      readyTimer = window.setTimeout(markReady, 2500);
      instance.on("style.load", handleStyleReady);
      instance.once("idle", markReady);
      instance.on("idle", () => {
        refreshCountryPlaceCache(instance);
        flushLimbClipSync();
      });
      instance.on("sourcedata", e => {
        if (e.sourceId === "openmaptiles" && e.isSourceLoaded) {
          refreshCountryPlaceCache(instance);
          flushLimbClipSync();
        }
      });
      instance.on("resize", () => {
        syncClusterSizing();
        flushLimbClipSync();
        updateNameplateDOM(true);
      });
      instance.on("error", err => {
        console.warn("MapLibre warning:", err.error?.message || err);
      });

      instance.on("move", () => {
        const currentZoom = instance.getZoom();
        scheduleLimbClipSync();
        const zoomStepChanged = Math.abs(currentZoom - lastDirZoomRef.current) >= 0.25;
        updateNameplateDOM(zoomStepChanged);
      });

      instance.on("moveend", () => {
        flushLimbClipSync();
        updateNameplateDOM(true);
        const c = instance.getCenter();
        setGlobeCamPosRef.current(latLngToVector3(c.lat, c.lng, 6.5));
      });

      instance.on("mousemove", e => {
        if (e.originalEvent.buttons !== 0 || instance.isMoving()) return;
        if (!instance.getLayer("seam-clusters-core")) return;
        const hits = queryDotClusterHit(instance, e.point);
        if (hits.length > 0) {
          const cid = String(hits[0].properties?.clusterId || "");
          instance.getCanvas().style.cursor = "pointer";
          if (cid && hoveredIdRef.current !== cid) setHoveredClusterId(cid);
        } else {
          instance.getCanvas().style.cursor = "grab";
          if (hoveredIdRef.current !== null) setHoveredClusterId(null);
        }
      });

      instance.on("click", e => {
        // Priority 1: Direct click on golden archive dot (with padded radius for zoomed-out pins)
        if (instance.getLayer("seam-clusters-core")) {
          const dotHits = queryDotClusterHit(instance, e.point);
          if (dotHits.length > 0) {
            const cid = String(dotHits[0].properties?.clusterId || "");
            const target = clustersRef.current.find(c => c.id === cid);
            if (target) {
              onClusterClickRef.current(target);
              return;
            }
          }
        }

        // Reject clicks outside the visible globe limb sky
        if (!Number.isFinite(e.lngLat.lng) || !Number.isFinite(e.lngLat.lat)) {
          if (lockedCountryRef.current) setLockedCountry(null);
          return;
        }
        const reprojected = instance.project(e.lngLat);
        if (Math.hypot(reprojected.x - e.point.x, reprojected.y - e.point.y) > 12) {
          if (lockedCountryRef.current) setLockedCountry(null);
          return;
        }

        const country = findCountryAtPoint(worldDataRef.current.features, e.lngLat.lng, e.lngLat.lat);
        if (!country) {
          if (lockedCountryRef.current) setLockedCountry(null);
          return;
        }

        const currentLocked = lockedCountryRef.current;
        if (currentLocked && String(currentLocked.id) === String(country.id)) {
          const c = instance.getCenter();
          setGlobeCamPosRef.current(latLngToVector3(c.lat, c.lng, 6.5));
          onCountryClickRef.current(country);
          return;
        }

        setLockedCountry(country);
        const baseZoom = container ? getDefaultGlobeZoom(container) : 1.45;
        const targetCenter = getClusterTargetLatLng(country);
        instance.easeTo({
          center: targetCenter,
          zoom: getLockedCountryZoom(country, baseZoom),
          duration: 320,
          essential: true,
        });
      });
    });

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(limbSyncTimerRef.current);
      window.clearTimeout(fadeOutTimerRef.current);
      limbSyncTimerRef.current = 0;
      fadeOutTimerRef.current = 0;
      disposed = true;
      mapRef.current = null;
      map?.remove();
    };
  }, [worldData, updateNameplateDOM, syncCountryLimbClipping, refreshCountryPlaceCache]);

  // Sync dynamic archive clusters into MapLibre GPU circle layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleVersion === 0) return;
    const source = map.getSource("seam-clusters") as GeoJSONSource | undefined;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: clusters.map(cluster => ({
        type: "Feature",
        properties: {
          clusterId: cluster.id,
          count: cluster.records.length,
          hovered: hoveredClusterId === cluster.id,
        },
        geometry: {
          type: "Point",
          coordinates: [cluster.coordinates.longitude, cluster.coordinates.latitude],
        },
      })),
    });

    lastLayoutKeyRef.current = "";
    requestAnimationFrame(() => updateNameplateDOM(true));
  }, [clusters, hoveredClusterId, showNameplates, styleVersion, updateNameplateDOM]);

  // Sync soft golden country-lock highlight and contextual sub-national detail when a country is locked
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleVersion === 0) return;

    const lockId = lockedCountry ? String(lockedCountry.id) : "";
    if (map.getLayer("seam-locked-fill")) {
      map.setFilter("seam-locked-fill", ["==", ["get", "_seamId"], lockId]);
    }
    syncGlobeContextLayers(map, Boolean(lockedCountry));
  }, [lockedCountry, styleVersion]);

  // Live-switch basemap labels cleanly when user toggles ZH / EN
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleVersion === 0) return;

    languageRef.current = language;
    const countryExpr = getCountryLabelExpression(language);
    const localizedExpr = getLocalizedLabelExpression(language);

    for (const layer of map.getStyle().layers || []) {
      if (layer.type === "symbol" && (layer.id.startsWith("label_") || layer.id.includes("water_name"))) {
        try {
          const isCountry = layer.id.startsWith("label_country");
          map.setLayoutProperty(layer.id, "text-field", isCountry ? countryExpr : localizedExpr);
          if (isCountry || layer.id === "label_state") {
            map.setLayoutProperty(layer.id, "text-transform", language === "en" ? "uppercase" : "none");
          }
        } catch {
          // Ignore non-localized symbol layers
        }
      }
    }
    lastLayoutKeyRef.current = "";
    syncCountryLimbClipping(map);
    requestAnimationFrame(() => updateNameplateDOM(true));
  }, [language, styleVersion, updateNameplateDOM, syncCountryLimbClipping]);

  // React to Reset View & Record deep-link camera focus commands
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || !globeFocus || globeFocus.token === lastFocusTokenRef.current) return;
    lastFocusTokenRef.current = globeFocus.token;
    const [lat, lng] = vector3ToLatLng(...globeFocus.position);
    map.jumpTo({
      center: [lng, lat],
      zoom: getDefaultGlobeZoom(container),
    });
    syncCountryLimbClipping(map);
    updateNameplateDOM(true);
  }, [globeFocus, updateNameplateDOM, syncCountryLimbClipping]);

  // ESC clears locked country cleanly
  useEffect(() => {
    if (!lockedCountry) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLockedCountry(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lockedCountry]);

  const adjustZoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const targetZoom = Math.max(MIN_GLOBE_ZOOM, Math.min(MAX_GLOBE_ZOOM, map.getZoom() + delta));
    map.easeTo({ zoom: targetZoom, duration: 180 });
  }, []);

  const lockedUnInfo = lockedCountry ? getUNTerritoryInfo(lockedCountry) : null;
  const lockedName = lockedCountry
    ? lockedUnInfo?.displayName?.[language] || getCountryMetadataForFeature(lockedCountry)?.name[language] || lockedCountry.properties.name
    : "";
  const lockedRecordCount = useMemo(
    () => (lockedCountry ? countCountryRecords(lockedCountry, visibleRecords) : 0),
    [lockedCountry, visibleRecords],
  );

  return (
    <div
      className="seam-globe-canvas-wrapper"
      data-ready={ready}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <div ref={mapContainerRef} className="seam-maplibre-globe" style={{ width: "100%", height: "100%" }} />

      {/* Crisp archival nameplate overlays hidden smoothly when zoomed out beyond threshold */}
      {showNameplates && (
      <div
        ref={el => {
          overlayRef.current = el;
          if (el) {
            el.style.opacity = String(nameplateOpacityRef.current);
          }
        }}
        className="seam-globe-nameplates-overlay"
        aria-hidden={false}
      >
        {clusters.map(cluster => {
          const count = cluster.records.length;
          const isHovered = hoveredClusterId === cluster.id;
          const { primaryTitle, secondaryTitle } = getRecordNameplateNames(cluster.records[0], language);
          const dir = nameplateDirs[cluster.id] ?? (isHovered ? "right" : null);
          if (!dir) return null;

          return (
            <button
              key={cluster.id}
              ref={el => {
                if (el) {
                  nameplateRefs.current.set(cluster.id, el);
                  const pos = projectedCoordsRef.current.get(cluster.id);
                  if (pos) {
                    el.style.translate = `${pos.x}px ${pos.y}px`;
                    el.style.visibility = "visible";
                  }
                } else {
                  nameplateRefs.current.delete(cluster.id);
                }
              }}
              type="button"
              className={`seam-globe-nameplate dir-${dir} ${isHovered ? "is-hovered" : ""}`}
              style={{ position: "absolute" }}
              onMouseEnter={() => setHoveredClusterId(cluster.id)}
              onMouseLeave={() => setHoveredClusterId(null)}
              onClick={event => {
                event.stopPropagation();
                onClusterClick(cluster);
              }}
              title={cluster.records.map(r => {
                const names = getRecordNameplateNames(r, language);
                return names.secondaryTitle ? `${names.primaryTitle} (${names.secondaryTitle})` : names.primaryTitle;
              }).join(" / ")}
            >
              <span className="seam-nameplate-dot" aria-hidden="true" />
              <span className="seam-nameplate-labels">
                <span className="seam-nameplate-text" dir="auto">{primaryTitle}</span>
                {secondaryTitle && (
                  <span className="seam-nameplate-orig" dir="auto">{secondaryTitle}</span>
                )}
              </span>
              {count > 1 && <span className="seam-nameplate-count">+{count - 1}</span>}
            </button>
          );
        })}
      </div>
      )}

      {lockedCountry && (
        <div className="seam-globe-lock-card" role="region" aria-label={language === "zh" ? "已锁定国家" : "Locked country"}>
          <div className="seam-lock-info">
            <span className="seam-lock-badge">{language === "zh" ? "已锁定" : "Locked"}</span>
            <strong className="seam-lock-country">{lockedName}</strong>
            {lockedUnInfo?.statusNote && (
              <span className="seam-lock-un-note" title={lockedUnInfo.statusNote[language]}>
                {lockedUnInfo.statusNote[language]}
              </span>
            )}
            <span className="seam-lock-count">
              {language === "zh" ? `${lockedRecordCount} 条档案` : `${lockedRecordCount} records`}
            </span>
          </div>
          <div className="seam-lock-actions">
            <button
              type="button"
              className="seam-lock-enter-btn"
              onClick={() => onCountryClick(lockedCountry)}
            >
              {language === "zh" ? "展开国家地图 →" : "Open 2D map →"}
            </button>
            <button
              type="button"
              className="seam-lock-clear-btn"
              onClick={() => setLockedCountry(null)}
              aria-label={language === "zh" ? "取消锁定" : "Unlock country"}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="seam-globe-controls" aria-label={language === "zh" ? "地球仪缩放与视角控制" : "Globe zoom and view controls"}>
        <div className="seam-un-notice-wrap">
          {unNoticeOpen && (
            <div className="seam-un-notice-popover" role="note">
              <p className="seam-un-notice-text">{UN_MAP_DISCLAIMER[language]}</p>
              <div className="seam-un-legend">
                <span>
                  <i className="seam-legend-dashed" aria-hidden="true" />
                  {language === "zh" ? "虚线：未定或争议国界" : "Dashed: Disputed boundary"}
                </span>
                <span>
                  <i className="seam-legend-dotted" aria-hidden="true" />
                  {language === "zh" ? "点线：停火或实控线" : "Dotted: Ceasefire / LoC"}
                </span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="seam-un-notice-btn"
            aria-expanded={unNoticeOpen}
            onClick={() => setUnNoticeOpen(prev => !prev)}
          >
            {language === "zh" ? "联合国边界标准" : "UN Map Notice"}
          </button>
        </div>
        <div className="seam-globe-zoom-group">
          <button
            type="button"
            onClick={() => adjustZoom(0.65)}
            aria-label={language === "zh" ? "放大地球" : "Zoom in globe"}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => adjustZoom(-0.65)}
            aria-label={language === "zh" ? "缩小地球" : "Zoom out globe"}
          >
            −
          </button>
        </div>
        <button
          type="button"
          className="seam-map-reset"
          onClick={() => {
            setLockedCountry(null);
            focusGlobe(0, 0);
          }}
        >
          {language === "zh" ? "重置视角" : "Reset view"}
        </button>
      </div>
    </div>
  );
}
