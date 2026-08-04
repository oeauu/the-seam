import { useCallback, useState } from "react";
import type { FC } from "react";

import { FallbackDirectory } from "../../../components/FallbackDirectory";
import { InteractiveMap } from "../../../components/InteractiveMap";
import { TimeTravelTimeline } from "../../../components/TimeTravelTimeline";
import { EVENTS_DATA, type MapEventGroup } from "../../../db/eventsData";
import { GEOGRAPHY_DATABASE } from "../../../db/geography";
import { MOCK_ENTRIES, type MockEntry } from "../../../db/mockData";

export type LegacyMapLevel = 1 | 2 | 3 | 4;

export interface Legacy2DMapProps {
  currentLanguage: "en" | "zh";
  onSelectEntry: (entryId: string) => void;
  onRequestContribution?: () => void;
  getCombinedEvents?: () => MapEventGroup[];
  entries?: readonly MockEntry[];
  initialTimelineYear?: number;
  initialLevel?: LegacyMapLevel;
  initialContinent?: string | null;
  initialCountry?: string | null;
  initialProvince?: string | null;
  className?: string;
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase();

const isCloseCoordinate = (
  left: readonly [number, number],
  right: readonly [number, number]
) => {
  const longitudeDelta = left[0] - right[0];
  const latitudeDelta = left[1] - right[1];
  return Math.hypot(longitudeDelta, latitudeDelta) <= 0.35;
};

const findEntryForCity = (
  cityKey: string,
  entries: readonly MockEntry[]
): MockEntry | undefined => {
  const city = GEOGRAPHY_DATABASE.cities[cityKey];
  if (!city) return undefined;

  const cityNames = [cityKey, city.name.en, city.name.zh].map(normalizeText);

  return entries.find((entry) => {
    const regionNames = [entry.region.en, entry.region.zh].map(normalizeText);
    const nameMatches = cityNames.some((cityName) =>
      regionNames.some(
        (regionName) =>
          regionName.includes(cityName) || cityName.includes(regionName)
      )
    );

    return nameMatches || isCloseCoordinate(entry.coordinates, city.coords);
  });
};

const hasLocalDirectory = (country: string | null) => {
  if (!country) return false;
  if (country === "China" || country === "中国") return true;

  const countryData = GEOGRAPHY_DATABASE.countries[country];
  return Boolean(countryData?.provinces.length);
};

/**
 * Compatibility shell for the original D3 map.
 *
 * It owns the legacy navigation and timeline state so callers only need to
 * handle archive selection and optional contribution navigation.
 */
export const Legacy2DMap: FC<Legacy2DMapProps> = ({
  currentLanguage,
  onSelectEntry,
  onRequestContribution,
  getCombinedEvents,
  entries = MOCK_ENTRIES,
  initialTimelineYear = 2026,
  initialLevel = 1,
  initialContinent = null,
  initialCountry = null,
  initialProvince = null,
  className = "legacy-2d-map"
}) => {
  const [activeTimelineYear, setActiveTimelineYear] =
    useState(initialTimelineYear);
  const [currentLevel, setCurrentLevel] = useState<LegacyMapLevel>(initialLevel);
  const [activeContinent, setActiveContinent] = useState<string | null>(
    initialContinent
  );
  const [activeCountry, setActiveCountry] = useState<string | null>(
    initialCountry
  );
  const [activeProvince, setActiveProvince] = useState<string | null>(
    initialProvince
  );

  const handleSelectCity = useCallback(
    (cityKey: string) => {
      const entry = findEntryForCity(cityKey, entries);
      if (entry) onSelectEntry(entry.id);
    },
    [entries, onSelectEntry]
  );

  const handleLevelChange = useCallback((level: number) => {
    if (level === 1 || level === 2 || level === 3 || level === 4) {
      setCurrentLevel(level);
    }
  }, []);

  const shouldShowFallbackDirectory =
    currentLevel === 4 && !hasLocalDirectory(activeCountry);

  return (
    <div className={className}>
      {shouldShowFallbackDirectory ? (
        <FallbackDirectory
          currentLanguage={currentLanguage}
          activeCountry={activeCountry}
          onSelectEntry={onSelectEntry}
          setActiveTab={() => onRequestContribution?.()}
        />
      ) : (
        <InteractiveMap
          currentLanguage={currentLanguage}
          activeTimelineYear={activeTimelineYear}
          currentLevel={currentLevel}
          setCurrentLevel={handleLevelChange}
          activeContinent={activeContinent}
          setActiveContinent={setActiveContinent}
          activeCountry={activeCountry}
          setActiveCountry={setActiveCountry}
          activeProvince={activeProvince}
          setActiveProvince={setActiveProvince}
          onSelectCity={handleSelectCity}
          getCombinedEvents={getCombinedEvents ?? (() => EVENTS_DATA)}
        />
      )}

      <TimeTravelTimeline
        activeTimelineYear={activeTimelineYear}
        setActiveTimelineYear={setActiveTimelineYear}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
