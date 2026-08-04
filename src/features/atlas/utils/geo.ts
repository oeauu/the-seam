export type GeoCoordinate = [longitude: number, latitude: number];
export type Vector3Tuple = [x: number, y: number, z: number];

export interface RegionBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface RegionViewport {
  width: number;
  height: number;
  padding?: number;
}

export interface RegionProjection {
  (coordinate: GeoCoordinate): [number, number];
  bounds: RegionBounds;
  viewport: RegionViewport;
}

export function latLngToVector3(latitude: number, longitude: number, radius = 1): Vector3Tuple {
  if (latitude < -90 || latitude > 90) throw new Error("Latitude must be between -90 and 90");
  if (longitude < -180 || longitude > 180) throw new Error("Longitude must be between -180 and 180");
  const phi = (latitude * Math.PI) / 180;
  const theta = (longitude * Math.PI) / 180;
  const cosLatitude = Math.cos(phi);
  return [
    radius * cosLatitude * Math.sin(theta),
    radius * Math.sin(phi),
    radius * cosLatitude * Math.cos(theta),
  ];
}

export function createRegionProjection(bounds: RegionBounds, viewport: RegionViewport): RegionProjection {
  const padding = viewport.padding ?? 24;
  const width = Math.max(1, viewport.width - padding * 2);
  const height = Math.max(1, viewport.height - padding * 2);
  const longitudeSpan = Math.max(1, bounds.east - bounds.west);
  const latitudeSpan = Math.max(1, bounds.north - bounds.south);
  const scale = Math.min(width / longitudeSpan, height / latitudeSpan);
  const drawnWidth = longitudeSpan * scale;
  const drawnHeight = latitudeSpan * scale;
  const offsetX = (viewport.width - drawnWidth) / 2;
  const offsetY = (viewport.height - drawnHeight) / 2;
  const projection = (([longitude, latitude]: GeoCoordinate): [number, number] => [
    offsetX + (longitude - bounds.west) * scale,
    viewport.height - offsetY - (latitude - bounds.south) * scale,
  ]) as RegionProjection;
  projection.bounds = bounds;
  projection.viewport = viewport;
  return projection;
}

export function coordinateKey(longitude: number | null, latitude: number | null): string {
  if (longitude === null || latitude === null) return "unknown";
  return `${longitude.toFixed(2)}:${latitude.toFixed(2)}`;
}
