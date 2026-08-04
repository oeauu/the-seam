import type { ArchiveEntry, Language } from "../types";
import { getEntryPrimaryLocation } from "../selectors";
import { ArchiveCard3D } from "./ArchiveCard3D";
import { OrbitControls } from "@react-three/drei";

interface RegionAtlasSceneProps {
  entries: ArchiveEntry[];
  language: Language;
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}

function projectEntry(entry: ArchiveEntry, entries: ArchiveEntry[], index: number): [number, number, number] {
  const location = getEntryPrimaryLocation(entry);
  const coordinates = entries
    .map(item => getEntryPrimaryLocation(item))
    .filter((item): item is NonNullable<typeof item> => item?.longitude !== null && item?.latitude !== null);
  if (!location || location.longitude === null || location.latitude === null || coordinates.length === 0) {
    const angle = (index / Math.max(1, entries.length)) * Math.PI * 2;
    return [Math.cos(angle) * 1.6, Math.sin(angle) * 0.8, 0.12];
  }
  const longitudes = coordinates.map(item => item.longitude ?? 0);
  const latitudes = coordinates.map(item => item.latitude ?? 0);
  const west = Math.min(...longitudes) - 2;
  const east = Math.max(...longitudes) + 2;
  const south = Math.min(...latitudes) - 2;
  const north = Math.max(...latitudes) + 2;
  const x = ((location.longitude - west) / Math.max(1, east - west) - 0.5) * 4.6;
  const y = ((location.latitude - south) / Math.max(1, north - south) - 0.5) * 2.5;
  return [x, y, 0.18 + (index % 3) * 0.05];
}

export function RegionAtlasScene({ entries, language, selectedEntryId, onSelectEntry }: RegionAtlasSceneProps) {
  return (
    <group rotation={[-0.18, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5.4, 3.2, 0.12]} />
        <meshStandardMaterial color="#263338" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.08, 0.08]}>
        <planeGeometry args={[5.1, 2.9]} />
        <meshStandardMaterial color="#44565a" roughness={1} />
      </mesh>
      {entries.map((entry, index) => (
        <ArchiveCard3D
          key={entry.id}
          entry={entry}
          language={language}
          position={projectEntry(entry, entries, index)}
          distanceLevel={entries.length > 12 && index > 6 ? "far" : "near"}
          selected={entry.id === selectedEntryId}
          onSelect={onSelectEntry}
        />
      ))}
      <OrbitControls enablePan enableDamping dampingFactor={0.08} minDistance={2.8} maxDistance={8} />
    </group>
  );
}
