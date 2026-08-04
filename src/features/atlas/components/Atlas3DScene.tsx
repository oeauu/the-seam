import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ArchiveEntry, AtlasSceneMode, Language } from "../types";
import type { RegionCluster } from "../selectors";
import { AtlasCameraRig } from "./AtlasCameraRig";
import { GlobeScene } from "./GlobeScene";
import { RegionAtlasScene } from "./RegionAtlasScene";

interface Atlas3DSceneProps {
  mode: AtlasSceneMode;
  entries: ArchiveEntry[];
  clusters: RegionCluster[];
  language: Language;
  selectedEntryId: string | null;
  focusPosition: [number, number, number] | null;
  onSelectRegion: (regionId: string) => void;
  onSelectEntry: (entryId: string) => void;
  onPerformanceDecline: () => void;
}

export default function Atlas3DScene({
  mode,
  entries,
  clusters,
  language,
  selectedEntryId,
  focusPosition,
  onSelectRegion,
  onSelectEntry,
  onPerformanceDecline,
}: Atlas3DSceneProps) {
  return (
    <Canvas
      className="atlas-canvas"
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={<div className="atlas-error-state">WebGL unavailable</div>}
    >
      <color attach="background" args={["#151d20"]} />
      <ambientLight intensity={1.25} color="#e4dbc7" />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#e1d2ae" />
      <AtlasCameraRig mode={mode} focusPosition={focusPosition} />
      <PerformanceMonitor onDecline={onPerformanceDecline} flipflops={3} />
      <Suspense fallback={null}>
        {mode === "global" ? (
          <GlobeScene clusters={clusters} entries={entries} language={language} onSelectRegion={onSelectRegion} />
        ) : (
          <RegionAtlasScene entries={entries} language={language} selectedEntryId={selectedEntryId} onSelectEntry={onSelectEntry} />
        )}
      </Suspense>
    </Canvas>
  );
}
