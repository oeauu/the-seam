import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { geoCentroid } from "d3";
import type { CountryFeature, WorldData } from "../geo/geoTypes";
import type { LocationCluster } from "../types";
import { MARKER_RADIUS, latLngToVector3, vector3ToLatLng, createBorderGeometry } from "../geo/worldGeometry";
import { findCountryAtPoint, getCountryMetadataForFeature } from "../geo/countryLookup";
import { clusterRecords } from "../geo/clustering";
import { useApp } from "../state/appContext";

interface GlobeContentProps {
  worldData: WorldData;
  clusters: LocationCluster[];
  onCountryClick: (country: CountryFeature) => void;
  onClusterClick: (cluster: LocationCluster) => void;
  onReady?: () => void;
}

function GlobeInnerMesh({ worldData, onCountryClick, onClusterClick, onReady }: GlobeContentProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { language, visibleRecords, setGlobeCameraPosition, globeFocus } = useApp();
  const [distance, setDistance] = useState(camera.position.length());
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusing, setFocusing] = useState(false);
  const transitionRef = useRef<{from: THREE.Vector3; to: THREE.Vector3; elapsed: number; country: CountryFeature} | null>(null);
  const focusToken = useRef(globeFocus?.token);
  const initialFrames = useRef(0);
  const geometry = useMemo(() => createBorderGeometry(worldData.borderMesh), [worldData.borderMesh]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const clusters = useMemo(() => clusterRecords(visibleRecords, distance > 5 ? 100 : distance > 3.5 ? 30 : 0), [visibleRecords, distance]);
  const countryLabels = useMemo(() => worldData.features.map(country => {
    const [lon, lat] = geoCentroid(country);
    return {country, lon, lat, name:getCountryMetadataForFeature(country)?.name};
  }), [worldData.features]);

  useEffect(() => {
    if (!globeFocus || globeFocus.token === focusToken.current) return;
    focusToken.current = globeFocus.token;
    camera.position.set(...globeFocus.position);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update();
    setDistance(camera.position.length());
  }, [globeFocus, camera]);

  useFrame((_, delta) => {
    if (++initialFrames.current === 2) onReady?.();
    const transition = transitionRef.current;
    if (!transition) return;
    transition.elapsed += delta;
    const progress = Math.min(1, transition.elapsed / 0.45);
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(transition.from, transition.to, eased);
    camera.lookAt(0, 0, 0);
    if (progress === 1) {
      transitionRef.current = null;
      onCountryClick(transition.country);
    }
  });

  function pickCountry(event: ThreeEvent<MouseEvent>) {
    if (event.delta > 6 || transitionRef.current) return;
    event.stopPropagation();
    const [lat, lon] = vector3ToLatLng(event.point.x, event.point.y, event.point.z);
    const country = findCountryAtPoint(worldData.features, lon, lat);
    if (!country) return;
    setGlobeCameraPosition(camera.position.toArray());
    const center = getCountryMetadataForFeature(country)?.center || geoCentroid(country);
    const to = new THREE.Vector3(...latLngToVector3(center[1], center[0], 4.6));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onCountryClick(country); return; }
    setFocusing(true);
    transitionRef.current = {from:camera.position.clone(),to,elapsed:0,country};
  }

  function label(name: string, lon: number, lat: number, key: string, capital = false) {
    const position = latLngToVector3(lat, lon, 2.04);
    // Keep geographical labels away from archive coordinates.
    if (clusters.some(cluster => new THREE.Vector3(...latLngToVector3(cluster.coordinates.latitude, cluster.coordinates.longitude, 2.04)).distanceTo(new THREE.Vector3(...position)) < 0.1)) return null;
    return <Html key={key} position={position} center occlude style={{pointerEvents:"none"}}><span className={`seam-map-label ${capital ? "is-capital" : ""}`}>{capital ? "◉ " : ""}{name}</span></Html>;
  }

  return <group>
    <ambientLight intensity={1.4} />
    <directionalLight position={[6, 4, 6]} intensity={0.35} />
    <mesh onClick={pickCountry}>
      <sphereGeometry args={[2, 64, 48]} />
      <meshBasicMaterial color="#fdfdfd" toneMapped={false} />
    </mesh>
    <lineSegments geometry={geometry} raycast={() => undefined}>
      <lineBasicMaterial color="#181818" />
    </lineSegments>
    {distance < 5 && countryLabels.filter(({country}) => country.geometry.type === "Polygon" || country.geometry.coordinates.length < 25).map(({country,lon,lat,name}) => label(name?.[language] || country.properties.name,lon,lat,`country-${country.id}`))}
    {distance < 4 && worldData.cities.filter(city => city.isCapital || (distance < 3.2 && city.rank <= 3)).map((city,index) => label(city.name[language],city.coordinates[0],city.coordinates[1],`city-${index}`,city.isCapital))}
    {clusters.map(cluster => {
      const count = cluster.records.length;
      const isHovered = hovered === cluster.id;
      return <group key={cluster.id} position={latLngToVector3(cluster.coordinates.latitude, cluster.coordinates.longitude, MARKER_RADIUS)}>
        <mesh onPointerOver={event => {event.stopPropagation();setHovered(cluster.id);}}
          onPointerOut={() => setHovered(null)}
          onClick={event => {event.stopPropagation();if(event.delta <= 6)onClusterClick(cluster);}}>
          <sphereGeometry args={[count > 1 ? 0.035 : 0.025, 16, 16]} />
          <meshBasicMaterial color={isHovered ? "#997223" : "#c49a45"} />
        </mesh>
        {count > 1 && <Html position={[0,0.05,0]} center occlude style={{pointerEvents:"none"}}><span className="seam-cluster-count">{count}</span></Html>}
        {isHovered && <Html position={[0,0.1,0]} center occlude style={{pointerEvents:"none"}}><div className="seam-globe-marker-tooltip">{cluster.records.map(record => record.title[language]).join(" / ")}</div></Html>}
      </group>;
    })}
    <OrbitControls ref={controlsRef} enablePan={false} enabled={!focusing} minDistance={2.6} maxDistance={14} enableDamping dampingFactor={0.06} rotateSpeed={0.5}
      onChange={() => setDistance(camera.position.length())}
      onEnd={() => {if(!transitionRef.current)setGlobeCameraPosition(camera.position.toArray());}} />
  </group>;
}

export function GlobeScene(props: GlobeContentProps) {
  const { globeCameraPosition, focusGlobe, language } = useApp();
  const [ready, setReady] = useState(false);
  return <div className="seam-globe-canvas-wrapper" data-ready={ready} style={{width:"100%",height:"100%",position:"relative"}}>
    <Canvas camera={{position:globeCameraPosition,fov:45}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}>
      <color attach="background" args={["#ffffff"]} />
      <GlobeInnerMesh {...props} onReady={() => setReady(true)} />
    </Canvas>
    <button type="button" className="seam-map-reset" onClick={() => focusGlobe(0,0)}>{language === "zh" ? "重置视角" : "Reset view"}</button>
  </div>;
}
