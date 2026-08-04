import type { ThreeEvent } from "@react-three/fiber";
import type { Language } from "../types";
import type { RegionCluster } from "../selectors";
import { latLngToVector3 } from "../utils/geo";

interface ClusterMarker3DProps {
  cluster: RegionCluster;
  language: Language;
  onSelect: (regionId: string) => void;
}

export function ClusterMarker3D({ cluster, language, onSelect }: ClusterMarker3DProps) {
  const position = latLngToVector3(cluster.center.latitude, cluster.center.longitude, 1.67);
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(cluster.id);
  };

  return (
    <group position={position} onClick={handleClick}>
      <mesh>
        <sphereGeometry args={[Math.min(0.095 + cluster.count * 0.012, 0.2), 16, 16]} />
        <meshBasicMaterial color="#c4a76b" transparent opacity={0.92} />
      </mesh>
      <group userData={{ regionId: cluster.id, regionLabel: cluster.label[language], count: cluster.count }} />
    </group>
  );
}
