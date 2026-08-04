import { OrbitControls } from "@react-three/drei";
import type { ArchiveEntry, AtlasQualityLevel, Language } from "../types";
import { getEntryPrimaryLocation } from "../selectors";
import { groupEntriesByLocation } from "../rendering/locationGroups";
import { createRegionProjectionFactory, getRegionProjectionFixture, type RegionBounds, type RegionProjectionFactory } from "../rendering/regionProjection";
import { CoordinateMarkerLayer } from "./CoordinateMarkerLayer";
import { CountryBoundaryLayer } from "./CountryBoundaryLayer";

interface RegionAtlasSceneProps {
  entries: ArchiveEntry[];
  regionId: string | null;
  language: Language;
  qualityLevel: AtlasQualityLevel;
  selectedLocationGroupId: string | null;
  hoveredLocationGroupId: string | null;
  mobile?: boolean;
  onSelectLocationGroup: (groupId: string) => void;
  onHoverLocationGroup: (groupId: string | null) => void;
}

function boundsFromEntries(entries: readonly ArchiveEntry[]): RegionBounds {
  const coordinates = entries
    .map(getEntryPrimaryLocation)
    .flatMap(location => location && typeof location.longitude === "number" && typeof location.latitude === "number"
      ? [{ longitude: location.longitude, latitude: location.latitude }]
      : []);
  const longitudes = coordinates.map(item => item.longitude);
  const latitudes = coordinates.map(item => item.latitude);
  if (longitudes.length === 0 || latitudes.length === 0) return { west: -15, east: 35, south: 25, north: 60 };
  const west = Math.max(-180, Math.min(...longitudes) - 4);
  const east = Math.min(180, Math.max(...longitudes) + 4);
  const south = Math.max(-90, Math.min(...latitudes) - 4);
  const north = Math.min(90, Math.max(...latitudes) + 4);
  return west < east && south < north ? { west, east, south, north } : { west: west - 1, east: east + 1, south: south - 1, north: north + 1 };
}

function projectionForRegion(regionId: string | null, entries: readonly ArchiveEntry[]): RegionProjectionFactory {
  const fixtureId = regionId === "europe" ? "western-europe" : regionId;
  const fixture = fixtureId === "western-europe" || fixtureId === "east-asia" || fixtureId === "north-america" || fixtureId === "southern-africa"
    ? getRegionProjectionFixture(fixtureId)
    : undefined;
  return createRegionProjectionFactory({
    bounds: fixture?.bounds ?? boundsFromEntries(entries),
    viewport: { width: 800, height: 600, padding: 48 },
    sceneScale: 0.0085,
  });
}

export function RegionAtlasScene({ entries, regionId, language, qualityLevel, selectedLocationGroupId, hoveredLocationGroupId, mobile, onSelectLocationGroup, onHoverLocationGroup }: RegionAtlasSceneProps) {
  const projection = projectionForRegion(regionId, entries);
  const locationGroups = groupEntriesByLocation(entries);
  return (
    <group data-atlas-scene="region">
      <CountryBoundaryLayer mode="region" regionId={regionId} language={language} qualityLevel={qualityLevel} projection={projection} />
      <CoordinateMarkerLayer
        groups={locationGroups}
        language={language}
        selectedGroupId={selectedLocationGroupId}
        hoveredGroupId={hoveredLocationGroupId}
        qualityLevel={qualityLevel}
        projection={projection}
        mobile={mobile}
        onSelectGroup={onSelectLocationGroup}
        onHoverGroup={onHoverLocationGroup}
      />
      <OrbitControls enablePan enableDamping dampingFactor={0.08} minDistance={2.8} maxDistance={8} rotateSpeed={qualityLevel === "low" ? 0.2 : 0.36} />
    </group>
  );
}
