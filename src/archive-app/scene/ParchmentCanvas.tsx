import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { CameraState } from "../state/archiveAppReducer";
import { CoordinateLayer } from "../coordinates/CoordinateLayer";
import { WorldMapLayer } from "../map/WorldMapLayer";
import type { WorldFeature } from "../map/worldGeometry";
import { ParchmentScrollMesh } from "../parchment/ParchmentScrollMesh";
import { SceneLighting } from "./SceneLighting";
import type { ArchiveEntry, Language } from "../../domain/archive/types";

interface ParchmentCanvasProps {
  camera: CameraState;
  entries: readonly ArchiveEntry[];
  worldFeatures: readonly WorldFeature[];
  previewRange: { start: number | null; end: number | null };
  language: Language;
  motion: "full" | "reduced";
  quality: "high" | "medium" | "low";
  onSelectLocation: (groupId: string) => void;
  selectedGroupId: string | null;
  onPointerActivity: (dragging: boolean) => void;
  onMapReady: () => void;
}

function CameraStateSync({ camera }: { camera: CameraState }) {
  const { camera: activeCamera } = useThree();
  useEffect(() => {
    const distance = 7.2 / camera.zoom;
    activeCamera.position.set(camera.target[0], camera.target[1] + 1.1, distance);
    activeCamera.lookAt(camera.target[0], camera.target[1], 0);
    activeCamera.updateProjectionMatrix();
  }, [activeCamera, camera]);
  return null;
}

export function ParchmentCanvas({ camera, entries, worldFeatures, previewRange, language, motion, quality, onSelectLocation, selectedGroupId, onPointerActivity, onMapReady }: ParchmentCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 7.2], fov: 32, near: 0.1, far: 100 }}
      frameloop="demand"
      dpr={quality === "high" ? [1, 1.5] : [1, 1]}
      gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        if (!gl.getContext()) onPointerActivity(false);
      }}
      data-testid="parchment-canvas"
    >
      <color attach="background" args={["#30251c"]} />
      <CameraStateSync camera={camera} />
      <SceneLighting />
      <ParchmentScrollMesh quality={quality} />
      <WorldMapLayer features={worldFeatures} quality={quality} motion={motion} onReady={onMapReady} />
      <CoordinateLayer
        entries={entries}
        previewRange={previewRange}
        language={language}
        quality={quality}
        onSelectLocation={onSelectLocation}
        selectedGroupId={selectedGroupId}
        onPointerActivity={onPointerActivity}
      />
    </Canvas>
  );
}
