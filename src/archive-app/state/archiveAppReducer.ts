import type { ArchiveEntry, HistoricalRange } from "../../domain/archive/types";

export interface CameraState {
  target: [number, number];
  zoom: number;
}

export interface CameraSnapshot extends CameraState {}

export type RenderingCapability = "webgl" | "fallback";
export type DrawerState = "closed" | "open";

export interface ArchiveAppState {
  camera: CameraState;
  cameraSnapshot: CameraSnapshot | null;
  selectedLocationGroupId: string | null;
  selectedEntryId: string | null;
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isTimelineDragging: boolean;
  includeUndated: boolean;
  drawerState: DrawerState;
  motionPreference: "full" | "reduced";
  renderingCapability: RenderingCapability;
  routeRecord: ArchiveEntry | null;
  commitCount: number;
}

export const INITIAL_CAMERA: CameraState = { target: [0, 0], zoom: 1 };
export const INITIAL_RANGE: HistoricalRange = { start: -500, end: 2026 };

export const initialArchiveAppState: ArchiveAppState = {
  camera: INITIAL_CAMERA,
  cameraSnapshot: null,
  selectedLocationGroupId: null,
  selectedEntryId: null,
  previewRange: INITIAL_RANGE,
  committedRange: INITIAL_RANGE,
  isTimelineDragging: false,
  includeUndated: true,
  drawerState: "closed",
  motionPreference: "full",
  renderingCapability: "webgl",
  routeRecord: null,
  commitCount: 0,
};

export type ArchiveAppAction =
  | { type: "pan"; target: [number, number] }
  | { type: "zoom"; zoom: number }
  | { type: "reset-camera" }
  | { type: "select-location"; groupId: string | null }
  | { type: "open-record"; entry: ArchiveEntry }
  | { type: "close-drawer" }
  | { type: "set-preview-range"; range: HistoricalRange }
  | { type: "set-committed-range"; range: HistoricalRange }
  | { type: "set-timeline-dragging"; value: boolean }
  | { type: "set-include-undated"; value: boolean }
  | { type: "set-motion"; value: "full" | "reduced" }
  | { type: "set-capability"; value: RenderingCapability }
  | { type: "set-route-record"; entry: ArchiveEntry | null };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeRange(range: HistoricalRange): HistoricalRange {
  const start = range.start ?? -500;
  const end = range.end ?? 2026;
  return start <= end ? { start, end } : { start: end, end: start };
}

export function archiveAppReducer(state: ArchiveAppState, action: ArchiveAppAction): ArchiveAppState {
  switch (action.type) {
    case "pan":
      return { ...state, camera: { ...state.camera, target: action.target } };
    case "zoom":
      return { ...state, camera: { ...state.camera, zoom: clamp(action.zoom, 0.72, 1.85) } };
    case "reset-camera":
      return { ...state, camera: INITIAL_CAMERA };
    case "select-location":
      return { ...state, selectedLocationGroupId: action.groupId };
    case "open-record":
      return {
        ...state,
        cameraSnapshot: { ...state.camera, target: [...state.camera.target] },
        selectedEntryId: action.entry.id,
        selectedLocationGroupId: null,
        drawerState: "open",
        routeRecord: action.entry,
      };
    case "close-drawer":
      return {
        ...state,
        camera: state.cameraSnapshot ?? state.camera,
        cameraSnapshot: null,
        drawerState: "closed",
        selectedEntryId: null,
        routeRecord: null,
      };
    case "set-preview-range":
      return { ...state, previewRange: normalizeRange(action.range) };
    case "set-committed-range":
      return { ...state, committedRange: normalizeRange(action.range), commitCount: state.commitCount + 1 };
    case "set-timeline-dragging":
      return { ...state, isTimelineDragging: action.value };
    case "set-include-undated":
      return { ...state, includeUndated: action.value };
    case "set-motion":
      return { ...state, motionPreference: action.value };
    case "set-capability":
      return { ...state, renderingCapability: action.value };
    case "set-route-record":
      return { ...state, routeRecord: action.entry };
    default:
      return state;
  }
}
