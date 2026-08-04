import { useMemo } from "react";
import type { ArchiveEntry, Language, LocationGroup } from "../../domain/archive/types";
import { groupEntriesByLocation } from "../../domain/archive/locations";
import { getLocalizedText } from "../../domain/archive/localization";
import { parchmentPointToPixel, createWorldProjection } from "./worldProjection";
import type { WorldFeature } from "./worldGeometry";

interface CompatibilityMapProps {
  entries: readonly ArchiveEntry[];
  features: readonly WorldFeature[];
  language: Language;
  onSelectLocation: (groupId: string) => void;
}

function pathForFeature(feature: WorldFeature, projection: ReturnType<typeof createWorldProjection>): string[] {
  if (!feature.geometry) return [];
  const rings = feature.geometry.type === "Polygon" ? feature.geometry.coordinates : feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates.flat() : [];
  return rings.map(ring => ring.map((coordinate, index) => {
    const point = projection.projectLonLat(coordinate[0], coordinate[1]);
    const [x, y] = parchmentPointToPixel(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ") + " Z");
}

export function CompatibilityMap({ entries, features, language, onSelectLocation }: CompatibilityMapProps) {
  const projection = useMemo(() => createWorldProjection(), []);
  const groups = useMemo<readonly LocationGroup[]>(() => groupEntriesByLocation(entries), [entries]);
  return (
    <div className="map-fallback" data-testid="compatibility-map" data-fallback-map="topojson">
      <svg className="map-fallback__paper" viewBox="0 0 720 400" role="img" aria-label="二维兼容羊皮卷世界地图">
        <g fill="none" stroke="#5f4324" strokeWidth="1.15" opacity="0.76">
          {features.flatMap((item, index) => pathForFeature(item, projection).map((path, pathIndex) => <path key={`${index}-${pathIndex}`} d={path} />))}
        </g>
        <g>
          {groups.map(group => {
            const point = projection.projectLonLat(group.longitude, group.latitude);
            const [x, y] = parchmentPointToPixel(point);
            return <circle key={group.id} cx={x} cy={y} r={group.entryIds.length > 1 ? 4.8 : 3.6} fill="#a97829" stroke="#432b13" strokeWidth="1" role="button" tabIndex={0} aria-label={getLocalizedText(group.displayName, language)} onClick={() => onSelectLocation(group.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onSelectLocation(group.id); }} />;
          })}
        </g>
        <text x="360" y="30" textAnchor="middle" fill="#573a1c" fontSize="13" letterSpacing="3">PARCHMENT WORLD MAP · COMPATIBILITY VIEW</text>
      </svg>
    </div>
  );
}
