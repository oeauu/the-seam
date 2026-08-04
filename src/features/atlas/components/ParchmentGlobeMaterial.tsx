import { useEffect, useMemo } from "react";
import type { ColorRepresentation, Side } from "three";
import {
  createParchmentMaterialResource,
  disposeParchmentMaterialResource,
  type ParchmentMaterialResource,
} from "../rendering/parchmentMaterial";
import type { ParchmentQuality } from "../rendering/parchmentTexture";

export interface ParchmentGlobeMaterialProps {
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
}

export function ParchmentGlobeMaterial({
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
  side,
}: ParchmentGlobeMaterialProps) {
  const resource = useMemo<ParchmentMaterialResource>(
    () =>
      createParchmentMaterialResource({
        quality,
        seed,
        color,
        roughness,
        metalness,
        emissive,
        emissiveIntensity,
        normalScale,
        opacity,
        transparent,
        side,
      }),
    [quality, seed, color, roughness, metalness, emissive, emissiveIntensity, normalScale, opacity, transparent, side],
  );

  useEffect(() => {
    return () => {
      disposeParchmentMaterialResource(resource);
    };
  }, [resource]);

  return <primitive object={resource.material} attach="material" dispose={null} />;
}
