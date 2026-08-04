import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { ArchiveEntry, Language } from "../types";
import { getEntryDisplayPeriod, getEntryEvidenceLabel, getEntryPrimaryLocation, getEntryPrimaryMedia } from "../selectors";

interface ArchiveCard3DProps {
  entry: ArchiveEntry;
  language: Language;
  position: [number, number, number];
  distanceLevel: "far" | "near";
  selected: boolean;
  onSelect: (entryId: string) => void;
}

export function ArchiveCard3D({ entry, language, position, distanceLevel, selected, onSelect }: ArchiveCard3DProps) {
  const media = getEntryPrimaryMedia(entry);
  const location = getEntryPrimaryLocation(entry);
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(entry.id);
  };

  return (
    <group position={position} onClick={handleClick}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[distanceLevel === "near" ? 0.88 : 0.66, distanceLevel === "near" ? 0.56 : 0.42, 0.04]} />
        <meshStandardMaterial color={selected ? "#e9d9b4" : "#e7e2d6"} roughness={0.9} />
      </mesh>
      <Html transform center distanceFactor={3.8}>
        <button
          type="button"
          className={`atlas-archive-card atlas-archive-card-${distanceLevel}${selected ? " is-selected" : ""}`}
          onClick={event => {
            event.stopPropagation();
            onSelect(entry.id);
          }}
          aria-label={entry.title[language]}
          data-testid={`atlas-entry-${entry.id}`}
        >
          <span className="atlas-card-kind">{media.kind}</span>
          <strong>{entry.title[language]}</strong>
          <span>{getEntryDisplayPeriod(entry)[language]}</span>
          <span>{location?.name[language] ?? (language === "zh" ? "地点不详" : "Location unknown")}</span>
          {distanceLevel === "near" && <small>Grade {getEntryEvidenceLabel(entry)}</small>}
        </button>
      </Html>
    </group>
  );
}
