import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { createWorldBoundaryGeometry, type WorldFeature } from "./worldGeometry";
import { createWorldProjection } from "./worldProjection";

interface WorldMapLayerProps {
  features: readonly WorldFeature[];
  quality: "high" | "medium" | "low";
  motion: "full" | "reduced";
  onReady: () => void;
}

export function WorldMapLayer({ features, quality, motion, onReady }: WorldMapLayerProps) {
  const projection = useMemo(() => createWorldProjection(), []);

  const geometry = useMemo<BufferGeometry | null>(() => {
    if (features.length === 0) return null;
    return createWorldBoundaryGeometry(features, projection);
  }, [features, projection]);

  useEffect(() => {
    if (features.length > 0) onReady();
  }, [features, onReady]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return <group data-world-map-status="loading" />;
  return (
    <lineSegments geometry={geometry} data-world-boundary="topojson">
      <lineBasicMaterial color="#4f361f" transparent opacity={motion === "reduced" ? 0.9 : quality === "low" ? 0.72 : 0.86} linewidth={1} />
    </lineSegments>
  );
}
