import { OrbitControls } from "@react-three/drei";
import type { ArchiveEntry, AtlasQualityLevel, Language } from "../types";
import type { RegionCluster } from "../selectors";
import { latLngToVector3 } from "../utils/geo";
import { groupEntriesByLocation } from "../rendering/locationGroups";
import { CoordinateMarkerLayer } from "./CoordinateMarkerLayer";
import { CountryBoundaryLayer } from "./CountryBoundaryLayer";
import { ClusterMarker3D } from "./ClusterMarker3D";
import { ParchmentGlobeMaterial } from "./ParchmentGlobeMaterial";

interface GlobeSceneProps {
  clusters: RegionCluster[];
  entries: ArchiveEntry[];
  language: Language;
  qualityLevel: AtlasQualityLevel;
  selectedLocationGroupId: string | null;
  hoveredLocationGroupId: string | null;
  mobile?: boolean;
  onSelectRegion: (regionId: string) => void;
  onSelectLocationGroup: (groupId: string) => void;
  onHoverLocationGroup: (groupId: string | null) => void;
}

export function GlobeScene({
  clusters,
  entries,
  language,
  qualityLevel,
  selectedLocationGroupId,
  hoveredLocationGroupId,
  mobile,
  onSelectRegion,
  onSelectLocationGroup,
  onHoverLocationGroup,
}: GlobeSceneProps) {
  const locationGroups = groupEntriesByLocation(entries);
  const regionLabelCandidates = clusters.map(cluster => {
    const position = latLngToVector3(cluster.center.latitude, cluster.center.longitude, 1.7);
    return {
      id: `region:${cluster.id}`,
      text: `${cluster.label[language]} · ${cluster.count}`,
      ariaLabel: `${cluster.label[language]}: ${cluster.count}`,
      worldPosition: position,
      surfaceNormal: position,
      priority: 100 + cluster.count,
    };
  });

  return (
    <group data-atlas-scene="global">
      <mesh>
        <sphereGeometry args={[1.6, qualityLevel === "low" ? 32 : 64, qualityLevel === "low" ? 24 : 48]} />
        <ParchmentGlobeMaterial quality={qualityLevel} seed={0x51f0cafe} color="#f0dfb3" roughness={0.92} metalness={0.02} normalScale={qualityLevel === "high" ? 0.16 : qualityLevel === "medium" ? 0.1 : 0.04} />
      </mesh>
      <mesh scale={[1.008, 1.008, 1.008]}>
        <sphereGeometry args={[1.6, qualityLevel === "low" ? 24 : 48, qualityLevel === "low" ? 16 : 32]} />
        <meshBasicMaterial color="#7f5c35" transparent opacity={0.045} wireframe />
      </mesh>
      <CountryBoundaryLayer mode="global" language={language} qualityLevel={qualityLevel} />
      {clusters.map(cluster => (
        <ClusterMarker3D key={cluster.id} cluster={cluster} language={language} onSelect={onSelectRegion} />
      ))}
      <CoordinateMarkerLayer
        groups={locationGroups}
        language={language}
        selectedGroupId={selectedLocationGroupId}
        hoveredGroupId={hoveredLocationGroupId}
        qualityLevel={qualityLevel}
        mobile={mobile}
        extraLabelCandidates={regionLabelCandidates}
        onSelectExtra={id => onSelectRegion(id.replace(/^region:/, ""))}
        onSelectGroup={onSelectLocationGroup}
        onHoverGroup={onHoverLocationGroup}
      />
      <OrbitControls enablePan={false} minDistance={3.1} maxDistance={7} enableDamping dampingFactor={0.08} rotateSpeed={qualityLevel === "low" ? 0.28 : 0.48} />
    </group>
  );
}
