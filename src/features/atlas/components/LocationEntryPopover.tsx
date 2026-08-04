import type { ArchiveEntry, Language } from "../types";
import type { LocationGroup } from "../rendering/locationGroups";
import { getEntryDisplayPeriod, getEntryPrimaryLocation } from "../selectors";

interface LocationEntryPopoverProps {
  group: LocationGroup;
  entries: readonly ArchiveEntry[];
  language: Language;
  onSelectEntry: (entryId: string) => void;
  onClose: () => void;
}
export function LocationEntryPopover({ group, entries, language, onSelectEntry, onClose }: LocationEntryPopoverProps) {
  return (
    <aside className="atlas-location-popover" role="dialog" aria-labelledby="atlas-location-popover-title" data-testid="location-entry-popover">
      <div className="atlas-location-popover-header">
        <div>
          <span className="atlas-detail-eyebrow">COORDINATE INDEX / {group.precision.toUpperCase()}</span>
          <h3 id="atlas-location-popover-title">{group.name[language]}</h3>
          <p>{group.latitude.toFixed(3)}°, {group.longitude.toFixed(3)}° · {group.entryIds.length} {group.entryIds.length === 1 ? "record" : "records"}</p>
        </div>
        <button type="button" className="atlas-icon-button" aria-label={language === "zh" ? "关闭地点列表" : "Close location list"} onClick={onClose}>×</button>
      </div>
      <ol className="atlas-location-entry-list">
        {entries.map(entry => {
          const location = getEntryPrimaryLocation(entry);
          return (
            <li key={entry.id}>
              <button type="button" onClick={() => onSelectEntry(entry.id)}>
                <strong>{entry.title[language]}</strong>
                <span>{getEntryDisplayPeriod(entry)[language]}</span>
                <small>{location?.name[language] ?? group.name[language]}</small>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
