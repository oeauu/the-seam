import type {
  ArchiveEntry,
  ArchiveLocation,
  CoordinateTolerance,
  GroupableCoordinate,
  LocalizedText,
  LocationGroup,
  LocationPrecision,
} from "./types";

export const LOCATION_PRECISION_TOLERANCE_KM: Readonly<Record<LocationPrecision, number>> = {
  exact: 0.05,
  city: 5,
  region: 35,
  country: 150,
  "cultural-region": 450,
  transregional: 1000,
  unknown: 0.5,
};

const PRECISION_RANK: Readonly<Record<LocationPrecision, number>> = {
  exact: 0,
  city: 1,
  region: 2,
  country: 3,
  "cultural-region": 4,
  transregional: 5,
  unknown: 6,
};

const KILOMETERS_PER_LATITUDE_DEGREE = 111.32;

function assertCoordinate(coordinate: GroupableCoordinate): void {
  if (
    !Number.isFinite(coordinate.latitude)
    || coordinate.latitude < -90
    || coordinate.latitude > 90
  ) {
    throw new Error("Latitude must be between -90 and 90");
  }
  if (
    !Number.isFinite(coordinate.longitude)
    || coordinate.longitude < -180
    || coordinate.longitude > 180
  ) {
    throw new Error("Longitude must be between -180 and 180");
  }
}

export function coordinateToleranceForPrecision(
  precision: LocationPrecision,
  latitude = 0,
): CoordinateTolerance {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  const radiusKilometers = LOCATION_PRECISION_TOLERANCE_KM[precision];
  const latitudeDegrees = radiusKilometers / KILOMETERS_PER_LATITUDE_DEGREE;
  const longitudeScale = Math.max(Math.cos((Math.abs(latitude) * Math.PI) / 180), 0.01);
  const longitudeDegrees = latitudeDegrees / longitudeScale;
  return { radiusKilometers, latitudeDegrees, longitudeDegrees };
}

export function coordinateToleranceForPair(
  firstPrecision: LocationPrecision,
  secondPrecision: LocationPrecision,
  latitude = 0,
): CoordinateTolerance {
  const radiusKilometers = Math.min(
    LOCATION_PRECISION_TOLERANCE_KM[firstPrecision],
    LOCATION_PRECISION_TOLERANCE_KM[secondPrecision],
  );
  const latitudeDegrees = radiusKilometers / KILOMETERS_PER_LATITUDE_DEGREE;
  const longitudeScale = Math.max(Math.cos((Math.abs(latitude) * Math.PI) / 180), 0.01);
  const longitudeDegrees = latitudeDegrees / longitudeScale;
  return { radiusKilometers, latitudeDegrees, longitudeDegrees };
}

export function coordinatesWithinTolerance(
  first: GroupableCoordinate,
  second: GroupableCoordinate,
): boolean {
  assertCoordinate(first);
  assertCoordinate(second);
  const tolerance = coordinateToleranceForPair(
    first.precision,
    second.precision,
    (first.latitude + second.latitude) / 2,
  );
  return Math.abs(first.latitude - second.latitude) <= tolerance.latitudeDegrees
    && Math.abs(first.longitude - second.longitude) <= tolerance.longitudeDegrees;
}

function hasCoordinates(location: ArchiveLocation): boolean {
  return location.latitude !== null && location.longitude !== null;
}

function primaryLocation(entry: ArchiveEntry): ArchiveLocation | null {
  return entry.locations.find(location => location.isPrimary) ?? entry.locations[0] ?? null;
}

function groupableLocation(entry: ArchiveEntry): ArchiveLocation | null {
  const primary = primaryLocation(entry);
  if (primary && hasCoordinates(primary)) return primary;
  return entry.locations.find(hasCoordinates) ?? null;
}

function normalizedLocationId(locationId: string): string {
  return locationId.trim();
}

