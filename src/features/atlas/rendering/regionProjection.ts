import type { RegionBounds, RegionViewport, Vector3Tuple } from "../utils/geo";

export type { GeoCoordinate, RegionBounds, RegionViewport, Vector3Tuple } from "../utils/geo";

export type ProjectionCoordinate = readonly [longitude: number, latitude: number];
export type RegionBoundary = readonly ProjectionCoordinate[];
export type ScreenPoint = readonly [x: number, y: number];

export interface ProjectionPoint {
  coordinate: ProjectionCoordinate;
  screenPosition: ScreenPoint;
  scenePosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
}

export interface ProjectedBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  screenCenter: ScreenPoint;
  sceneCenter: Vector3Tuple;
}

export interface RegionProjectionFactoryOptions {
  bounds: RegionBounds;
  viewport: RegionViewport;
  sceneScale?: number;
}

export interface RegionProjectionFactory {
  readonly bounds: RegionBounds;
  readonly viewport: RegionViewport;
  readonly scale: number;
  readonly sceneScale: number;
  contains(coordinate: ProjectionCoordinate): boolean;
  project(coordinate: ProjectionCoordinate): ProjectionPoint;
  projectCoordinate(coordinate: ProjectionCoordinate): ProjectionPoint;
  projectBoundary(boundary: RegionBoundary): ProjectionPoint[];
  projectBounds(bounds?: RegionBounds): ProjectedBounds;
  markerPosition(coordinate: ProjectionCoordinate): Vector3Tuple;
  cameraTargetFor(coordinate: ProjectionCoordinate): Vector3Tuple;
}

export const DEFAULT_REGION_VIEWPORT = {
  width: 800,
  height: 600,
  padding: 48,
} satisfies RegionViewport;

export const DEFAULT_REGION_SCENE_SCALE = 0.01;

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function validateBounds(bounds: RegionBounds): void {
  assertFinite(bounds.west, "Bounds west");
  assertFinite(bounds.east, "Bounds east");
  assertFinite(bounds.south, "Bounds south");
  assertFinite(bounds.north, "Bounds north");
  if (bounds.west < -180 || bounds.east > 180 || bounds.west >= bounds.east) {
    throw new Error("Bounds longitude must be ordered within -180 to 180");
  }
  if (bounds.south < -90 || bounds.north > 90 || bounds.south >= bounds.north) {
    throw new Error("Bounds latitude must be ordered within -90 to 90");
  }
}

function validateViewport(viewport: RegionViewport): void {
  assertFinite(viewport.width, "Viewport width");
  assertFinite(viewport.height, "Viewport height");
  assertFinite(viewport.padding ?? 0, "Viewport padding");
  if (viewport.width <= 0 || viewport.height <= 0) {
    throw new Error("Viewport width and height must be greater than zero");
  }
  if ((viewport.padding ?? 0) < 0) {
    throw new Error("Viewport padding cannot be negative");
  }
}

function validateCoordinate(coordinate: ProjectionCoordinate): void {
  const [longitude, latitude] = coordinate;
  assertFinite(longitude, "Longitude");
  assertFinite(latitude, "Latitude");
  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }
}

function coordinateCorners(bounds: RegionBounds): RegionBoundary {
  return [
    [bounds.west, bounds.south],
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
    [bounds.east, bounds.south],
  ];
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

export function createRegionProjectionFactory(
  options: RegionProjectionFactoryOptions,
): RegionProjectionFactory;
export function createRegionProjectionFactory(
  bounds: RegionBounds,
  viewport: RegionViewport,
  sceneScale?: number,
): RegionProjectionFactory;
export function createRegionProjectionFactory(
  optionsOrBounds: RegionProjectionFactoryOptions | RegionBounds,
  suppliedViewport?: RegionViewport,
  suppliedSceneScale = DEFAULT_REGION_SCENE_SCALE,
): RegionProjectionFactory {
  const options = "viewport" in optionsOrBounds
    ? optionsOrBounds
    : {
      bounds: optionsOrBounds,
      viewport: suppliedViewport ?? DEFAULT_REGION_VIEWPORT,
      sceneScale: suppliedSceneScale,
    };
  const { bounds, viewport } = options;
  const sceneScale = options.sceneScale ?? DEFAULT_REGION_SCENE_SCALE;
  validateBounds(bounds);
  validateViewport(viewport);
  assertFinite(sceneScale, "Scene scale");
  if (sceneScale <= 0) {
    throw new Error("Scene scale must be greater than zero");
  }

  const padding = viewport.padding ?? 0;
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const longitudeSpan = bounds.east - bounds.west;
  const latitudeSpan = bounds.north - bounds.south;
  const scale = Math.min(availableWidth / longitudeSpan, availableHeight / latitudeSpan);
  const mapWidth = longitudeSpan * scale;
  const mapHeight = latitudeSpan * scale;
  const mapLeft = (viewport.width - mapWidth) / 2;
  const mapTop = (viewport.height - mapHeight) / 2;

  const toScreen = (coordinate: ProjectionCoordinate): ScreenPoint => {
    const [longitude, latitude] = coordinate;
    return [
      mapLeft + (longitude - bounds.west) * scale,
      viewport.height - (mapTop + (latitude - bounds.south) * scale),
    ];
  };

  const toScene = (screenPosition: ScreenPoint): Vector3Tuple => [
    (screenPosition[0] - viewport.width / 2) * sceneScale,
    0,
    (screenPosition[1] - viewport.height / 2) * sceneScale,
  ];

  const projectCoordinate = (coordinate: ProjectionCoordinate): ProjectionPoint => {
    validateCoordinate(coordinate);
    const screenPosition = toScreen(coordinate);
    const scenePosition = toScene(screenPosition);
    return {
      coordinate,
      screenPosition,
      scenePosition,
      cameraTarget: scenePosition,
    };
  };

  const projectBounds = (projectedBounds: RegionBounds = bounds): ProjectedBounds => {
    validateBounds(projectedBounds);
    const points = coordinateCorners(projectedBounds).map(projectCoordinate);
    const xValues = points.map(point => point.screenPosition[0]);
    const yValues = points.map(point => point.screenPosition[1]);
    const screenCenter: ScreenPoint = [average(xValues), average(yValues)];
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues),
      screenCenter,
      sceneCenter: toScene(screenCenter),
    };
  };

  const factory: RegionProjectionFactory = {
    bounds,
    viewport,
    scale,
    sceneScale,
    contains: (coordinate) => {
      validateCoordinate(coordinate);
      return coordinate[0] >= bounds.west
        && coordinate[0] <= bounds.east
        && coordinate[1] >= bounds.south
        && coordinate[1] <= bounds.north;
    },
    project: projectCoordinate,
    projectCoordinate,
    projectBoundary: boundary => boundary.map(projectCoordinate),
    projectBounds,
    markerPosition: coordinate => projectCoordinate(coordinate).scenePosition,
    cameraTargetFor: coordinate => projectCoordinate(coordinate).cameraTarget,
  };

  return factory;
}

