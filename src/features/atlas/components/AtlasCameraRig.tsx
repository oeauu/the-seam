import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { AtlasSceneMode } from "../types";

interface AtlasCameraRigProps {
  mode: AtlasSceneMode;
  focusPosition: [number, number, number] | null;
}

export function AtlasCameraRig({ mode, focusPosition }: AtlasCameraRigProps) {
  const { camera } = useThree();
  const target = useRef(new Vector3(0, 0, 0));
  const desiredPosition = useRef(new Vector3(0, 0, 5.2));

  useEffect(() => {
    if (mode === "global") {
      desiredPosition.current.set(0, 0, 5.2);
      target.current.set(0, 0, 0);
      return;
    }
    if (mode === "focused" && focusPosition) {
      desiredPosition.current.set(focusPosition[0] * 0.25, focusPosition[1] * 0.25, 3.3);
      target.current.set(focusPosition[0], focusPosition[1], 0);
      return;
    }
    desiredPosition.current.set(0, 0.2, 4.4);
    target.current.set(0, 0, 0);
  }, [focusPosition, mode]);

  useFrame((_state, delta) => {
    const factor = 1 - Math.pow(0.001, delta);
    camera.position.lerp(desiredPosition.current, factor);
    camera.lookAt(target.current);
  });

  return null;
}
