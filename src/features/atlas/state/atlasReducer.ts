import type {
  AtlasRenderMode,
  AtlasState,
  CameraPose,
  HistoricalRange,
} from "../types";

export const initialAtlasState: AtlasState = {
  renderMode: "auto",
  sceneMode: "global",
  selectedRegionId: null,
  selectedEntryId: null,
  previousCameraPose: null,
  timeRange: { start: null, end: null },
  includeUndated: true,
  selectedSourceIds: [],
  selectedMeaningIds: [],
  selectedObjectTypeIds: [],
  cameraTransition: "idle",
};

export type AtlasAction =
  | { type: "SET_RENDER_MODE"; mode: AtlasRenderMode }
  | { type: "ENTER_REGION"; regionId: string }
  | { type: "FOCUS_ENTRY"; entryId: string; cameraPose: CameraPose | null }
  | { type: "BACK_TO_REGION" }
  | { type: "BACK_TO_GLOBAL" }
  | { type: "FINISH_TRANSITION" }
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
    case "ENTER_REGION":
      return {
        ...state,
        sceneMode: "region",
        selectedRegionId: action.regionId,
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "entering",
      };
    case "FOCUS_ENTRY":
      return {
        ...state,
        sceneMode: "focused",
        selectedEntryId: action.entryId,
        previousCameraPose: action.cameraPose,
        cameraTransition: "focusing",
      };
    case "BACK_TO_REGION":
      return {
        ...state,
        sceneMode: "region",
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "returning",
      };
    case "BACK_TO_GLOBAL":
      return {
        ...state,
        sceneMode: "global",
        selectedRegionId: null,
        selectedEntryId: null,
        previousCameraPose: null,
        cameraTransition: "returning",
      };
    case "FINISH_TRANSITION":
      return { ...state, cameraTransition: "idle" };
    case "SET_TIME_RANGE":
      return { ...state, timeRange: action.range };
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
