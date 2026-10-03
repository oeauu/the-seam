import type { Feature, Polygon, MultiPolygon } from "geojson";
import type { CityMetadata } from "../data/countriesMeta";

export interface MapCity extends CityMetadata {
  countryName: string;
  countryCode: string;
  rank: number;
}

export interface CountryFeatureProperties {
  name: string;
}

export type CountryFeature = Feature<Polygon | MultiPolygon, CountryFeatureProperties>;

export interface WorldData {
  features: CountryFeature[];
  borderMesh: number[]; // Flat array of [x0, y0, z0, x1, y1, z1, ...] for 3D sphere
  borderLines2D: number[][][]; // GeoJSON line coordinates for 2D map
  cities: MapCity[];
}
