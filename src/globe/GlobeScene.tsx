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
  appendCountryNameExclusionFilter,
  getCountryLabelExpression,
  getLocalizedLabelExpression,
  loadArchiveGlobeStyle,
} from "../geo/maplibreStyle";
import { findCountryAtPoint, getCountryMetadataForFeature } from "../geo/countryLookup";
import { getUNTerritoryInfo, UN_MAP_DISCLAIMER } from "../geo/unStandards";
import { clusterRecords } from "../geo/clustering";
import { useApp } from "../state/useApp";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface GlobeContentProps {
  worldData: WorldData;
  onCountryClick: (country: CountryFeature) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

type NameplateDir = "right" | "up" | "left" | "down";

const MIN_GLOBE_ZOOM = 1.15;
const MAX_GLOBE_ZOOM = 7.5;
const GLOBE_NAMEPLATE_MIN_ZOOM = 1.45;
const GLOBE_LIMB_MARGIN_PX = 6;
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
  const minSide = Math.max(220, Math.min(container.clientWidth, container.clientHeight));
  const targetRadiusPx = minSide * 0.4;
  return Math.max(MIN_GLOBE_ZOOM + 0.2, Math.min(2.6, Math.log2(targetRadiusPx / 58)));
}

function getLockedCountryZoom(country: CountryFeature, baseZoom: number): number {
  const area = Math.max(0.0005, geoArea(country));
  const boost = area > 0.04 ? 1.15 : area > 0.008 ? 1.75 : 2.35;
  return Math.min(5.2, Math.max(baseZoom + 0.9, baseZoom + boost));
}

