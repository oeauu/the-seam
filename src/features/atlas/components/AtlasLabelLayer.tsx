import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Vector3 } from "three";
import {
  layoutAtlasLabels,
  type LabelCandidate,
  type LabelLayoutResult,
  type LabelProjection,
} from "../rendering/labelLayout";

export interface AtlasLabelLayerProps {
  readonly candidates: readonly LabelCandidate[];
  readonly selectedId?: string | null;
  readonly hoveredId?: string | null;
  readonly maxLabels?: number;
  readonly mobile?: boolean;
  readonly mobileMaxLabels?: number;
  readonly enabled?: boolean;
  readonly onSelect?: (id: string) => void;
  readonly onHover?: (id: string | null) => void;
  readonly className?: string;
}

const EMPTY_LAYOUT: LabelLayoutResult = { visibleLabels: [], hiddenLabels: [] };

function projectCandidate(candidate: LabelCandidate, camera: Parameters<Vector3["project"]>[0]): LabelProjection {
  const worldPosition = new Vector3(...candidate.worldPosition);
  const projected = worldPosition.clone().project(camera);
  const cameraPosition = camera.getWorldPosition(new Vector3());
  const surfaceNormal = candidate.surfaceNormal
    ? new Vector3(...candidate.surfaceNormal)
    : new Vector3(0, 0, 1);
  if (surfaceNormal.lengthSq() === 0) surfaceNormal.set(0, 0, 1);
  surfaceNormal.normalize();

  const toCamera = cameraPosition.sub(worldPosition);
  if (toCamera.lengthSq() > 0) toCamera.normalize();

  return {
    ndcX: projected.x,
    ndcY: projected.y,
    ndcZ: projected.z,
    facing: surfaceNormal.dot(toCamera),
  };
}

function layoutSignature(layout: LabelLayoutResult): string {
  return layout.visibleLabels
    .map(label => [
      label.candidate.id,
      label.candidate.text,
      label.candidate.ariaLabel ?? "",
      label.candidate.selected ? "selected" : "",
      label.candidate.hovered ? "hovered" : "",
      Math.round(label.bounds.left),
      Math.round(label.bounds.top),
      Math.round(label.bounds.width),
      Math.round(label.bounds.height),
      label.placement,
    ].join(":"))
    .join("|");
}

const overlayStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};

export function AtlasLabelLayer({
  candidates,
  selectedId = null,
  hoveredId = null,
  maxLabels,
  mobile,
  mobileMaxLabels,
  enabled = true,
  onSelect,
  onHover,
  className = "atlas-label-layer",
}: AtlasLabelLayerProps) {
  const { camera, size } = useThree();
  const [layout, setLayout] = useState<LabelLayoutResult>(EMPTY_LAYOUT);
  const signatureRef = useRef("");
  const frameCounterRef = useRef(0);
  const resolvedCandidates = useMemo(
    () => candidates.map(candidate => ({
      ...candidate,
      selected: Boolean(candidate.selected || candidate.id === selectedId),
      hovered: Boolean(candidate.hovered || candidate.id === hoveredId),
    })),
    [candidates, hoveredId, selectedId],
  );
  const updateLayout = useCallback(() => {
    if (!enabled || size.width <= 0 || size.height <= 0) {
      if (signatureRef.current !== "") {
        signatureRef.current = "";
        setLayout(EMPTY_LAYOUT);
      }
      return;
    }

    const nextLayout = layoutAtlasLabels(resolvedCandidates, {
      viewport: { width: size.width, height: size.height },
      project: candidate => projectCandidate(candidate, camera),
      maxLabels,
      mobile: mobile ?? size.width <= 640,
      mobileMaxLabels,
    });
    const nextSignature = layoutSignature(nextLayout);
    if (nextSignature === signatureRef.current) return;
    signatureRef.current = nextSignature;
    setLayout(nextLayout);
  }, [camera, enabled, maxLabels, mobile, mobileMaxLabels, resolvedCandidates, size.height, size.width]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useFrame(() => {
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 4 === 0) updateLayout();
  });

  if (!enabled) return null;

  return (
    <Html fullscreen zIndexRange={[4, 0]}>
      <div className={className} style={overlayStyle} data-testid="atlas-label-layer">
        {layout.visibleLabels.map(label => {
          const interactive = Boolean(onSelect || onHover);
          const labelStyle: CSSProperties = {
            position: "absolute",
            left: 0,
            top: 0,
            width: `${Math.round(label.bounds.width)}px`,
            minHeight: `${Math.round(label.bounds.height)}px`,
            transform: `translate3d(${Math.round(label.bounds.left)}px, ${Math.round(label.bounds.top)}px, 0)`,
            display: "block",
            boxSizing: "border-box",
            overflow: "hidden",
            padding: "0.18rem 0.35rem",
            border: 0,
            borderBottom: label.candidate.selected ? "1px solid rgba(208, 170, 85, 0.9)" : "1px solid rgba(41, 35, 27, 0.32)",
            background: label.candidate.selected ? "rgba(212, 193, 151, 0.94)" : "rgba(212, 193, 151, 0.78)",
            color: "#29231b",
            font: "inherit",
            fontSize: "0.7rem",
            lineHeight: 1.2,
            textAlign: "left",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: onSelect ? "pointer" : "default",
            pointerEvents: interactive ? "auto" : "none",
            zIndex: label.candidate.selected ? 3 : label.candidate.hovered ? 2 : 1,
          };
          const labelContent = <span>{label.candidate.text}</span>;

          if (!onSelect) {
            return (
              <span
                key={label.candidate.id}
                aria-label={label.candidate.ariaLabel ?? label.candidate.text}
                data-hovered={label.candidate.hovered || undefined}
                data-selected={label.candidate.selected || undefined}
                data-testid={`atlas-label-${label.candidate.id}`}
                style={labelStyle}
                onMouseEnter={() => onHover?.(label.candidate.id)}
                onMouseLeave={() => onHover?.(null)}
              >
                {labelContent}
              </span>
            );
          }

          return (
            <button
              key={label.candidate.id}
              type="button"
              aria-label={label.candidate.ariaLabel ?? label.candidate.text}
              aria-pressed={label.candidate.selected}
              data-hovered={label.candidate.hovered || undefined}
              data-selected={label.candidate.selected || undefined}
              data-testid={`atlas-label-${label.candidate.id}`}
              style={labelStyle}
              onClick={() => onSelect(label.candidate.id)}
              onMouseEnter={() => onHover?.(label.candidate.id)}
              onMouseLeave={() => onHover?.(null)}
            >
              {labelContent}
            </button>
          );
        })}
      </div>
    </Html>
  );
}
