import type {
  AtlasRenderMode,
  AtlasState,
  CameraPose,
  HistoricalRange,
} from "../types";

export const initialAtlasState: AtlasState = {
  renderMode: "auto",
  qualityLevel: "high",
  motionProfile: "full",
  sceneMode: "global",
  selectedRegionId: null,
  selectedLocationGroupId: null,
  selectedEntryId: null,
  previousCameraPose: null,
  previewRange: { start: null, end: null },
  committedRange: { start: null, end: null },
  isTimelineDragging: false,
  hoveredMarkerId: null,
  timeRange: { start: null, end: null },
  includeUndated: true,
  selectedSourceIds: [],
  selectedMeaningIds: [],
  selectedObjectTypeIds: [],
  cameraTransition: "idle",
};

export type AtlasAction =
  | { type: "SET_RENDER_MODE"; mode: AtlasRenderMode }
  | { type: "SET_QUALITY_LEVEL"; level: AtlasState["qualityLevel"] }
  | { type: "SET_MOTION_PROFILE"; profile: AtlasState["motionProfile"] }
  | { type: "ENTER_REGION"; regionId: string }
  | { type: "SELECT_LOCATION_GROUP"; groupId: string | null }
  | { type: "FOCUS_ENTRY"; entryId: string; cameraPose: CameraPose | null }
  | { type: "BACK_TO_REGION" }
  | { type: "BACK_TO_GLOBAL" }
  | { type: "FINISH_TRANSITION" }
  | { type: "SET_PREVIEW_RANGE"; range: HistoricalRange }
  | { type: "COMMIT_TIME_RANGE"; range: HistoricalRange }
  | { type: "SET_TIMELINE_DRAGGING"; dragging: boolean }
  | { type: "SET_HOVERED_MARKER"; markerId: string | null }
  | { type: "SET_TIME_RANGE"; range: HistoricalRange }
  | { type: "SET_INCLUDE_UNDATED"; include: boolean }
  | { type: "SET_SOURCE_FILTERS"; ids: string[] }
  | { type: "SET_MEANING_FILTERS"; ids: string[] }
  | { type: "SET_OBJECT_FILTERS"; ids: string[] }
  | { type: "RESTORE"; state: AtlasState };

export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case "SET_RENDER_MODE":
      return { ...state, renderMode: action.mode };
    case "SET_QUALITY_LEVEL":
      return { ...state, qualityLevel: action.level };
    case "SET_MOTION_PROFILE":
      return { ...state, motionProfile: action.profile };
    case "ENTER_REGION":
      return {
        ...state,
        sceneMode: "region",
        selectedRegionId: action.regionId,
        selectedLocationGroupId: null,
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "entering",
      };
    case "SELECT_LOCATION_GROUP":
      return {
        ...state,
        selectedLocationGroupId: action.groupId,
        selectedEntryId: null,
      };
    case "FOCUS_ENTRY":
      return {
        ...state,
        sceneMode: "focused",
        selectedLocationGroupId: null,
        selectedEntryId: action.entryId,
        previousCameraPose: action.cameraPose,
        cameraTransition: "focusing",
      };
    case "BACK_TO_REGION":
      return {
        ...state,
        sceneMode: "region",
        selectedLocationGroupId: null,
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "returning",
      };
    case "BACK_TO_GLOBAL":
      return {
        ...state,
        sceneMode: "global",
        selectedRegionId: null,
        selectedLocationGroupId: null,
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "returning",
      };
    case "FINISH_TRANSITION":
      return { ...state, cameraTransition: "idle" };
    case "SET_PREVIEW_RANGE":
      return { ...state, previewRange: action.range, timeRange: action.range };
    case "COMMIT_TIME_RANGE":
      return {
        ...state,
        previewRange: action.range,
        committedRange: action.range,
        timeRange: action.range,
        isTimelineDragging: false,
      };
    case "SET_TIMELINE_DRAGGING":
      return { ...state, isTimelineDragging: action.dragging };
    case "SET_HOVERED_MARKER":
      return { ...state, hoveredMarkerId: action.markerId };
    case "SET_TIME_RANGE":
      return {
        ...state,
        previewRange: action.range,
        committedRange: action.range,
        timeRange: action.range,
      };
    case "SET_INCLUDE_UNDATED":
      return { ...state, includeUndated: action.include };
    case "SET_SOURCE_FILTERS":
      return { ...state, selectedSourceIds: action.ids };
    case "SET_MEANING_FILTERS":
      return { ...state, selectedMeaningIds: action.ids };
    case "SET_OBJECT_FILTERS":
      return { ...state, selectedObjectTypeIds: action.ids };
    case "RESTORE":
      return action.state;
    default:
      return state;
  }
}
