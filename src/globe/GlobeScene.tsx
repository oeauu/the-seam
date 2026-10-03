import { useRef, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { CountryFeature, WorldData } from "../geo/geoTypes";
import type { LocationCluster } from "../types";
import { GLOBE_RADIUS, MARKER_RADIUS, latLngToVector3, vector3ToLatLng, createBorderGeometry } from "../geo/worldGeometry";
import { findCountryAtPoint } from "../geo/countryLookup";
import { useApp } from "../state/appContext";

interface GlobeContentProps {
  worldData: WorldData;
  clusters: LocationCluster[];
  onCountryClick: (country: CountryFeature) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

function GlobeInnerMesh({
  worldData,
  clusters,
  onCountryClick,
  onClusterClick,
}: GlobeContentProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const { language } = useApp();

  const borderGeometry = useMemo(() => {
    return createBorderGeometry(worldData.borderMesh);
  }, [worldData.borderMesh]);

  const handlePointerDown = (e: any) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    pointerStartRef.current = null;

    // Distinguish drag from click: threshold of 6 pixels
    if (dx > 6 || dy > 6) return;

    // Stop propagation so we handle only the first hit
    e.stopPropagation();

    // The click point on the sphere
    const point = e.point as THREE.Vector3;
    if (!point) return;

    const [lat, lon] = vector3ToLatLng(point.x, point.y, point.z);

    // First, check if clicked close to a cluster marker
    const clusterHit = clusters.find(c => {
      const cPos = latLngToVector3(c.coordinates.latitude, c.coordinates.longitude, MARKER_RADIUS);
      const v = new THREE.Vector3(...cPos);
      return v.distanceTo(point) < 0.16;
    });

    if (clusterHit) {
      onClusterClick(clusterHit);
      return;
    }

    // Otherwise, find country at point
    const country = findCountryAtPoint(worldData.features, lon, lat);
    if (country) {
      onCountryClick(country);
    }
  };

  return (
    <group>
      {/* Ambient and soft natural light for museum clarity */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 4, 6]} intensity={0.4} />

      {/* Main White Globe Sphere */}
      <mesh
        ref={sphereRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 64, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* Black / Deep Charcoal Country Borders */}
      <lineSegments geometry={borderGeometry}>
        <lineBasicMaterial
          color="#181818"
          transparent
          opacity={0.85}
          linewidth={1}
        />
      </lineSegments>

      {/* Gold Coordinate Markers */}
      {clusters.map(cluster => {
        const [x, y, z] = latLngToVector3(
          cluster.coordinates.latitude,
          cluster.coordinates.longitude,
          MARKER_RADIUS
        );
        const isHovered = hoveredCluster === cluster.id;
        const count = cluster.records.length;

        return (
          <group key={cluster.id} position={[x, y, z]}>
            {/* Outer halo on hover */}
            {isHovered && (
              <mesh>
                <sphereGeometry args={[0.045, 16, 16]} />
                <meshBasicMaterial color="#b38618" transparent opacity={0.35} />
              </mesh>
            )}

            {/* Core Gold Coordinate Marker */}
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredCluster(cluster.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredCluster(null);
                document.body.style.cursor = "default";
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClusterClick(cluster);
              }}
            >
              <sphereGeometry args={[count > 1 ? 0.028 : 0.022, 16, 16]} />
              <meshStandardMaterial
                color={isHovered ? "#dfb53d" : "#c49a45"}
                roughness={0.3}
                metalness={0.4}
                emissive="#c49a45"
                emissiveIntensity={isHovered ? 0.35 : 0.15}
              />
            </mesh>

            {/* Hover Tooltip / Cluster Label */}
            {isHovered && (
              <Html distanceFactor={7} position={[0, 0.06, 0]} center style={{ pointerEvents: "none" }}>
                <div className="seam-globe-marker-tooltip">
                  <strong>{cluster.name[language] || cluster.name.en}</strong>
                  {count > 1 && <span className="seam-marker-badge">{count}</span>}
                  <div className="seam-marker-sub">
                    {cluster.records[0].title[language]}
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Orbit Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.6}
        maxDistance={7.5}
        enableDamping={true}
        dampingFactor={0.06}
        rotateSpeed={0.5}
      />
    </group>
  );
}

export function GlobeScene({
  worldData,
  clusters,
  onCountryClick,
  onClusterClick,
}: GlobeContentProps) {
  const { globeCameraPosition, setGlobeCameraPosition } = useApp();

  return (
    <div className="seam-globe-canvas-wrapper" style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: globeCameraPosition, fov: 45 }}
        onCreated={({ camera }) => {
          // Save camera position on unmount/re-render
          return () => {
            const p = camera.position;
            setGlobeCameraPosition([p.x, p.y, p.z]);
          };
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <GlobeInnerMesh
          worldData={worldData}
          clusters={clusters}
          onCountryClick={onCountryClick}
          onClusterClick={onClusterClick}
        />
      </Canvas>
    </div>
  );
}
