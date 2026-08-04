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

function mapX(longitude: number): number {
  return ((longitude + 180) / 360) * 100;
}

function mapY(latitude: number): number {
  return ((90 - latitude) / 180) * 100;
}

export function Atlas2DFallback({ entries, clusters, mode, selectedRegionId, language, onSelectRegion, onSelectEntry }: Atlas2DFallbackProps) {
  const visibleEntries = selectedRegionId ? entries.filter(entry => entry.locations.some(location => location.regionId === selectedRegionId)) : entries;
  return (
    <div className="atlas-2d-fallback" data-testid="atlas-2d-fallback">
      <div className="atlas-2d-map-wrap">
        <svg viewBox="0 0 100 56" role="img" aria-label={language === "zh" ? "二维地图回退" : "Two-dimensional map fallback"}>
          <rect x="0" y="0" width="100" height="56" fill="#29383c" />
          <path d="M5 16 C20 7 27 12 38 17 S58 8 68 14 S84 16 96 28 L94 43 C78 50 61 43 46 46 S19 48 7 37 Z" fill="#43575a" stroke="#a7a18f" strokeWidth=".35" opacity=".82" />
          {clusters.map(cluster => (
            <g
              key={cluster.id}
              onClick={() => onSelectRegion(cluster.id)}
              role="button"
              tabIndex={0}
              aria-label={language === "zh" ? `${cluster.label.zh}，${cluster.count} 条档案` : `${cluster.label.en}, ${cluster.count} records`}
              aria-pressed={selectedRegionId === cluster.id}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRegion(cluster.id);
                }
              }}
            >
              <circle cx={mapX(cluster.center.longitude)} cy={(mapY(cluster.center.latitude) * 56) / 100} r={Math.min(2.8, 1 + cluster.count * 0.15)} fill="#d1b479" />
              <text x={mapX(cluster.center.longitude) + 1.5} y={(mapY(cluster.center.latitude) * 56) / 100 + 1} fill="#f4ead3" fontSize="2.4">{cluster.count}</text>
            </g>
          ))}
        </svg>
        <p className="atlas-fallback-note">{language === "zh" ? "二维回退模式：与三维场景共享筛选、地点和详情。" : "2D fallback: shares filters, locations, and details with the 3D scene."}</p>
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
