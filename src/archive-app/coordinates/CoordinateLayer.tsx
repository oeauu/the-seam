import { useMemo } from "react";
import type { ArchiveEntry, Language, LocationGroup } from "../../domain/archive/types";
import { groupEntriesByLocation } from "../../domain/archive/locations";
import { getLocalizedText } from "../../domain/archive/localization";
import { getPreviewVisibility } from "../../domain/archive/selectors";
import { createWorldProjection } from "../map/worldProjection";
import { sampleParchmentSurface } from "../parchment/parchmentSurface";
import { layoutCoordinateLabels } from "./coordinateLayout";
import { CoordinateLabel } from "./CoordinateLabel";
import { CoordinateMarker } from "./CoordinateMarker";

interface CoordinateLayerProps {
  entries: readonly ArchiveEntry[];
  previewRange: { start: number | null; end: number | null };
  language: Language;
  quality: "high" | "medium" | "low";
  onSelectLocation: (groupId: string) => void;
  selectedGroupId: string | null;
  onPointerActivity: (dragging: boolean) => void;
}

interface ProjectedGroup {
  group: LocationGroup;
  position: [number, number, number];
  visibility: number;
}

export function CoordinateLayer({ entries, previewRange, language, quality, onSelectLocation, selectedGroupId, onPointerActivity }: CoordinateLayerProps) {
  const projection = useMemo(() => createWorldProjection(), []);
  const groups = useMemo(() => groupEntriesByLocation(entries), [entries]);
  const projected = useMemo<ProjectedGroup[]>(() => groups.map(group => {
    const point = projection.projectLonLat(group.longitude, group.latitude);
    const surface = sampleParchmentSurface(point.x, point.y);
    const visibility = Math.max(...group.entryIds.map(id => {
      const entry = entries.find(item => item.id === id);
      return entry ? getPreviewVisibility(entry, previewRange) : 0;
    }));
    return { group, position: [point.x, point.y, surface.position[2] + 0.11], visibility };
  }), [entries, groups, previewRange, projection]);
  const labels = useMemo(() => layoutCoordinateLabels(projected.map(item => ({
    id: item.group.id,
    x: item.position[0],
    y: item.position[1],
    width: Math.max(0.7, getLocalizedText(item.group.displayName, language).length * 0.055),
    height: 0.16,
    priority: item.group.priority,
  })), quality === "low"), [language, projected, quality]);

  return (
    <group data-coordinate-layer="parchment">
      {projected.map(item => {
        const label = labels.find(candidate => candidate.id === item.group.id);
        return (
          <group key={item.group.id} visible={item.visibility > 0.08}>
            <CoordinateMarker
              group={item.group}
              position={item.position}
              selected={selectedGroupId === item.group.id}
              onSelect={onSelectLocation}
              onPointerActivity={onPointerActivity}
            />
            {label && (
              <CoordinateLabel
                group={item.group}
                position={[item.position[0], item.position[1], item.position[2] + 0.015]}
                language={language}
                visible={label.visible}
                offsetX={label.offsetX}
                offsetY={label.offsetY}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
