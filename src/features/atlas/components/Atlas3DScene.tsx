import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ArchiveEntry, AtlasMotionProfile, AtlasQualityLevel, AtlasSceneMode, Language } from "../types";
import type { RegionCluster } from "../selectors";
import { AtlasCameraRig } from "./AtlasCameraRig";
import { GlobeScene } from "./GlobeScene";
import { RegionAtlasScene } from "./RegionAtlasScene";

interface Atlas3DSceneProps {
  mode: AtlasSceneMode;
  entries: ArchiveEntry[];
  clusters: RegionCluster[];
  language: Language;
  regionId: string | null;
  qualityLevel: AtlasQualityLevel;
  motionProfile: AtlasMotionProfile;
  selectedLocationGroupId: string | null;
  hoveredLocationGroupId: string | null;
  focusPosition: [number, number, number] | null;
  mobile?: boolean;
  onSelectRegion: (regionId: string) => void;
  onSelectLocationGroup: (groupId: string) => void;
  onHoverLocationGroup: (groupId: string | null) => void;
  onPerformanceDecline: () => void;
  onPerformanceRecover: () => void;
}

export default function Atlas3DScene({
  mode,
  entries,
  clusters,
  language,
  regionId,
  qualityLevel,
  motionProfile,
  selectedLocationGroupId,
  hoveredLocationGroupId,
  focusPosition,
  mobile,
  onSelectRegion,
  onSelectLocationGroup,
  onHoverLocationGroup,
  onPerformanceDecline,
  onPerformanceRecover,
}: Atlas3DSceneProps) {
  const dpr: [number, number] = qualityLevel === "high" ? [1, 1.6] : qualityLevel === "medium" ? [0.85, 1.25] : [0.7, 1];
  return (
    <Canvas
      className="atlas-canvas"
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={dpr}
      gl={{ antialias: qualityLevel !== "low", alpha: true, powerPreference: qualityLevel === "high" ? "high-performance" : "default" }}
      fallback={<div className="atlas-error-state">WebGL unavailable</div>}
    >
      <color attach="background" args={["#c8b58d"]} />
      <ambientLight intensity={motionProfile === "reduced" ? 1.08 : 1.24} color="#f1e3bf" />
      <directionalLight position={[3, 4, 5]} intensity={qualityLevel === "low" ? 0.9 : 1.3} color="#e1c886" />
      <directionalLight position={[-3, -1, -2]} intensity={0.42} color="#6f5532" />
      <AtlasCameraRig mode={mode} focusPosition={focusPosition} reducedMotion={motionProfile === "reduced"} />
      <PerformanceMonitor onDecline={onPerformanceDecline} onIncline={onPerformanceRecover} flipflops={3} />
      <Suspense fallback={null}>
        {mode === "global" ? (
          <GlobeScene
            clusters={clusters}
            entries={entries}
            language={language}
            qualityLevel={qualityLevel}
            selectedLocationGroupId={selectedLocationGroupId}
            hoveredLocationGroupId={hoveredLocationGroupId}
            mobile={mobile}
            onSelectRegion={onSelectRegion}
            onSelectLocationGroup={onSelectLocationGroup}
            onHoverLocationGroup={onHoverLocationGroup}
          />
        ) : (
          <RegionAtlasScene
            entries={entries}
            regionId={regionId}
            language={language}
            qualityLevel={qualityLevel}
            selectedLocationGroupId={selectedLocationGroupId}
            hoveredLocationGroupId={hoveredLocationGroupId}
            mobile={mobile}
            onSelectLocationGroup={onSelectLocationGroup}
            onHoverLocationGroup={onHoverLocationGroup}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
