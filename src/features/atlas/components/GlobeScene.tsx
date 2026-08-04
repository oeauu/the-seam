import { OrbitControls } from "@react-three/drei";
import type { ArchiveEntry, Language } from "../types";
import type { RegionCluster } from "../selectors";
import { ClusterMarker3D } from "./ClusterMarker3D";
import { latLngToVector3 } from "../utils/geo";

interface GlobeSceneProps {
  clusters: RegionCluster[];
  entries: ArchiveEntry[];
  language: Language;
  onSelectRegion: (regionId: string) => void;
}

export function GlobeScene({ clusters, entries, language, onSelectRegion }: GlobeSceneProps) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.6, 48, 48]} />
        <meshStandardMaterial color="#34454b" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#d6c8a4" wireframe transparent opacity={0.16} />
      </mesh>
      {clusters.map(cluster => (
        <ClusterMarker3D key={cluster.id} cluster={cluster} language={language} onSelect={onSelectRegion} />
      ))}
      {entries.slice(0, 8).map(entry => {
        const location = entry.locations.find(item => item.isPrimary);
        if (!location || location.latitude === null || location.longitude === null) return null;
        const position = latLngToVector3(location.latitude, location.longitude, 1.63);
        return (
          <mesh key={`${entry.id}-representative`} position={position}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#eee3c9" transparent opacity={0.72} />
          </mesh>
        );
      })}
      <OrbitControls enablePan={false} minDistance={3.1} maxDistance={7} enableDamping dampingFactor={0.08} />
    </group>
  );
}
