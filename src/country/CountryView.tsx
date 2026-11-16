import { memo, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { FeatureCollection, Polygon } from "geojson";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata, CityMetadata } from "../data/countriesMeta";
import type { ArchiveRecord, LocationCluster } from "../types";
import { useApp } from "../state/useApp";
import { getRecordDisplayNames } from "../data/recordStatus";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
import { getUNTerritoryInfo } from "../geo/unStandards";
import { loadWorldData, loadAdministrativeBorders, getMapCities, canonicalCountryName } from "../geo/worldGeometry";
import {
  extractAdminLabels,
  loadChinaProvinces,
  resolveRecordSubregion,
  type SubregionGroup,
} from "../geo/subregions";
import { clusterRecords } from "../geo/clustering";

interface CountryViewProps {
  country: CountryFeature;
  meta: CountryMetadata | null;
  records: ArchiveRecord[];
  onBack: () => void;
  onRecordClick: (record: ArchiveRecord) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

interface ProjectedCluster {
  cluster: LocationCluster;
  x: number;
  y: number;
  offsetY: number;
  side: "right" | "left";
}

interface CountryStaticGeometryProps {
  surroundingPaths: Array<{ key: string; d: string }>;
  countryOutlineD: string;
  chinaOverlayPaths: Array<{ pid: string; d: string; isNanhai: boolean; isSafeFill: boolean }>;
  selectedProvinceId?: string;
  borderPaths: string[];
}

const CountryStaticGeometry = memo(function CountryStaticGeometry({
  surroundingPaths,
  countryOutlineD,
  chinaOverlayPaths,
  selectedProvinceId,
  borderPaths,
}: CountryStaticGeometryProps) {
  return (
    <>
      {surroundingPaths.map(item => (
        <path
          key={item.key}
          d={item.d}
          fill="#f2efe8"
          stroke="#dcd6ca"
          strokeWidth={0.65}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      ))}
      {countryOutlineD && <path d={countryOutlineD} fill="#fcfbf7" stroke="none" />}
      {chinaOverlayPaths.map(item => {
        if (item.isNanhai) {
          return (
            <path
              key={item.pid}
              d={item.d}
              fill="none"
              stroke="#d3ccbf"
              strokeWidth={0.65}
              vectorEffect="non-scaling-stroke"
              strokeOpacity={0.78}
            />
          );
        }
        if (!item.isSafeFill || !selectedProvinceId || item.pid !== selectedProvinceId) return null;
        return (
          <path
            key={item.pid}
            d={item.d}
            fill="rgba(196, 154, 69, 0.2)"
            stroke="#8f671c"
            strokeWidth={1.3}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {borderPaths.map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke="#d3ccbf"
          strokeWidth={0.65}
          vectorEffect="non-scaling-stroke"
          strokeOpacity={0.75}
        />
      ))}
      {countryOutlineD && (
        <path
          d={countryOutlineD}
          fill="none"
          stroke="#b9ae9c"
          strokeWidth={1.15}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      )}
    </>
  );
});

export function CountryView({ country, meta, records, onBack, onRecordClick, onClusterClick }: CountryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const [worldFeatures, setWorldFeatures] = useState<CountryFeature[]>([]);
  const [bordersState, setBordersState] = useState<{ countryId: string; data: FeatureCollection | null } | null>(null);
  const [chinaProvinces, setChinaProvinces] = useState<FeatureCollection | null>(null);
  const [subregionSelection, setSubregionSelection] = useState<{ countryId: string; key: string } | null>(null);
  const { language } = useApp();
  const countryKey = String(country.id ?? country.properties.name);
  const unInfo = getUNTerritoryInfo(country);
  const name = unInfo?.displayName?.[language] || meta?.name[language] || country.properties.name;
  const isChina = countryKey === "156" || canonicalCountryName(country.properties.name) === "China";

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const syncDimensions = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      const nextWidth = Math.max(200, container.clientWidth);
      const nextHeight = Math.max(200, container.clientHeight);
      setDimensions(prev => (prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight }));
    };
    syncDimensions();
    const observer = new ResizeObserver(syncDimensions);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    void loadWorldData().then(data => {
      if (active) setWorldFeatures(data.features);
    }).catch(() => {});
    void loadAdministrativeBorders(country.properties.name).then(data => {
      if (active) setBordersState({ countryId: countryKey, data });
    });
    if (isChina) {
      void loadChinaProvinces().then(data => {
        if (active && data) setChinaProvinces(data);
      });
    }
    return () => {
      active = false;
    };
  }, [country, countryKey, isChina]);

  const activeBorders = bordersState && bordersState.countryId === countryKey ? bordersState.data : null;
  const activeChinaProvinces = isChina ? chinaProvinces : null;
  const activeSubregionKey =
    subregionSelection && subregionSelection.countryId === countryKey ? subregionSelection.key : "all";

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let rafId = 0;
    let pendingTransform = d3.zoomIdentity;

    const behavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 16])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        pendingTransform = event.transform;
        if (event.sourceEvent === null) {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
          setTransform(pendingTransform);
          return;
        }
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            setTransform(pendingTransform);
          });
        }
      });

    zoomRef.current = behavior;
    const selection = d3.select(svg);
    selection.call(behavior).call(behavior.transform, d3.zoomIdentity);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      selection.on(".zoom", null);
    };
  }, [country]);

  const countryRecords = useMemo(
    () =>
      records.filter(record => {
        const coordinates = record.place.coordinates;
        if (!coordinates) return false;
        // Spatial containment follows the actual adopted map outline. Editorial
        // country metadata must not place a point outside the selected polygon.
        return d3.geoContains(country, [coordinates.longitude, coordinates.latitude]);
      }),
    [records, country],
  );

  const { subregionGroups, filteredRecords, selectedProvinceId } = useMemo(() => {
    const groupsMap = new Map<string, SubregionGroup>();
    const assigned = countryRecords.map(record => {
      const resolved = resolveRecordSubregion(record, activeChinaProvinces, language);
      const existing = groupsMap.get(resolved.key);
      if (existing) {
        existing.count += 1;
      } else {
        groupsMap.set(resolved.key, {
          key: resolved.key,
          label: resolved.label,
          count: 1,
          provinceFeatureId: resolved.provinceFeatureId,
        });
      }
      return { record, resolved };
    });

    const groups = Array.from(groupsMap.values()).sort((a, b) => b.count - a.count);
    const hasActive = activeSubregionKey !== "all" && groupsMap.has(activeSubregionKey);
    const effectiveRecords = hasActive
      ? assigned.filter(item => item.resolved.key === activeSubregionKey).map(item => item.record)
      : countryRecords;
    const activeGroup = hasActive ? groupsMap.get(activeSubregionKey) : undefined;

    return {
      subregionGroups: groups,
      filteredRecords: effectiveRecords,
      selectedProvinceId: activeGroup?.provinceFeatureId,
    };
  }, [countryRecords, activeChinaProvinces, language, activeSubregionKey]);

  const { path, projection, focusCenter } = useMemo(() => {
    let target: CountryFeature = country;
    if (country.geometry.type === "MultiPolygon") {
      const polygons = country.geometry.coordinates;
      const largest = [...polygons].sort(
        (a, b) => d3.geoArea({ type: "Polygon", coordinates: b }) - d3.geoArea({ type: "Polygon", coordinates: a }),
      )[0];
      if (largest) {
        const geometry: Polygon = { type: "Polygon", coordinates: largest };
        target = { ...country, geometry };
      }
    }
    const center = d3.geoCentroid(target);
    const projection = d3
      .geoMercator()
      .rotate([-center[0], 0])
      .fitExtent([[30, 30], [dimensions.width - 30, dimensions.height - 30]], target);
    return { projection, path: d3.geoPath(projection), focusCenter: center };
  }, [country, dimensions]);

  const surroundingCountries = useMemo(
    () =>
      worldFeatures.filter(feature => {
        const id = String(feature.id ?? feature.properties.name);
        if (id === countryKey || id === "010" || canonicalCountryName(feature.properties.name) === "Antarctica") {
          return false;
        }
        return d3.geoDistance(focusCenter, d3.geoCentroid(feature)) < 1.55;
      }),
    [worldFeatures, countryKey, focusCenter],
  );

  const surroundingPaths = useMemo(
    () =>
      surroundingCountries
        .map((neighbor, idx) => ({
          key: String(neighbor.id ?? neighbor.properties.name ?? idx),
          d: path(neighbor) || "",
        }))
        .filter(item => item.d.length > 0),
    [surroundingCountries, path],
  );

  const countryOutlineD = useMemo(() => path(country) || "", [country, path]);

  const chinaOverlayPaths = useMemo(() => {
    if (!isChina || !activeChinaProvinces) return [];
    return activeChinaProvinces.features
      .map((feature, index) => {
        const props = (feature.properties || {}) as { id?: string; name?: string };
        const pid = props.id || props.name || String(index);
        const d = path(feature) || "";
        return {
          pid,
          d,
          isNanhai: props.name === "南海诸岛",
          isSafeFill: d3.geoArea(feature) < Math.PI * 2,
        };
      })
      .filter(item => item.d.length > 0);
  }, [isChina, activeChinaProvinces, path]);

  const borderPaths = useMemo(
    () => activeBorders?.features.map(feature => path(feature) || "").filter(d => d.length > 0) ?? [],
    [activeBorders, path],
  );

  const clusters = useMemo(() => {
    // Six screen pixels of separation (dot diameter); exact coordinates remain a picker.
    const latCos = Math.max(0.2, Math.cos((focusCenter[1] * Math.PI) / 180));
    const kmPerPixel = (6371 * latCos) / projection.scale() / transform.k;
    return clusterRecords(filteredRecords, 6 * kmPerPixel);
  }, [filteredRecords, projection, focusCenter, transform.k]);

  const projectedClustersBase = useMemo(
    () =>
      clusters
        .map(cluster => {
          const basePoint = projection([cluster.coordinates.longitude, cluster.coordinates.latitude]);
          return basePoint ? { cluster, basePoint } : null;
        })
        .filter((item): item is { cluster: LocationCluster; basePoint: [number, number] } => item !== null),
    [clusters, projection],
  );

  const projectedCitiesBase = useMemo(() => {
    const global = getMapCities().filter(
      city =>
        canonicalCountryName(city.countryName) === canonicalCountryName(country.properties.name) ||
        (meta?.codeAlpha3 && city.countryCode === meta.codeAlpha3),
    );
    const combined: CityMetadata[] = [...(meta?.capital ? [meta.capital] : []), ...(meta?.cities || []), ...global];
    return combined
      .filter(
        (city, index) =>
          combined.findIndex(other => other.name.en === city.name.en) === index && d3.geoContains(country, city.coordinates),
      )
      .map(city => {
        const basePoint = projection(city.coordinates);
        return basePoint ? { city, basePoint } : null;
      })
      .filter((item): item is { city: CityMetadata; basePoint: [number, number] } => item !== null);
  }, [country, meta, projection]);

  const projectedAdminBase = useMemo(
    () =>
      extractAdminLabels(
        isChina && activeChinaProvinces ? activeChinaProvinces : activeBorders,
        language,
        isChina && Boolean(activeChinaProvinces),
      )
        .filter(label => isChina || d3.geoContains(country, label.coordinates))
        .map(label => {
          const basePoint = projection(label.coordinates);
          return basePoint ? { ...label, basePoint } : null;
        })
        .filter((item): item is { id: string; name: string; coordinates: [number, number]; basePoint: [number, number] } => item !== null),
    [isChina, activeChinaProvinces, activeBorders, language, country, projection],
  );

  const projectedNeighborBase = useMemo(
    () =>
      surroundingCountries
        .map(neighbor => {
          let labelGeom: CountryFeature["geometry"] = neighbor.geometry;
          if (neighbor.geometry.type === "MultiPolygon") {
            const largest = [...neighbor.geometry.coordinates].sort(
              (a, b) => d3.geoArea({ type: "Polygon", coordinates: b }) - d3.geoArea({ type: "Polygon", coordinates: a }),
            )[0];
            if (largest) labelGeom = { type: "Polygon", coordinates: largest };
          }
          const centroid = d3.geoCentroid(labelGeom);
          if (!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1]) || d3.geoContains(country, centroid)) {
            return null;
          }
          const basePoint = projection(centroid);
          if (!basePoint) return null;
          return {
            id: String(neighbor.id ?? neighbor.properties.name),
            name: getCountryMetadataForFeature(neighbor)?.name[language] || neighbor.properties.name,
            basePoint,
          };
        })
        .filter((item): item is { id: string; name: string; basePoint: [number, number] } => item !== null),
    [surroundingCountries, country, projection, language],
  );

  // Compute screen coordinates and resolve 2D AABB collisions across nameplates so adjacent markers never overlap.
  const projectedClusters: ProjectedCluster[] = [];
  const occupiedNameplates: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [];
  for (const { cluster, basePoint } of projectedClustersBase) {
    const [x, y] = transform.apply(basePoint);
    const { mapTitle, mapOriginalName } = getRecordDisplayNames(cluster.records[0], language);
    const maxLen = Math.max(mapTitle.length, mapOriginalName ? Math.ceil(mapOriginalName.length * 0.9) : 0);
    const estWidth = Math.min(200, Math.max(76, maxLen * (language === "zh" ? 12.5 : 7.5) + 34));
    const halfH = mapOriginalName ? 17 : 13;
    const defaultSide: "right" | "left" = x > dimensions.width - estWidth - 28 ? "left" : "right";
    const altSide: "right" | "left" = defaultSide === "right" ? "left" : "right";

    const stepY = mapOriginalName ? 36 : 28;
    const candidates: Array<{ side: "right" | "left"; offsetY: number }> = [
      { side: defaultSide, offsetY: 0 },
      { side: altSide, offsetY: 0 },
      { side: defaultSide, offsetY: -stepY },
      { side: defaultSide, offsetY: stepY },
      { side: altSide, offsetY: -stepY },
      { side: altSide, offsetY: stepY },
      { side: defaultSide, offsetY: -stepY * 2 },
      { side: defaultSide, offsetY: stepY * 2 },
      { side: altSide, offsetY: -stepY * 2 },
      { side: altSide, offsetY: stepY * 2 },
      { side: defaultSide, offsetY: -stepY * 3 },
      { side: altSide, offsetY: -stepY * 3 },
    ];

    let chosen = candidates[0];
    let bestBox = {
      minX: defaultSide === "right" ? x + 10 : x - 10 - estWidth,
      minY: y - halfH,
      maxX: defaultSide === "right" ? x + 10 + estWidth : x - 10,
      maxY: y + halfH,
    };
    let bestOverlapArea = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const cy = y + candidate.offsetY;
      if (cy < 18 || cy > dimensions.height - 24) continue;
      const minX = candidate.side === "right" ? x + 10 : x - 10 - estWidth;
      const maxX = candidate.side === "right" ? x + 10 + estWidth : x - 10;
      if (minX < 8 || maxX > dimensions.width - 8) continue;
      const box = { minX, minY: cy - halfH, maxX, maxY: cy + halfH };
      let overlapArea = 0;
      for (const other of occupiedNameplates) {
        const ox = Math.max(0, Math.min(box.maxX, other.maxX) - Math.max(box.minX, other.minX));
        const oy = Math.max(0, Math.min(box.maxY, other.maxY) - Math.max(box.minY, other.minY));
        overlapArea += ox * oy;
      }
      if (overlapArea === 0) {
        chosen = candidate;
        bestBox = box;
        bestOverlapArea = 0;
        break;
      }
      if (overlapArea < bestOverlapArea) {
        bestOverlapArea = overlapArea;
        chosen = candidate;
        bestBox = box;
      }
    }
    occupiedNameplates.push(bestBox);

    projectedClusters.push({ cluster, x, y, offsetY: chosen.offsetY, side: chosen.side });
  }

  const visibleCities = projectedCitiesBase
    .filter(({ city }) => city.isCapital || transform.k >= 1.5)
    .map(({ city, basePoint }) => {
      const point = transform.apply(basePoint);
      if (projectedClusters.some(cluster => Math.hypot(cluster.x - point[0], cluster.y - point[1]) < 46)) {
        return null;
      }
      return { city, point };
    })
    .filter((entry): entry is { city: CityMetadata; point: [number, number] } => entry !== null);

  // Screen-space collision culling for provincial/state labels so regions remain legible and uncrowded.
  const visibleAdminLabels: Array<{ id: string; name: string; x: number; y: number }> = [];
  const placedBoxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [
    ...projectedClusters.map(c => ({ minX: c.x - 28, minY: c.y + c.offsetY - 16, maxX: c.x + 115, maxY: c.y + c.offsetY + 16 })),
    ...visibleCities.map(v => ({ minX: v.point[0] - 12, minY: v.point[1] - 12, maxX: v.point[0] + 72, maxY: v.point[1] + 12 })),
  ];
  for (const label of projectedAdminBase) {
    const [x, y] = transform.apply(label.basePoint);
    if (x < 28 || x > dimensions.width - 28 || y < 22 || y > dimensions.height - 40) continue;
    const halfW = (label.name.length * (language === "zh" ? 11 : 6.4) + 12) / 2;
    const box = { minX: x - halfW, minY: y - 9, maxX: x + halfW, maxY: y + 9 };
    const overlaps = placedBoxes.some(
      other => !(box.maxX < other.minX || box.minX > other.maxX || box.maxY < other.minY || box.minY > other.maxY),
    );
    if (overlaps) continue;
    placedBoxes.push(box);
    visibleAdminLabels.push({ id: label.id, name: label.name, x, y });
  }

  // Softly render surrounding neighbor country labels outside the focused territory
  const visibleNeighborLabels: Array<{ id: string; name: string; x: number; y: number }> = [];
  for (const neighbor of projectedNeighborBase) {
    const [x, y] = transform.apply(neighbor.basePoint);
    if (x < 36 || x > dimensions.width - 36 || y < 24 || y > dimensions.height - 44) continue;
    const halfW = (neighbor.name.length * (language === "zh" ? 10.5 : 6.2) + 14) / 2;
    const box = { minX: x - halfW, minY: y - 9, maxX: x + halfW, maxY: y + 9 };
    const overlaps = placedBoxes.some(
      other => !(box.maxX < other.minX || box.minX > other.maxX || box.maxY < other.minY || box.minY > other.maxY),
    );
    if (overlaps) continue;
    placedBoxes.push(box);
    visibleNeighborLabels.push({
      id: neighbor.id,
      name: neighbor.name,
      x,
      y,
    });
  }

  const activate = (cluster: LocationCluster) =>
    cluster.records.length === 1 ? onRecordClick(cluster.records[0]) : onClusterClick(cluster);
  const adjustZoom = (factor: number) => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).call(zoomRef.current.scaleBy, factor);
  };
  const reset = () => {
    setSubregionSelection({ countryId: countryKey, key: "all" });
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const focusSubregion = (key: string) => {
    setSubregionSelection({ countryId: countryKey, key });
    if (!svgRef.current || !zoomRef.current) return;
    if (key === "all") {
      d3.select(svgRef.current).call(zoomRef.current.transform, d3.zoomIdentity);
      return;
    }
    const targetRecords = countryRecords.filter(
      r => resolveRecordSubregion(r, activeChinaProvinces, language).key === key,
    );
    const pts = targetRecords
      .map(r => (r.place.coordinates ? projection([r.place.coordinates.longitude, r.place.coordinates.latitude]) : null))
      .filter((p): p is [number, number] => p !== null);
    if (pts.length === 0) return;

    const minX = Math.min(...pts.map(p => p[0]));
    const maxX = Math.max(...pts.map(p => p[0]));
    const minY = Math.min(...pts.map(p => p[1]));
    const maxY = Math.max(...pts.map(p => p[1]));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spanX = Math.max(40, maxX - minX);
    const spanY = Math.max(40, maxY - minY);
    const scale =
      pts.length === 1
        ? 2.2
        : Math.max(1.3, Math.min(3.5, 0.55 * Math.min(dimensions.width / spanX, dimensions.height / spanY)));
    const nextTransform = d3.zoomIdentity.translate(dimensions.width / 2 - cx * scale, dimensions.height / 2 - cy * scale).scale(scale);
    d3.select(svgRef.current).call(zoomRef.current.transform, nextTransform);
  };

  return (
    <div className="seam-country-view">
      <header className="seam-country-header">
        <button type="button" className="seam-back-button" onClick={onBack}>
          {language === "zh" ? "← 返回三维地球仪" : "← Return to Globe"}
        </button>
        <div className="seam-country-title-box">
          <h1 className="seam-country-name">{name}</h1>
          {unInfo?.statusNote && (
            <p className="seam-country-un-note">{unInfo.statusNote[language]}</p>
          )}
          {meta?.capital && (
            <p className="seam-country-capital">
              {language === "zh" ? "首都" : "Capital"}：{meta.capital.name[language]}
            </p>
          )}
        </div>
        <div className="seam-country-stats">
          <span className="seam-stats-count">{filteredRecords.length}</span>
          <span className="seam-stats-label">{language === "zh" ? "条历史档案" : "Records"}</span>
        </div>
      </header>

      {subregionGroups.length > 0 && (
        <nav className="seam-subregion-bar" aria-label={language === "zh" ? "行政与地域分类" : "Regional classification"}>
          <span className="seam-subregion-bar-label">
            {isChina
              ? language === "zh"
                ? "省级分类"
                : "Provinces"
              : language === "zh"
                ? "州/地域分类"
                : "Sub-regions"}
          </span>
          <button
            type="button"
            className={`seam-subregion-chip ${activeSubregionKey === "all" || !subregionGroups.some(g => g.key === activeSubregionKey) ? "is-active" : ""}`}
            onClick={() => focusSubregion("all")}
          >
            {language === "zh" ? `全部 (${countryRecords.length})` : `All (${countryRecords.length})`}
          </button>
          {subregionGroups.map(group => (
            <button
              key={group.key}
              type="button"
              className={`seam-subregion-chip ${activeSubregionKey === group.key ? "is-active" : ""}`}
              onClick={() => focusSubregion(group.key)}
            >
              {group.label} ({group.count})
            </button>
          ))}
        </nav>
      )}

      <div className="seam-country-svg-container" ref={containerRef}>
        <svg
          ref={svgRef}
          className="seam-country-svg"
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          aria-label={language === "zh" ? `${name}详细地图` : `Detailed map of ${name}`}
        >
          <g transform={transform.toString()}>
            <CountryStaticGeometry
              surroundingPaths={surroundingPaths}
              countryOutlineD={countryOutlineD}
              chinaOverlayPaths={chinaOverlayPaths}
              selectedProvinceId={selectedProvinceId}
              borderPaths={borderPaths}
            />
          </g>

          <g className="seam-neighbor-labels-layer" pointerEvents="none">
            {visibleNeighborLabels.map(label => (
              <text
                key={label.id}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10.5"
                fontWeight="400"
                letterSpacing="0.08em"
                fill="#999184"
                stroke="#f2efe8"
                strokeWidth="2.4"
                paintOrder="stroke"
                opacity={0.82}
              >
                {label.name}
              </text>
            ))}
          </g>

          <g className="seam-subregions-labels-layer" pointerEvents="none">
            {visibleAdminLabels.map(label => (
              <text
                key={label.id}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10.5"
                fontWeight="500"
                letterSpacing="0.04em"
                fill="#787063"
                stroke="#fcfbf7"
                strokeWidth="2.4"
                paintOrder="stroke"
                opacity={0.86}
              >
                {label.name}
              </text>
            ))}
          </g>

          <g className="seam-cities-layer" pointerEvents="none">
            {visibleCities.map(({ city, point }) => (
              <g key={city.name.en} transform={`translate(${point[0]},${point[1]})`}>
                <circle r={city.isCapital ? 2.8 : 2} fill="#3a352e" />
                <text x="6.5" y="3.5" fontSize="10.5" fill="#3a352e" stroke="#fcfbf7" strokeWidth="2.2" paintOrder="stroke">
                  {city.name[language]}
                </text>
              </g>
            ))}
          </g>

          <g className="seam-markers-layer">
            {projectedClusters.map(({ cluster, x, y }) => {
              const count = cluster.records.length;
              return (
                <g
                  key={cluster.id}
                  className="seam-gold-marker-group"
                  transform={`translate(${x},${y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cluster.name[language]}: ${count} ${language === "zh" ? "条档案" : "records"}`}
                  onClick={event => {
                    event.stopPropagation();
                    activate(cluster);
                  }}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      activate(cluster);
                    }
                  }}
                >
                  <title>{cluster.records.map(record => record.title[language]).join(" / ")}</title>
                  <circle r="15" fill="transparent" />
                  <circle r={11.5} fill="rgba(196, 154, 69, 0.2)" />
                  <circle r={6.5} fill="#c49a45" stroke="#fff" strokeWidth="1.6" />
                  {count > 1 && (
                    <text textAnchor="middle" y="3" fill="#fff" fontSize="8.5" fontWeight="600" pointerEvents="none">
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Direct nameplate boxes anchored at projected record coordinates */}
        <div className="seam-2d-nameplates-layer" aria-hidden="true">
          {projectedClusters.map(({ cluster, x, y, offsetY, side }) => {
            const count = cluster.records.length;
            const { mapTitle, mapOriginalName } = getRecordDisplayNames(cluster.records[0], language);
            return (
              <button
                key={cluster.id}
                type="button"
                tabIndex={-1}
                className={`seam-2d-nameplate ${side === "left" ? "is-left" : ""}`}
                style={{ translate: `${x}px ${y + offsetY}px` }}
                onClick={() => activate(cluster)}
              >
                <span className="seam-nameplate-dot" />
                <span className="seam-nameplate-labels">
                  <span className="seam-nameplate-text">{mapTitle}</span>
                  {mapOriginalName && (
                    <span className="seam-nameplate-orig" dir="auto">{mapOriginalName}</span>
                  )}
                </span>
                {count > 1 && <span className="seam-nameplate-count">+{count - 1}</span>}
              </button>
            );
          })}
        </div>

        <div className="seam-map-controls" aria-label={language === "zh" ? "地图缩放" : "Map zoom"}>
          <button type="button" onClick={() => adjustZoom(1.5)} aria-label={language === "zh" ? "放大地图" : "Zoom in"}>
            +
          </button>
          <button type="button" onClick={() => adjustZoom(1 / 1.5)} aria-label={language === "zh" ? "缩小地图" : "Zoom out"}>
            −
          </button>
          <button type="button" onClick={reset}>
            {language === "zh" ? "适配范围" : "Fit map"}
          </button>
        </div>

        {countryRecords.length === 0 && (
          <div className="seam-country-empty-hint">
            {language === "zh" ? "当前时间范围内暂无档案。" : "No records in the selected era."}
          </div>
        )}
      </div>
    </div>
  );
}
