import type { ThreeElements } from "@react-three/fiber";
import { DoubleSide, type BufferGeometry, type ColorRepresentation, type Side } from "three";
import { ParchmentGlobeMaterial } from "./ParchmentGlobeMaterial";
import type { ParchmentQuality } from "../rendering/parchmentTexture";

export type ParchmentRegionSurfaceProps = Omit<
  ThreeElements["mesh"],
  "children" | "geometry" | "material"
> & {
  geometry: BufferGeometry;
  quality?: ParchmentQuality;
  seed?: number;
  color?: ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  normalScale?: number;
  opacity?: number;
  transparent?: boolean;
  side?: Side;
};

/** Applies the generated parchment material to caller-owned region geometry. */
export function ParchmentRegionSurface({
  geometry,
  quality = "high",
  seed,
  color,
  roughness,
  metalness,
  emissive,
  emissiveIntensity,
  normalScale,
  opacity,
  transparent,
  side = DoubleSide,
  castShadow = true,
  receiveShadow = true,
  ...meshProps
}: ParchmentRegionSurfaceProps) {
  return (
    <mesh {...meshProps} geometry={geometry} castShadow={castShadow} receiveShadow={receiveShadow}>
      <ParchmentGlobeMaterial
        quality={quality}
        seed={seed}
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        normalScale={normalScale}
        opacity={opacity}
        transparent={transparent}
        side={side}
      />
    </mesh>
  );
}