function getClusterRadiusForZoom(zoom: number): number {
  return Math.max(18, Math.min(900, 1150 / Math.pow(2, zoom)));
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
  const nameplateRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const projectedCoordsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const [ready, setReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const [lockedCountry, setLockedCountry] = useState<CountryFeature | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [unNoticeOpen, setUnNoticeOpen] = useState(false);
  const [showNameplates, setShowNameplates] = useState(true);
  const [clusterRadius, setClusterRadius] = useState(() => getClusterRadiusForZoom(1.4));
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
  const showNameplatesRef = useRef(true);
  const lastClusterZoomRef = useRef(1.4);
  const lastDirZoomRef = useRef(1.4);
  const initialCamRef = useRef(globeCameraPosition);
  const lastLayoutKeyRef = useRef("");
  const lastFocusTokenRef = useRef(globeFocus?.token);
  const baseCountryFiltersRef = useRef<Record<string, unknown>>({});
  const lastLimbExcludedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
    onClusterClickRef.current = onClusterClick;
    lockedCountryRef.current = lockedCountry;
    worldDataRef.current = worldData;
    languageRef.current = language;
    setGlobeCamPosRef.current = setGlobeCameraPosition;
    hoveredIdRef.current = hoveredClusterId;
  });

  const clusters = useMemo(() => clusterRecords(visibleRecords, clusterRadius), [visibleRecords, clusterRadius]);
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  const syncCountryLimbClipping = useCallback((map: MapLibreMap) => {
    const container = mapContainerRef.current;
    if (!container || !map.getSource("openmaptiles")) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const radiusPx = measureGlobeScreenRadius(map, width, height);
    const excludedSet = new Set<string>();

    if (radiusPx !== null && radiusPx > 0) {
      const cx = width / 2;
      const cy = height / 2;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const lang = languageRef.current;
      const features = map.querySourceFeatures("openmaptiles", {
        sourceLayer: "place",
        filter: ["==", ["get", "class"], "country"],
      });

      for (const feature of features) {
        const coords =
          feature.geometry.type === "Point"
            ? feature.geometry.coordinates
            : feature.geometry.type === "MultiPoint"
              ? feature.geometry.coordinates[0]
              : null;
        if (!coords || coords.length < 2) continue;

        const [lng, lat] = coords;
        if (dotOnSphere(lng, lat, center.lng, center.lat) < -0.1) continue;

        const props = (feature.properties || {}) as Record<string, unknown>;
        const filterKey = String(props["name:en"] || props.name || "");
        if (!filterKey) continue;

        const pt = map.project([lng, lat]);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;

        const { halfW, halfH } = estimateCountryLabelHalfBox(props, zoom, lang);
        const cornerDist = Math.hypot(Math.abs(pt.x - cx) + halfW, Math.abs(pt.y - cy) + halfH);
        if (!isPixelOnGlobe(map, pt.x, pt.y) || cornerDist > radiusPx - GLOBE_LIMB_MARGIN_PX) {
          excludedSet.add(filterKey);
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
  }, []);

  const updateNameplateDOM = useCallback((recomputeDirs: boolean) => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const shouldShowNameplates = zoom >= GLOBE_NAMEPLATE_MIN_ZOOM;
    if (showNameplatesRef.current !== shouldShowNameplates) {
      showNameplatesRef.current = shouldShowNameplates;
      setShowNameplates(shouldShowNameplates);
      if (shouldShowNameplates) lastLayoutKeyRef.current = "";
    }

    if (!shouldShowNameplates) {
      for (const cluster of clustersRef.current) {
        const el = nameplateRefs.current.get(cluster.id);
        if (el) el.style.visibility = "hidden";
      }
      return;
    }

    // Strict horizon culling when globe shows full curvature; relaxes smoothly at city/region zoom
    const minDot = zoom >= 4.2 ? -1 : Math.max(0.02, 0.22 - Math.max(0, zoom - 1.5) * 0.12);

    const visibleItems: Array<{ cluster: LocationCluster; x: number; y: number }> = [];

    for (const cluster of clustersRef.current) {
      const el = nameplateRefs.current.get(cluster.id);
      const { longitude, latitude } = cluster.coordinates;
      const hemisphereDot = dotOnSphere(longitude, latitude, center.lng, center.lat);
      if (hemisphereDot < minDot) {
        if (el) el.style.visibility = "hidden";
        continue;
      }

      const pt = map.project([longitude, latitude]);
      if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 16 || pt.x > width - 16 || pt.y < 16 || pt.y > height - 16) {
        if (el) el.style.visibility = "hidden";
        continue;
      }

      projectedCoordsRef.current.set(cluster.id, { x: pt.x, y: pt.y });
      if (el) {
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
        el.style.visibility = "visible";
      }
      visibleItems.push({ cluster, x: pt.x, y: pt.y });
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
      const title = cluster.records[0].title[lang] || cluster.records[0].title.en;
      const boxW = Math.min(180, Math.max(76, title.length * (lang === "zh" ? 13 : 7.5) + 32));
      const boxH = 26;

      const tryDirs: NameplateDir[] = [
        x > width - 190 ? "left" : "right",
        y < 70 ? "down" : "up",
        x > width - 190 ? "right" : "left",
        y < 70 ? "up" : "down",
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
  }, []);

  // Initialize MapLibre GL JS 3D Globe directly with Positron's native multi-LOD vector
  // coastlines, national borders, and provincial subdivisions (with offline GeoJSON fallback).
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let disposed = false;
    let map: MapLibreMap | null = null;
    let readyTimer = 0;

    void loadArchiveGlobeStyle(worldData.features, languageRef.current).then(style => {
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
        localIdeographFontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
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

      const handleStyleReady = () => {
        if (disposed) return;
        const zoom = instance.getZoom();
        lastClusterZoomRef.current = zoom;
        instance.setProjection({ type: "globe" });
        const capturedFilters: Record<string, unknown> = {};
        for (const layerId of COUNTRY_LABEL_LAYER_IDS) {
          if (instance.getLayer(layerId)) {
            capturedFilters[layerId] = instance.getFilter(layerId);
          }
        }
        baseCountryFiltersRef.current = capturedFilters;
        lastLimbExcludedKeyRef.current = null;
        syncGlobeContextLayers(instance, Boolean(lockedCountryRef.current));
        syncCountryLimbClipping(instance);
        setClusterRadius(getClusterRadiusForZoom(zoom));
        setStyleVersion(v => v + 1);
        requestAnimationFrame(() => updateNameplateDOM(true));
      };

      readyTimer = window.setTimeout(markReady, 2500);
      instance.on("style.load", handleStyleReady);
      instance.once("idle", markReady);
      instance.on("idle", () => syncCountryLimbClipping(instance));
      instance.on("sourcedata", e => {
        if (e.sourceId === "openmaptiles" && e.isSourceLoaded) {
          syncCountryLimbClipping(instance);
        }
      });
      instance.on("error", err => {
        console.warn("MapLibre warning:", err.error?.message || err);
      });

      instance.on("move", () => {
        const currentZoom = instance.getZoom();
        if (Math.abs(currentZoom - lastClusterZoomRef.current) >= 0.25) {
          lastClusterZoomRef.current = currentZoom;
          setClusterRadius(getClusterRadiusForZoom(currentZoom));
        }
        syncCountryLimbClipping(instance);
        const zoomStepChanged = Math.abs(currentZoom - lastDirZoomRef.current) >= 0.2;
        updateNameplateDOM(zoomStepChanged);
      });

      instance.on("moveend", () => {
        const currentZoom = instance.getZoom();
        lastClusterZoomRef.current = currentZoom;
        setClusterRadius(getClusterRadiusForZoom(currentZoom));
        syncCountryLimbClipping(instance);
        updateNameplateDOM(true);
        const c = instance.getCenter();
        setGlobeCamPosRef.current(latLngToVector3(c.lat, c.lng, 6.5));
      });

      instance.on("mousemove", e => {
        if (!instance.getLayer("seam-clusters-core")) return;
        const hits = instance.queryRenderedFeatures(e.point, { layers: ["seam-clusters-core", "seam-clusters-halo"] });
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
        // Priority 1: Direct click on golden archive dot
        if (instance.getLayer("seam-clusters-core")) {
          const dotHits = instance.queryRenderedFeatures(e.point, { layers: ["seam-clusters-core", "seam-clusters-halo"] });
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
      disposed = true;
      mapRef.current = null;
      map?.remove();
    };
  }, [worldData, updateNameplateDOM, syncCountryLimbClipping]);

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

      {/* Crisp archival nameplate overlays hidden automatically when zoomed out beyond country-label scale */}
      {showNameplates && (
      <div className="seam-globe-nameplates-overlay" aria-hidden={false}>
        {clusters.map(cluster => {
          const count = cluster.records.length;
          const isHovered = hoveredClusterId === cluster.id;
          const primaryTitle = cluster.records[0].title[language] || cluster.records[0].title.en;
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
                    el.style.left = `${pos.x}px`;
                    el.style.top = `${pos.y}px`;
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
              title={cluster.records.map(r => r.title[language]).join(" / ")}
            >
              <span className="seam-nameplate-dot" aria-hidden="true" />
              <span className="seam-nameplate-text">{primaryTitle}</span>
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
