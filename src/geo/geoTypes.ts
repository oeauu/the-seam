import type { Feature, Geometry } from "geojson";

export interface CountryFeatureProperties {
  name: string;
}

export type CountryFeature = Feature<Geometry, CountryFeatureProperties>;

export interface WorldData {
  features: CountryFeature[];
  borderMesh: number[]; // Flat array of [x0, y0, z0, x1, y1, z1, ...] for 3D sphere
  borderLines2D: number[][][]; // GeoJSON line coordinates for 2D map
}
