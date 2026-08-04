import { useEffect, useMemo, useState } from "react";
import type { BufferGeometry } from "three";
import { createWorldBoundaryGeometry, isWorldTopology, parseWorldFeatures, type WorldFeature } from "./worldGeometry";
import { createWorldProjection } from "./worldProjection";

interface WorldMapLayerProps {
  quality: "high" | "medium" | "low";
  motion: "full" | "reduced";
  onReady: () => void;
  onError: () => void;
}

export function WorldMapLayer({ quality, motion, onReady, onError }: WorldMapLayerProps) {
  const [features, setFeatures] = useState<WorldFeature[]>([]);
  const projection = useMemo(() => createWorldProjection(), []);
  useEffect(() => {
    let cancelled = false;
    fetch("/countries-110m.json")
      .then(response => {
        if (!response.ok) throw new Error(`World boundary request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then(payload => {
        if (cancelled || !isWorldTopology(payload)) throw new Error("World boundary payload is invalid");
        setFeatures(parseWorldFeatures(payload));
        onReady();
      })
      .catch(() => {
        if (!cancelled) { setFeatures([]); onError(); }
      });
    return () => { cancelled = true; };
  }, [onError, onReady]);

  const geometry = useMemo<BufferGeometry | null>(() => {
    if (features.length === 0) return null;
    return createWorldBoundaryGeometry(features, projection);
  }, [features, projection]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return <group data-world-map-status="loading" />;
  return (
    <lineSegments geometry={geometry} data-world-boundary="topojson">
      <lineBasicMaterial color="#4f361f" transparent opacity={motion === "reduced" ? 0.9 : quality === "low" ? 0.72 : 0.86} linewidth={1} />
    </lineSegments>
  );
}
