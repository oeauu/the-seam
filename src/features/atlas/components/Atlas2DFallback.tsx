import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { ArchiveEntry, AtlasSceneMode, Language } from "../types";
import type { RegionCluster } from "../selectors";
import { getEntryDisplayPeriod, getEntryPrimaryLocation } from "../selectors";

interface Atlas2DFallbackProps {
  entries: ArchiveEntry[];
  clusters: RegionCluster[];
  mode: AtlasSceneMode;
  selectedRegionId: string | null;
  language: Language;
  onSelectRegion: (regionId: string) => void;
  onSelectEntry: (entryId: string) => void;
}
type AtlasFeature = Feature<Geometry, GeoJsonProperties>;

const REGION_COUNTRIES: Readonly<Record<string, readonly string[]>> = {
  europe: ["Greece", "Italy", "France", "United Kingdom", "Germany", "Spain"],
  "east-asia": ["China", "Japan", "South Korea", "North Korea", "Mongolia", "Taiwan"],
  "south-asia": ["India", "Pakistan", "Bangladesh", "Nepal", "Sri Lanka"],
  "west-asia": ["Iraq", "Turkey", "Syria", "Israel", "Jordan", "Lebanon", "Iran"],
  "north-africa": ["Egypt", "Tunisia", "Morocco", "Algeria", "Libya"],
};

interface TopologyPayload extends Topology {
  objects: Topology["objects"] & { countries: Topology["objects"][string] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTopology(value: unknown): value is TopologyPayload {
  return isRecord(value)
    && value.type === "Topology"
    && Array.isArray(value.arcs)
    && isRecord(value.objects)
    && isRecord(value.objects.countries);
}

function isFeature(value: unknown): value is AtlasFeature {
  return isRecord(value) && value.type === "Feature" && "geometry" in value;
}

function regionFeatures(features: readonly AtlasFeature[], selectedRegionId: string | null): AtlasFeature[] {
  const names = new Set(REGION_COUNTRIES[selectedRegionId ?? ""] ?? []);
  if (names.size === 0) return [...features];
  return features.filter(item => typeof item.properties?.name === "string" && names.has(item.properties.name));
}

function pointForCluster(projection: GeoProjection, cluster: RegionCluster): [number, number] | null {
  const point = projection([cluster.center.longitude, cluster.center.latitude]);
  return point ? [point[0], point[1]] : null;
}

export function Atlas2DFallback({ entries, clusters, mode, selectedRegionId, language, onSelectRegion, onSelectEntry }: Atlas2DFallbackProps) {
  const [features, setFeatures] = useState<AtlasFeature[]>([]);
  const [assetError, setAssetError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/countries-110m.json")
      .then(response => {
        if (!response.ok) throw new Error(`Boundary asset request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then(payload => {
        if (cancelled || !isTopology(payload)) throw new Error("Boundary asset is not a TopoJSON topology");
        const collection: unknown = feature(payload, "countries");
        const next: unknown[] = isRecord(collection) && Array.isArray(collection.features) ? collection.features : [collection];
        setFeatures(next.filter(isFeature).filter(item => item.geometry !== null));
      })
      .catch(() => {
        if (!cancelled) setAssetError(true);
      });
    return () => { cancelled = true; };
  }, []);

  const visibleEntries = selectedRegionId ? entries.filter(entry => entry.locations.some(location => location.regionId === selectedRegionId)) : entries;
  const visibleFeatures = useMemo(() => regionFeatures(features, selectedRegionId), [features, selectedRegionId]);
  const collection = useMemo<FeatureCollection<Geometry, GeoJsonProperties>>(() => ({ type: "FeatureCollection", features: visibleFeatures }), [visibleFeatures]);
  const projection = useMemo(() => geoNaturalEarth1().fitSize([100, 56], collection), [collection]);
  const mapPath = useMemo(() => geoPath(projection), [projection]);
  const hasMap = visibleFeatures.length > 0;

  return (
    <div className="atlas-2d-fallback" data-testid="atlas-2d-fallback">
      <div className="atlas-2d-map-wrap">
        <svg viewBox="0 0 100 56" role="img" aria-label={language === "zh" ? "二维地图回退" : "Two-dimensional map fallback"} data-atlas-boundary-source={hasMap ? "local-topojson" : "inherited-shape-fallback"}>
          <rect x="0" y="0" width="100" height="56" fill="#e4d0a3" />
          {hasMap ? visibleFeatures.map((item, index) => {
            const path = mapPath(item);
            return path ? <path key={`${item.properties?.name ?? index}`} d={path} fill="#d5bc86" stroke="#755631" strokeWidth="0.18" opacity="0.94" /> : null;
          }) : (
            <path d="M5 16 C20 7 27 12 38 17 S58 8 68 14 S84 16 96 28 L94 43 C78 50 61 43 46 46 S19 48 7 37 Z" fill="#43575a" stroke="#a7a18f" strokeWidth=".35" opacity=".82" />
          )}
          {clusters.map(cluster => {
            const point = pointForCluster(projection, cluster);
            if (!point) return null;
            return (
              <g
                key={cluster.id}
                onClick={() => onSelectRegion(cluster.id)}
                role="button"
                tabIndex={0}
                aria-label={language === "zh" ? `${cluster.label.zh}：${cluster.count} 条档案` : `${cluster.label.en}, ${cluster.count} records`}
                aria-pressed={selectedRegionId === cluster.id}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectRegion(cluster.id);
                  }
                }}
              >
                <circle cx={point[0]} cy={point[1]} r={Math.min(2.8, 1 + cluster.count * 0.15)} fill="#9d6b2d" />
                <text x={point[0] + 1.5} y={point[1] + 1} fill="#4c341f" fontSize="2.4">{cluster.count}</text>
              </g>
            );
          })}
        </svg>
        <p className="atlas-fallback-note">{hasMap ? "2D fallback uses the same local country contours and archive filters as the 3D view." : assetError ? "Local boundary asset unavailable; showing the explicit inherited fallback shape." : "Loading local country contours…"}</p>
      </div>
      <div className="atlas-2d-entry-list" aria-label={language === "zh" ? "可访问档案列表" : "Accessible archive list"}>
        <h3>{mode === "global" ? (language === "zh" ? "地区聚类" : "Regional clusters") : (language === "zh" ? "区域档案" : "Regional records")}</h3>
        {visibleEntries.slice(0, 18).map(entry => (
          <button type="button" key={entry.id} onClick={() => onSelectEntry(entry.id)}>
            <strong>{entry.title[language]}</strong>
            <span>{getEntryDisplayPeriod(entry)[language]}</span>
            <small>{getEntryPrimaryLocation(entry)?.name[language] ?? (language === "zh" ? "地点不详" : "Unknown")}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
