import type { ThreeEvent } from "@react-three/fiber";
import type { AtlasQualityLevel, Language } from "../types";
import type { LocationGroup } from "../rendering/locationGroups";

interface CoordinateMarker3DProps {
  group: LocationGroup;
  language: Language;
  position: [number, number, number];
  selected: boolean;
  hovered: boolean;
  qualityLevel: AtlasQualityLevel;
  onSelect: (groupId: string) => void;
  onHover: (groupId: string | null) => void;
}

export function CoordinateMarker3D({ group, language, position, selected, hovered, qualityLevel, onSelect, onHover }: CoordinateMarker3DProps) {
  const radius = Math.min(0.06 + group.entryIds.length * 0.012, 0.16);
  const color = selected ? "#f1d494" : hovered ? "#d5b46d" : "#b78a43";
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(group.id);
  };
  return (
    <group position={position} onClick={handleClick} onPointerOver={event => { event.stopPropagation(); onHover(group.id); }} onPointerOut={event => { event.stopPropagation(); onHover(null); }}>
      <mesh>
        <sphereGeometry args={[radius, qualityLevel === "low" ? 8 : 14, qualityLevel === "low" ? 8 : 14]} />
        <meshStandardMaterial color={color} emissive={selected ? "#5b3d13" : "#241607"} emissiveIntensity={selected ? 0.55 : hovered ? 0.28 : 0.12} roughness={0.46} metalness={0.28} />
      </mesh>
      {(selected || hovered || group.entryIds.length > 1) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius * 0.92, 0]}>
          <ringGeometry args={[radius * 1.25, radius * 1.48, qualityLevel === "low" ? 12 : 24]} />
          <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.54} side={2} />
        </mesh>
      )}
      <group userData={{ locationGroupId: group.id, locationLabel: group.name[language] }} />
    </group>
  );
}
