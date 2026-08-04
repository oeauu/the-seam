import { Line } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { Shape, ShapeGeometry, type BufferGeometry } from "three";
import type { AtlasQualityLevel, Language } from "../types";
import { latLngToVector3 } from "../utils/geo";
import type { ProjectionCoordinate, RegionProjectionFactory } from "../rendering/regionProjection";
import { ParchmentRegionSurface } from "./ParchmentRegionSurface";

type CountryFeature = Feature<Geometry, GeoJsonProperties>;

interface CountryBoundaryLayerProps {
  mode: "global" | "region";
  regionId?: string | null;
  language: Language;
  qualityLevel: AtlasQualityLevel;
  projection?: RegionProjectionFactory;
}

const REGION_COUNTRIES: Readonly<Record<string, readonly string[]>> = {
  europe: ["Greece", "Italy", "France", "United Kingdom", "Germany", "Spain"],
  "western-europe": ["Greece", "Italy", "France", "United Kingdom", "Germany", "Spain"],
  "east-asia": ["China", "Japan", "South Korea", "North Korea", "Mongolia", "Taiwan"],
  "south-asia": ["India", "Pakistan", "Bangladesh", "Nepal", "Sri Lanka"],
  "west-asia": ["Iraq", "Turkey", "Syria", "Israel", "Jordan", "Lebanon", "Iran"],
  "north-africa": ["Egypt", "Tunisia", "Morocco", "Algeria", "Libya"],
};

interface TopologyPayload extends Topology {
  objects: Topology["objects"] & { countries: Topology["objects"][string] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCountryFeature(value: unknown): value is CountryFeature {
  return isRecord(value) && value.type === "Feature" && "geometry" in value;
}

function isTopology(value: unknown): value is TopologyPayload {
  if (!isRecord(value) || value.type !== "Topology" || !isRecord(value.objects)) return false;
  return Array.isArray(value.arcs) && isRecord(value.objects.countries);
}

function coordinatesForGeometry(geometry: Geometry | null): ProjectionCoordinate[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ring => ring.map(([longitude, latitude]) => [longitude, latitude] as ProjectionCoordinate));
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap(polygon => polygon.map(ring => ring.map(([longitude, latitude]) => [longitude, latitude] as ProjectionCoordinate)));
  }
  return [];
}

function selectedFeatures(features: readonly CountryFeature[], mode: CountryBoundaryLayerProps["mode"], regionId: string | null | undefined): CountryFeature[] {
  if (mode === "global") return [...features];
  const allowed = new Set(REGION_COUNTRIES[regionId ?? ""] ?? []);
  return features.filter(item => typeof item.properties?.name === "string" && allowed.has(item.properties.name));
}

function regionGeometry(ring: ProjectionCoordinate[], projection: RegionProjectionFactory): BufferGeometry | null {
  if (ring.length < 3) return null;
  const shape = new Shape();
  ring.forEach((coordinate, index) => {
    const point = projection.projectCoordinate(coordinate).screenPosition;
    const x = (point[0] - projection.viewport.width / 2) * projection.sceneScale;
    const y = (projection.viewport.height / 2 - point[1]) * projection.sceneScale;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return new ShapeGeometry(shape);
}

function globalPoints(ring: ProjectionCoordinate[], radius: number): [number, number, number][] {
  return ring.map(([longitude, latitude]) => latLngToVector3(latitude, longitude, radius));
}

function RegionContour({ ring, projection, qualityLevel, index }: { ring: ProjectionCoordinate[]; projection: RegionProjectionFactory; qualityLevel: AtlasQualityLevel; index: number }) {
  const geometry = useMemo(() => regionGeometry(ring, projection), [projection, ring]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  const points = ring.map(coordinate => {
    const point = projection.projectCoordinate(coordinate).screenPosition;
    const x = (point[0] - projection.viewport.width / 2) * projection.sceneScale;
    const y = (projection.viewport.height / 2 - point[1]) * projection.sceneScale;
    return [x, y, 0.025] as [number, number, number];
  });
  return (
    <group>
      <ParchmentRegionSurface geometry={geometry} quality={qualityLevel} seed={index + 101} color="#e8d5a5" emissive="#f2d89a" emissiveIntensity={0.52} normalScale={0} position={[0, 0, -0.01]} />
      <Line points={points} color="#785a32" lineWidth={0.7} transparent opacity={0.86} />
    </group>
  );
}

export function CountryBoundaryLayer({ mode, regionId, language, qualityLevel, projection }: CountryBoundaryLayerProps) {
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/countries-110m.json")
      .then(response => {
        if (!response.ok) throw new Error(`Boundary asset request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then(payload => {
        if (cancelled || !isTopology(payload)) throw new Error("Boundary asset is not a TopoJSON topology");
        const collection: unknown = feature(payload, "countries");
        const next: unknown[] = isRecord(collection) && Array.isArray(collection.features) ? collection.features : [collection];
        setFeatures(next.filter(isCountryFeature).filter(item => item.geometry !== null));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, []);

  const visibleFeatures = useMemo(() => selectedFeatures(features, mode, regionId), [features, mode, regionId]);
  const lineDetail = qualityLevel === "high" ? 1 : qualityLevel === "medium" ? 2 : 4;

  if (loadError) {
    return <group userData={{ boundaryAssetError: true, language }} />;
  }

  if (mode === "region" && projection) {
    return (
      <group data-atlas-boundary-mode="region">
        {visibleFeatures.flatMap((item, featureIndex) => coordinatesForGeometry(item.geometry).filter((_, ringIndex) => ringIndex % lineDetail === 0).map((ring, ringIndex) => (
          <RegionContour key={`${item.properties?.name ?? featureIndex}-${ringIndex}`} ring={ring} projection={projection} qualityLevel={qualityLevel} index={featureIndex + ringIndex} />
        )))}
      </group>
    );
  }

  return (
    <group data-atlas-boundary-mode="global">
      {visibleFeatures.flatMap((item, featureIndex) => coordinatesForGeometry(item.geometry).filter((_, ringIndex) => ringIndex % lineDetail === 0).map((ring, ringIndex) => (
        <Line key={`${item.properties?.name ?? featureIndex}-${ringIndex}`} points={globalPoints(ring, 1.645)} color="#573a1e" lineWidth={qualityLevel === "high" ? 1.05 : 0.72} transparent opacity={0.96} />
      )))}
    </group>
  );
}
