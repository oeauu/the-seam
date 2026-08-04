import { useMemo } from "react";
import type { AtlasQualityLevel, Language } from "../types";
import type { LocationGroup } from "../rendering/locationGroups";
import type { RegionProjectionFactory } from "../rendering/regionProjection";
import { latLngToVector3 } from "../utils/geo";
import { AtlasLabelLayer } from "./AtlasLabelLayer";
import { CoordinateMarker3D } from "./CoordinateMarker3D";
import type { LabelCandidate } from "../rendering/labelLayout";

interface CoordinateMarkerLayerProps {
  groups: readonly LocationGroup[];
  language: Language;
  selectedGroupId: string | null;
  hoveredGroupId: string | null;
  qualityLevel: AtlasQualityLevel;
  projection?: RegionProjectionFactory;
  mobile?: boolean;
  extraLabelCandidates?: readonly LabelCandidate[];
  onSelectExtra?: (id: string) => void;
  onSelectGroup: (groupId: string) => void;
  onHoverGroup: (groupId: string | null) => void;
}

function scenePosition(group: LocationGroup, projection?: RegionProjectionFactory): [number, number, number] {
  if (!projection) {
    return latLngToVector3(group.latitude, group.longitude, 1.65);
  }
  const [x, , z] = projection.markerPosition([group.longitude, group.latitude]);
  return [x, -z, 0.09];
}

export function CoordinateMarkerLayer({ groups, language, selectedGroupId, hoveredGroupId, qualityLevel, projection, mobile, extraLabelCandidates = [], onSelectExtra, onSelectGroup, onHoverGroup }: CoordinateMarkerLayerProps) {
  const positions = useMemo(() => new Map(groups.map(group => [group.id, scenePosition(group, projection)])), [groups, projection]);
  const locationLabelCandidates = useMemo(() => groups.map(group => {
    const position = positions.get(group.id) ?? [0, 0, 0] as [number, number, number];
    const surfaceNormal: [number, number, number] = projection ? [0, 0, 1] : [position[0], position[1], position[2]];
    return {
      id: group.id,
      text: `${group.name[language]}${group.entryIds.length > 1 ? ` · ${group.entryIds.length}` : ""}`,
      ariaLabel: `${group.name[language]}, ${group.entryIds.length} ${group.entryIds.length === 1 ? "record" : "records"}`,
      worldPosition: position,
      surfaceNormal,
      priority: group.entryIds.length > 1
        ? 180 + group.entryIds.length
        : 10 + (group.precision === "exact" ? 4 : 0),
      selected: group.id === selectedGroupId,
      hovered: group.id === hoveredGroupId,
    };
  }), [groups, language, positions, projection, selectedGroupId, hoveredGroupId]);
  const labelCandidates = useMemo(() => [...extraLabelCandidates, ...locationLabelCandidates], [extraLabelCandidates, locationLabelCandidates]);
  const extraIds = useMemo(() => new Set(extraLabelCandidates.map(candidate => candidate.id)), [extraLabelCandidates]);

  return (
    <group data-atlas-marker-layer="coordinates">
      {groups.map(group => {
        const position = positions.get(group.id);
        if (!position) return null;
        return <CoordinateMarker3D key={group.id} group={group} language={language} position={position} selected={group.id === selectedGroupId} hovered={group.id === hoveredGroupId} qualityLevel={qualityLevel} onSelect={onSelectGroup} onHover={onHoverGroup} />;
      })}
      <AtlasLabelLayer
        candidates={labelCandidates}
        selectedId={selectedGroupId}
        hoveredId={hoveredGroupId}
        maxLabels={qualityLevel === "high" ? 18 : qualityLevel === "medium" ? 12 : 8}
        mobile={mobile}
        mobileMaxLabels={5}
        onSelect={id => extraIds.has(id) ? onSelectExtra?.(id) : onSelectGroup(id)}
        onHover={id => extraIds.has(id ?? "") ? onHoverGroup(null) : onHoverGroup(id)}
      />
    </group>
  );
}