function normalizedLocationName(name: LocalizedText): string {
  return [name.en, name.zh]
    .map(value => value.normalize("NFKC").trim().toLocaleLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

function coordinateFromLocation(location: ArchiveLocation): GroupableCoordinate | null {
  if (location.latitude === null || location.longitude === null) return null;
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    precision: location.precision,
  };
}

function regionsMatch(first: string | null, second: string | null): boolean {
  return first !== null && second !== null && first === second;
}

function regionsCompatible(first: string | null, second: string | null): boolean {
  return first === null && second === null ? true : regionsMatch(first, second);
}

function morePrecise(
  first: LocationPrecision,
  second: LocationPrecision,
): LocationPrecision {
  return PRECISION_RANK[first] <= PRECISION_RANK[second] ? first : second;
}

function roundedCoordinate(value: number): string {
  return value.toFixed(4);
}

interface MutableLocationGroup {
  id: string;
  locationId: string | null;
  name: LocalizedText;
  precision: LocationPrecision;
  entryIds: string[];
  regionId: string;
  locations: ArchiveLocation[];
}

function canJoinGroup(group: MutableLocationGroup, location: ArchiveLocation): boolean {
  const locationId = normalizedLocationId(location.id);
  const locationCoordinate = coordinateFromLocation(location);
  if (!locationCoordinate) return false;
  const locationName = normalizedLocationName(location.name);

  return group.locations.some(groupLocation => {
    const groupCoordinate = coordinateFromLocation(groupLocation);
    if (!groupCoordinate) return false;
    if (!coordinatesWithinTolerance(locationCoordinate, groupCoordinate)) return false;
    if (
      group.locationId !== null
      && locationId.length > 0
      && group.locationId === locationId
    ) {
      return regionsCompatible(location.regionId, groupLocation.regionId);
    }

    const groupName = normalizedLocationName(groupLocation.name);
    const sameName = locationName.length > 0 && locationName === groupName;
    const bothUnnamed = locationName.length === 0 && groupName.length === 0;
    return (sameName || bothUnnamed) && regionsMatch(location.regionId, groupLocation.regionId);
  });
}

function createGroupId(location: ArchiveLocation): string {
  const locationId = normalizedLocationId(location.id);
  if (locationId.length > 0) return `location:${locationId}`;

  const latitude = location.latitude ?? 0;
  const longitude = location.longitude ?? 0;
  const name = normalizedLocationName(location.name) || "unnamed";
  const region = location.regionId ?? "unknown";
  return `coordinate:${region}:${name}:${roundedCoordinate(latitude)}:${roundedCoordinate(longitude)}`;
}

function averageCoordinates(locations: readonly ArchiveLocation[]): {
  latitude: number;
  longitude: number;
} {
  const coordinates = locations
    .map(coordinateFromLocation)
    .filter((coordinate): coordinate is GroupableCoordinate => coordinate !== null);
  return {
    latitude: coordinates.reduce((sum, coordinate) => sum + coordinate.latitude, 0)
      / Math.max(1, coordinates.length),
    longitude: coordinates.reduce((sum, coordinate) => sum + coordinate.longitude, 0)
      / Math.max(1, coordinates.length),
  };
}

function toLocationGroup(group: MutableLocationGroup): LocationGroup {
  const center = averageCoordinates(group.locations);
  const priority = Math.max(1, 100 - (PRECISION_RANK[group.precision] * 10) + group.entryIds.length);
  return {
    id: group.id,
    locationId: group.locationId,
    name: { ...group.name },
    displayName: { ...group.name },
    latitude: center.latitude,
    longitude: center.longitude,
    precision: group.precision,
    priority,
    entryIds: [...group.entryIds],
    regionId: group.regionId,
  };
}

export function groupEntriesByLocation(entries: readonly ArchiveEntry[]): readonly LocationGroup[] {
  const groups: MutableLocationGroup[] = [];

  for (const entry of entries) {
    const location = groupableLocation(entry);
    if (!location) continue;

    const existingGroup = groups.find(group => canJoinGroup(group, location));
    if (existingGroup) {
      existingGroup.entryIds.push(entry.id);
      existingGroup.locations.push(location);
      existingGroup.precision = morePrecise(existingGroup.precision, location.precision);
      continue;
    }

    groups.push({
      id: createGroupId(location),
      locationId: normalizedLocationId(location.id) || null,
      name: { ...location.name },
      precision: location.precision,
      entryIds: [entry.id],
      regionId: location.regionId ?? "unknown",
      locations: [location],
    });
  }

  return groups.map(toLocationGroup);
}

export const createLocationGroups = groupEntriesByLocation;
export const selectLocationGroups = groupEntriesByLocation;

export { getLocalizedText } from "./localization";
export { getPreviewVisibility } from "./selectors";