export const createRegionProjection = createRegionProjectionFactory;

export interface RegionProjectionFixtureLocation {
  id: string;
  label: string;
  coordinate: ProjectionCoordinate;
}

export type RegionProjectionFixtureId =
  | "western-europe"
  | "east-asia"
  | "north-america"
  | "southern-africa";

export interface RegionProjectionFixture {
  id: RegionProjectionFixtureId;
  label: string;
  bounds: RegionBounds;
  boundary: RegionBoundary;
  locations: readonly RegionProjectionFixtureLocation[];
  note: string;
}

/**
 * Static navigation fixtures use approximate real-world bounds and city
 * coordinates. Their outlines are intentionally small test geometries, not
 * historical borders or a substitute for a licensed boundary dataset.
 */
export const REGION_PROJECTION_FIXTURES = [
  {
    id: "western-europe",
    label: "Western Europe",
    bounds: { west: -11, east: 32, south: 34, north: 61 },
    boundary: [
      [-11, 36], [-9, 43], [-5, 48], [-6, 55], [-3, 58], [8, 58],
      [15, 55], [23, 53], [32, 47], [28, 40], [16, 35], [4, 34], [-11, 36],
    ],
    locations: [
      { id: "london", label: "London", coordinate: [-0.1276, 51.5074] },
      { id: "paris", label: "Paris", coordinate: [2.3522, 48.8566] },
      { id: "madrid", label: "Madrid", coordinate: [-3.7038, 40.4168] },
    ],
    note: "Approximate navigation bounds for Western Europe.",
  },
  {
    id: "east-asia",
    label: "East Asia",
    bounds: { west: 100, east: 146, south: 20, north: 53 },
    boundary: [
      [100, 21], [111, 20], [123, 21], [135, 25], [146, 35],
      [145, 50], [133, 53], [118, 50], [103, 45], [100, 21],
    ],
    locations: [
      { id: "beijing", label: "Beijing", coordinate: [116.4074, 39.9042] },
      { id: "seoul", label: "Seoul", coordinate: [126.978, 37.5665] },
      { id: "tokyo", label: "Tokyo", coordinate: [139.6917, 35.6895] },
    ],
    note: "Approximate navigation bounds for East Asia.",
  },
  {
    id: "north-america",
    label: "North America",
    bounds: { west: -130, east: -60, south: 15, north: 60 },
    boundary: [
      [-130, 25], [-125, 50], [-117, 60], [-95, 58], [-75, 52],
      [-60, 45], [-67, 25], [-90, 15], [-112, 15], [-130, 25],
    ],
    locations: [
      { id: "mexico-city", label: "Mexico City", coordinate: [-99.1332, 19.4326] },
      { id: "new-york", label: "New York", coordinate: [-74.006, 40.7128] },
      { id: "toronto", label: "Toronto", coordinate: [-79.3832, 43.6532] },
    ],
    note: "Approximate navigation bounds for North America.",
  },
  {
    id: "southern-africa",
    label: "Southern Africa",
    bounds: { west: 10, east: 40, south: -35, north: -10 },
    boundary: [
      [10, -35], [18, -34], [26, -30], [40, -26], [39, -10],
      [28, -10], [20, -14], [12, -22], [10, -35],
    ],
    locations: [
      { id: "cape-town", label: "Cape Town", coordinate: [18.4241, -33.9249] },
      { id: "johannesburg", label: "Johannesburg", coordinate: [28.0473, -26.2041] },
      { id: "maputo", label: "Maputo", coordinate: [32.5732, -25.9692] },
    ],
    note: "Approximate navigation bounds for Southern Africa.",
  },
] as const satisfies readonly RegionProjectionFixture[];

export function getRegionProjectionFixture(
  id: RegionProjectionFixtureId,
): RegionProjectionFixture | undefined {
  return REGION_PROJECTION_FIXTURES.find(fixture => fixture.id === id);
}

export function createFixtureProjection(
  fixture: RegionProjectionFixture,
  viewport: RegionViewport = DEFAULT_REGION_VIEWPORT,
): RegionProjectionFactory {
  return createRegionProjectionFactory({ bounds: fixture.bounds, viewport });
}
