import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { createParchmentCurlGeometry, createParchmentGeometry } from "./parchmentGeometry";
import { getParchmentResources, type ParchmentQuality } from "./parchmentMaterial";

interface ParchmentScrollMeshProps {
  quality: ParchmentQuality;
}

const DIMENSIONS = { width: 6.8, height: 3.7 };

export function ParchmentScrollMesh({ quality }: ParchmentScrollMeshProps) {
  const geometry = useMemo<BufferGeometry>(() => createParchmentGeometry({
    ...DIMENSIONS,
    segmentsX: quality === "high" ? 144 : quality === "medium" ? 96 : 56,
    segmentsY: quality === "high" ? 72 : quality === "medium" ? 48 : 30,
  }), [quality]);
  const curls = useMemo(() => [
    createParchmentCurlGeometry(DIMENSIONS.width, DIMENSIONS.height / 2),
    createParchmentCurlGeometry(DIMENSIONS.width, -DIMENSIONS.height / 2),
  ], []);
  const material = useMemo(() => getParchmentResources(quality).material, [quality]);

  useEffect(() => () => {
    geometry.dispose();
    curls.forEach(curl => curl.dispose());
  }, [curls, geometry]);

  return (
    <group data-parchment-object="scroll">
      <mesh geometry={geometry} material={material} position={[0, 0, 0]} />
      {curls.map((curl, index) => (
        <mesh key={index} geometry={curl} material={material} position={[0, 0, index === 0 ? 0.01 : -0.005]} />
      ))}
    </group>
  );
}

export { DIMENSIONS as PARCHMENT_DIMENSIONS };
