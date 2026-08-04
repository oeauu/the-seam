import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { LocationGroup } from "../../domain/archive/types";

interface CoordinateMarkerProps {
  group: LocationGroup;
  position: [number, number, number];
  selected: boolean;
  onSelect: (groupId: string) => void;
  onPointerActivity: (dragging: boolean) => void;
}

export function CoordinateMarker({ group, position, selected, onSelect, onPointerActivity }: CoordinateMarkerProps) {
  const pointerRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const radius = group.entryIds.length > 1 ? 0.075 : 0.055;
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (pointerRef.current?.moved) { pointerRef.current = null; return; }
    event.stopPropagation();
    onSelect(group.id);
  };
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY, moved: false };
    onPointerActivity(false);
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const pointer = pointerRef.current;
    if (!pointer) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) pointer.moved = true;
  };
  const handlePointerUp = () => { onPointerActivity(false); };
  return (
    <group
      position={position}
      userData={{ coordinateGroupId: group.id }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <mesh castShadow>
        <sphereGeometry args={[radius, 16, 12]} />
        <meshStandardMaterial color={selected ? "#f1d38a" : "#b68739"} emissive="#5e3b10" emissiveIntensity={selected ? 0.42 : 0.12} roughness={0.44} metalness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius * 0.86, 0]}>
        <ringGeometry args={[radius * 1.35, radius * 1.62, 24]} />
        <meshBasicMaterial color={selected ? "#e5bd61" : "#9a6e27"} transparent opacity={selected ? 0.92 : 0.62} />
      </mesh>
    </group>
  );
}
