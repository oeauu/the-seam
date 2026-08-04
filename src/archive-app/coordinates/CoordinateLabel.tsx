import { Html } from "@react-three/drei";
import type { Language, LocationGroup } from "../../domain/archive/types";

interface CoordinateLabelProps {
  group: LocationGroup;
  position: [number, number, number];
  language: Language;
  visible: boolean;
  offsetX: number;
  offsetY: number;
}

export function CoordinateLabel({ group, position, language, visible, offsetX, offsetY }: CoordinateLabelProps) {
  if (!visible) return null;
  return (
    <Html position={position} transform={false} occlude={false} style={{ pointerEvents: "none" }}>
      <span className="parchment-label" style={{ transform: `translate(${(offsetX * 4.2).toFixed(2)}rem, ${(offsetY * 4.2).toFixed(2)}rem)` }}>
        {group.displayName[language]}
      </span>
    </Html>
  );
}
